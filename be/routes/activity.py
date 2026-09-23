from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update, func
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


@router.get("/sessions", response_model=list[ActivitySessionResponse])
async def list_activity_sessions(
    limit: int = 50,
    offset: int = 0,
    user_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    """Admin: recent sessions, newest first, with their event counts."""
    limit = max(1, min(limit, 200))

    count_sq = (
        select(ActivityEvent.session_id, func.count().label("event_count"))
        .group_by(ActivityEvent.session_id)
        .subquery()
    )
    query = (
        select(ActivitySession, func.coalesce(count_sq.c.event_count, 0))
        .outerjoin(count_sq, count_sq.c.session_id == ActivitySession.id)
        .order_by(ActivitySession.started_at.desc())
        .limit(limit)
        .offset(max(0, offset))
    )
    if user_id:
        query = query.where(ActivitySession.user_id == _uuid(user_id, "user_id"))

    result = await db.execute(query)
    return [
        ActivitySessionResponse(
            id=str(s.id),
            install_id=str(s.install_id),
            user_id=str(s.user_id) if s.user_id else None,
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
        for s, count in result.all()
    ]


@router.get("/sessions/{session_id}/events", response_model=list[ActivityEventResponse])
async def list_session_events(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    """Admin: the full timeline for one session, in the order it happened."""
    result = await db.execute(
        select(ActivityEvent)
        .where(ActivityEvent.session_id == _uuid(session_id, "session_id"))
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
