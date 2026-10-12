"""
Feature flags. Admins switch a feature on for everyone or for chosen users
(full admins only); the app reads which flags are on for the signed-in user.
"""
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from database import get_db
from models.admin import Admin
from models.feature_flag import FeatureFlag, FeatureFlagUser
from models.user import User
from routes.user_auth import get_current_user
from schemas.feature_flag import (
    AppFeatureFlagsResponse,
    FeatureFlagAddUser,
    FeatureFlagDetailResponse,
    FeatureFlagResponse,
    FeatureFlagUpdate,
    FeatureFlagUserResponse,
)
from services import feature_flags
from utils.auth import require_full_admin

router = APIRouter(prefix="/feature-flags", tags=["Feature flags (admin)"])
app_router = APIRouter(prefix="/v1/feature-flags", tags=["Feature flags"])


def known_key(key: str) -> str:
    if key not in feature_flags.FLAGS:
        raise HTTPException(status_code=404, detail="Unknown feature flag")
    return key


def parse_user_id(value: str) -> UUID:
    try:
        return UUID(value)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")


async def flag_detail(db: AsyncSession, key: str) -> FeatureFlagDetailResponse:
    flag = await db.get(FeatureFlag, key)
    rows = (
        await db.execute(
            select(FeatureFlagUser)
            .options(joinedload(FeatureFlagUser.user))
            .where(FeatureFlagUser.flag_key == key)
            .order_by(FeatureFlagUser.created_at.desc())
        )
    ).scalars().all()
    return FeatureFlagDetailResponse(
        key=key,
        **feature_flags.FLAGS[key],
        enabled_for_all=bool(flag and flag.enabled_for_all),
        user_count=len(rows),
        updated_at=flag.updated_at if flag else None,
        users=[
            FeatureFlagUserResponse(
                id=str(r.user.id),
                name=r.user.name,
                email=r.user.email,
                whatsapp_number=r.user.whatsapp_number,
                added_at=r.created_at,
            )
            for r in rows
        ],
    )


@router.get("", response_model=list[FeatureFlagResponse])
async def list_flags(
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    stored = {f.key: f for f in (await db.execute(select(FeatureFlag))).scalars()}
    counts = dict(
        (await db.execute(
            select(FeatureFlagUser.flag_key, func.count(FeatureFlagUser.id)).group_by(FeatureFlagUser.flag_key)
        )).all()
    )
    return [
        FeatureFlagResponse(
            key=key,
            **meta,
            enabled_for_all=bool(stored.get(key) and stored[key].enabled_for_all),
            user_count=counts.get(key, 0),
            updated_at=stored[key].updated_at if key in stored else None,
        )
        for key, meta in feature_flags.FLAGS.items()
    ]


@router.get("/{key}", response_model=FeatureFlagDetailResponse)
async def get_flag(
    key: str,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    return await flag_detail(db, known_key(key))


@router.put("/{key}", response_model=FeatureFlagDetailResponse)
async def update_flag(
    key: str,
    payload: FeatureFlagUpdate,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    """Turn a feature on or off for every user. Chosen users keep it either way."""
    flag = await feature_flags.get_or_create_flag(db, known_key(key))
    flag.enabled_for_all = payload.enabled_for_all
    flag.updated_by = admin.id
    await db.commit()
    return await flag_detail(db, key)


@router.post("/{key}/users", response_model=FeatureFlagDetailResponse, status_code=status.HTTP_201_CREATED)
async def add_flag_user(
    key: str,
    payload: FeatureFlagAddUser,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    flag = await feature_flags.get_or_create_flag(db, known_key(key))
    user = await db.get(User, parse_user_id(payload.user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.execute(
        insert(FeatureFlagUser)
        .values(id=uuid4(), flag_key=key, user_id=user.id, created_at=func.now())
        .on_conflict_do_nothing(constraint="unique_feature_flag_user")
    )
    flag.updated_by = admin.id
    await db.commit()
    return await flag_detail(db, key)


@router.delete("/{key}/users/{user_id}", response_model=FeatureFlagDetailResponse)
async def remove_flag_user(
    key: str,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    row = (
        await db.execute(
            select(FeatureFlagUser).where(
                FeatureFlagUser.flag_key == known_key(key),
                FeatureFlagUser.user_id == parse_user_id(user_id),
            )
        )
    ).scalar_one_or_none()
    if row:
        await db.delete(row)
        await db.commit()
    return await flag_detail(db, key)


@app_router.get("", response_model=AppFeatureFlagsResponse)
async def my_flags(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return AppFeatureFlagsResponse(flags=await feature_flags.enabled_flags_for(db, current_user.id))
