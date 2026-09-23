from datetime import datetime, timezone
from uuid import UUID
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.splash import SplashResource
from models.admin import Admin
from schemas.splash import SplashResourceCreate, SplashResourceUpdate, SplashResourceResponse
from utils.auth import require_full_admin

router = APIRouter(prefix="/splash", tags=["Splash"])


def splash_to_response(resource: SplashResource) -> dict:
    return {
        "id": str(resource.id),
        "resource_type": resource.resource_type,
        "file": resource.file,
        "is_active": resource.is_active,
        "is_deleted": resource.is_deleted,
        "created_at": resource.created_at,
        "updated_at": resource.updated_at,
    }


@router.get("", response_model=list[SplashResourceResponse])
async def list_splash_resources(
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    """Admin: all non-deleted splash resources, newest first."""
    result = await db.execute(
        select(SplashResource)
        .where(SplashResource.is_deleted == False)
        .order_by(SplashResource.created_at.desc())
    )
    resources = result.scalars().all()
    return [splash_to_response(r) for r in resources]


@router.get("/active", response_model=SplashResourceResponse)
async def get_active_splash(db: AsyncSession = Depends(get_db)):
    """
    Public, used by the mobile app: the most recently created active
    splash resource. 404 if none is active (app falls back to its
    built-in static splash).
    """
    result = await db.execute(
        select(SplashResource)
        .where(SplashResource.is_deleted == False, SplashResource.is_active == True)
        .order_by(SplashResource.created_at.desc())
        .limit(1)
    )
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="No active splash resource")
    return splash_to_response(resource)


@router.post("", response_model=SplashResourceResponse, status_code=status.HTTP_201_CREATED)
async def create_splash_resource(
    resource: SplashResourceCreate,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    new_resource = SplashResource(
        resource_type=resource.resource_type,
        file=resource.file,
        is_active=resource.is_active,
    )
    db.add(new_resource)
    await db.commit()
    await db.refresh(new_resource)
    return splash_to_response(new_resource)


@router.put("/{resource_id}", response_model=SplashResourceResponse)
async def update_splash_resource(
    resource_id: str,
    update: SplashResourceUpdate,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    try:
        uuid_id = UUID(resource_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid resource ID")

    existing = await db.get(SplashResource, uuid_id)
    if not existing or existing.is_deleted:
        raise HTTPException(status_code=404, detail="Splash resource not found")

    existing.is_active = update.is_active
    existing.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(existing)
    return splash_to_response(existing)


@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_splash_resource(
    resource_id: str,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    try:
        uuid_id = UUID(resource_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid resource ID")

    existing = await db.get(SplashResource, uuid_id)
    if not existing or existing.is_deleted:
        raise HTTPException(status_code=404, detail="Splash resource not found")

    existing.is_deleted = True
    existing.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return None
