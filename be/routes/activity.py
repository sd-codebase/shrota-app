from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from sqlalchemy import select, update, func, or_, cast, String
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.activity import ActivitySession, ActivityEvent
from models.user import User
from models.admin import Admin
from routes.user_auth import get_optional_current_user
from schemas.activity import (
    ActivityIngestRequest,
    ActivityIngestResponse,
    ActivitySessionResponse,
    ActivitySessionListResponse,
    ActivityFilterOptions,
    ActivityEventResponse,
)
from utils.auth import require_full_admin

router = APIRouter(prefix="/activity", tags=["Activity Logs"])


def _uuid(value: str, field: str) -> UUID:
    try:
        return UUID(value)
    except (ValueError, AttributeError, TypeError):
        raise HTTPException(status_code=400, detail=f"Invalid {field}")


@router.post("/ingest", response_model=ActivityIngestResponse)
async def ingest_activity(
    payload: ActivityIngestRequest,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Batched activity ingest from the mobile app.

    Deliberately unauthenticated-friendly: the app logs from the moment it
    opens, long before the user signs in (and possibly before they ever
    do). When a token is supplied the session — including everything
    already logged anonymously — is attributed to that user.
    """
    session_id = _uuid(payload.session.session_id, "session_id")
    install_id = _uuid(payload.session.install_id, "install_id")
    user_id = user.id if user else None

    # Upsert the session. Batches arrive repeatedly for the same session,
    # and out of order after an offline spell, so never regress ended_at
    # and never clear a user that a previous batch established.
    session_values = {
        "id": session_id,
        "install_id": install_id,
        "user_id": user_id,
        "started_at": payload.session.started_at,
        "ended_at": payload.session.ended_at,
        "platform": payload.session.platform,
        "os_version": payload.session.os_version,
        "device_model": payload.session.device_model,
        "app_version": payload.session.app_version,
    }
    stmt = pg_insert(ActivitySession).values(**session_values)
    stmt = stmt.on_conflict_do_update(
        index_elements=[ActivitySession.id],
        set_={
            "ended_at": func.greatest(
                func.coalesce(ActivitySession.ended_at, payload.session.started_at),
                func.coalesce(stmt.excluded.ended_at, payload.session.started_at),
            ),
            "user_id": func.coalesce(ActivitySession.user_id, stmt.excluded.user_id),
            "app_version": func.coalesce(stmt.excluded.app_version, ActivitySession.app_version),
        },
    )
    await db.execute(stmt)

    # Once we know who this is, claim the anonymous history from this
    # install too, so pre-login sessions aren't orphaned.
    if user_id is not None:
        await db.execute(
            update(ActivitySession)
            .where(ActivitySession.install_id == install_id, ActivitySession.user_id.is_(None))
            .values(user_id=user_id)
        )
        await db.execute(
            update(ActivityEvent)
            .where(ActivityEvent.session_id == session_id, ActivityEvent.user_id.is_(None))
            .values(user_id=user_id)
        )

    accepted = 0
    duplicates = 0
    if payload.events:
        rows = [
            {
                "id": _uuid(e.event_id, "event_id"),
                "session_id": session_id,
                "user_id": user_id,
                "event_name": e.event_name,
                "params": e.params,
                "occurred_at": e.occurred_at,
            }
            for e in payload.events
        ]
        # At-least-once delivery from the device: a batch that timed out
        # after the server committed it will be sent again, so ignore ids
        # already stored rather than double-counting them.
        result = await db.execute(
            pg_insert(ActivityEvent)
            .values(rows)
            .on_conflict_do_nothing(index_elements=[ActivityEvent.id])
            .returning(ActivityEvent.id)
        )
        accepted = len(result.scalars().all())
        duplicates = len(rows) - accepted

    await db.commit()

    return ActivityIngestResponse(
        accepted=accepted,
        duplicates=duplicates,
        session_id=str(session_id),
        user_linked=user_id is not None,
    )


@router.get("/sessions", response_model=ActivitySessionListResponse)
async def list_activity_sessions(
    limit: int = 25,
    offset: int = 0,
    user_id: Optional[str] = None,
    identified: Optional[bool] = None,
    platform: Optional[str] = None,
    app_version: Optional[str] = None,
    event_name: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    """Admin: sessions newest first, with filtering and a total for paging."""
    limit = max(1, min(limit, 200))
    offset = max(0, offset)

    counts = (
        select(ActivityEvent.session_id, func.count().label("event_count"))
        .group_by(ActivityEvent.session_id)
        .subquery()
    )

    filters = []
    if user_id:
        filters.append(ActivitySession.user_id == _uuid(user_id, "user_id"))
    if identified is True:
        filters.append(ActivitySession.user_id.isnot(None))
    elif identified is False:
        filters.append(ActivitySession.user_id.is_(None))
    if platform:
        filters.append(ActivitySession.platform == platform)
    if app_version:
        filters.append(ActivitySession.app_version == app_version)
    if date_from:
        filters.append(ActivitySession.started_at >= date_from)
    if date_to:
        filters.append(ActivitySession.started_at <= date_to)
    if event_name:
        # Only sessions that actually contain this event.
        filters.append(
            select(ActivityEvent.id)
            .where(
                ActivityEvent.session_id == ActivitySession.id,
                ActivityEvent.event_name == event_name,
            )
            .exists()
        )
    if search:
        term = f"%{search.strip()}%"
        filters.append(
            or_(
                User.name.ilike(term),
                User.whatsapp_number.ilike(term),
                cast(ActivitySession.id, String).ilike(term),
                cast(ActivitySession.install_id, String).ilike(term),
            )
        )

    base = (
        select(ActivitySession, func.coalesce(counts.c.event_count, 0), User)
        .outerjoin(counts, counts.c.session_id == ActivitySession.id)
        .outerjoin(User, User.id == ActivitySession.user_id)
    )
    if filters:
        base = base.where(*filters)

    total_query = select(func.count()).select_from(
        base.with_only_columns(ActivitySession.id).order_by(None).subquery()
    )
    total = (await db.execute(total_query)).scalar_one()

    result = await db.execute(
        base.order_by(ActivitySession.started_at.desc()).limit(limit).offset(offset)
    )

    sessions = [
        ActivitySessionResponse(
            id=str(s.id),
            install_id=str(s.install_id),
            user_id=str(s.user_id) if s.user_id else None,
            user_name=u.name if u else None,
            user_whatsapp=u.whatsapp_number if u else None,
            started_at=s.started_at,
            ended_at=s.ended_at,
            platform=s.platform,
            os_version=s.os_version,
            device_model=s.device_model,
            app_version=s.app_version,
            event_count=count,
            created_at=s.created_at,
            updated_at=s.updated_at,
        )
        for s, count, u in result.all()
    ]
    return ActivitySessionListResponse(sessions=sessions, total=total, limit=limit, offset=offset)


@router.get("/filter-options", response_model=ActivityFilterOptions)
async def get_filter_options(
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    """Admin: the distinct values actually present, to populate dropdowns."""
    platforms = await db.execute(
        select(ActivitySession.platform).where(ActivitySession.platform.isnot(None)).distinct()
    )
    versions = await db.execute(
        select(ActivitySession.app_version).where(ActivitySession.app_version.isnot(None)).distinct()
    )
    names = await db.execute(select(ActivityEvent.event_name).distinct())
    return ActivityFilterOptions(
        platforms=sorted(p for p in platforms.scalars().all()),
        app_versions=sorted(v for v in versions.scalars().all()),
        event_names=sorted(n for n in names.scalars().all()),
    )


@router.get("/sessions/{session_id}/events", response_model=list[ActivityEventResponse])
async def list_session_events(
    session_id: str,
    event_name: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    """Admin: the full timeline for one session, in the order it happened."""
    conditions = [ActivityEvent.session_id == _uuid(session_id, "session_id")]
    if event_name:
        conditions.append(ActivityEvent.event_name == event_name)
    result = await db.execute(
        select(ActivityEvent)
        .where(*conditions)
        .order_by(ActivityEvent.occurred_at.asc())
    )
    return [
        ActivityEventResponse(
            id=str(e.id),
            session_id=str(e.session_id),
            user_id=str(e.user_id) if e.user_id else None,
            event_name=e.event_name,
            params=e.params,
            occurred_at=e.occurred_at,
            received_at=e.received_at,
        )
        for e in result.scalars().all()
    ]
