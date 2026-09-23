from datetime import datetime, timezone
from uuid import UUID
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.app_open_ad import AppOpenAd
from models.admin import Admin
from schemas.app_open_ad import AppOpenAdCreate, AppOpenAdUpdate, AppOpenAdResponse
from utils.auth import require_full_admin

router = APIRouter(prefix="/app-open-ad", tags=["App Open Ad"])


def ad_to_response(ad: AppOpenAd) -> dict:
    return {
        "id": str(ad.id),
        "file": ad.file,
        "is_active": ad.is_active,
        "link": ad.link,
        "is_deleted": ad.is_deleted,
        "created_at": ad.created_at,
        "updated_at": ad.updated_at,
    }


@router.get("", response_model=list[AppOpenAdResponse])
async def list_app_open_ads(
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    """Admin: all non-deleted app-open ad images, newest first."""
    result = await db.execute(
        select(AppOpenAd)
        .where(AppOpenAd.is_deleted == False)
        .order_by(AppOpenAd.created_at.desc())
    )
    ads = result.scalars().all()
    return [ad_to_response(a) for a in ads]


@router.get("/active", response_model=AppOpenAdResponse)
async def get_active_app_open_ad(db: AsyncSession = Depends(get_db)):
    """
    Public, used by the mobile app: the most recently created active
    app-open ad image. 404 if none is active (app simply skips this step).
    """
    result = await db.execute(
        select(AppOpenAd)
        .where(AppOpenAd.is_deleted == False, AppOpenAd.is_active == True)
        .order_by(AppOpenAd.created_at.desc())
        .limit(1)
    )
    ad = result.scalar_one_or_none()
    if not ad:
        raise HTTPException(status_code=404, detail="No active app-open ad")
    return ad_to_response(ad)


@router.post("", response_model=AppOpenAdResponse, status_code=status.HTTP_201_CREATED)
async def create_app_open_ad(
    ad: AppOpenAdCreate,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    new_ad = AppOpenAd(file=ad.file, is_active=ad.is_active, link=ad.link)
    db.add(new_ad)
    await db.commit()
    await db.refresh(new_ad)
    return ad_to_response(new_ad)


@router.put("/{ad_id}", response_model=AppOpenAdResponse)
async def update_app_open_ad(
    ad_id: str,
    update: AppOpenAdUpdate,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    try:
        uuid_id = UUID(ad_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ad ID")

    existing = await db.get(AppOpenAd, uuid_id)
    if not existing or existing.is_deleted:
        raise HTTPException(status_code=404, detail="App-open ad not found")

    existing.is_active = update.is_active
    existing.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(existing)
    return ad_to_response(existing)


@router.delete("/{ad_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_app_open_ad(
    ad_id: str,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    try:
        uuid_id = UUID(ad_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ad ID")

    existing = await db.get(AppOpenAd, uuid_id)
    if not existing or existing.is_deleted:
        raise HTTPException(status_code=404, detail="App-open ad not found")

    existing.is_deleted = True
    existing.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return None
