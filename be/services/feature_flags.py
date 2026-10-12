"""
Feature flags: turn an app feature on for every user, or only for chosen
users (e.g. testers) before a wider rollout. Admins change them in the
dashboard; the app asks GET /v1/feature-flags, and the server checks the
same flags wherever a feature changes what a user may do.
"""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.feature_flag import FeatureFlag, FeatureFlagUser

PAYMENTS = "payments"

# Every flag the code knows about. Unknown keys can't be created from the
# admin, since nothing would read them.
FLAGS: dict[str, dict[str, str]] = {
    PAYMENTS: {
        "name": "In-app purchases",
        "description": (
            "Prime and Subscriber books are locked and sold through Google Play. "
            "Users without it can listen to every book, and see no purchase screens."
        ),
    },
}


async def get_or_create_flag(db: AsyncSession, key: str) -> FeatureFlag:
    flag = await db.get(FeatureFlag, key)
    if flag is None:
        flag = FeatureFlag(key=key, enabled_for_all=False)
        db.add(flag)
        await db.flush()
    return flag


async def enabled_flags_for(db: AsyncSession, user_id: uuid.UUID) -> dict[str, bool]:
    """Every known flag, and whether it's on for this user."""
    on_for_all = {
        f.key for f in (await db.execute(select(FeatureFlag).where(FeatureFlag.enabled_for_all == True))).scalars()
    }
    on_for_user = set(
        (await db.execute(select(FeatureFlagUser.flag_key).where(FeatureFlagUser.user_id == user_id))).scalars()
    )
    return {key: key in on_for_all or key in on_for_user for key in FLAGS}


async def is_enabled(db: AsyncSession, key: str, user_id: uuid.UUID) -> bool:
    flag = await db.get(FeatureFlag, key)
    if flag is not None and flag.enabled_for_all:
        return True
    found = await db.scalar(
        select(FeatureFlagUser.id).where(FeatureFlagUser.flag_key == key, FeatureFlagUser.user_id == user_id)
    )
    return found is not None
