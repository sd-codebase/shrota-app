from uuid import UUID
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models.admin import Admin
from schemas.admin import AdminResponse, AdminTeamUpdate
from utils.auth import require_full_admin

router = APIRouter(prefix="/admin/team", tags=["Admin Team"])


def _admin_to_response(admin: Admin) -> AdminResponse:
    return AdminResponse(
        id=str(admin.id),
        email=admin.email,
        username=admin.username,
        name=admin.name,
        is_active=admin.is_active,
        role=admin.role,
        created_at=admin.created_at,
        updated_at=admin.updated_at,
    )


@router.get("", response_model=list[AdminResponse])
async def list_team(
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    """List all admin/publisher accounts. Full admins only."""
    result = await db.execute(select(Admin).order_by(Admin.created_at.desc()))
    accounts = result.scalars().all()
    return [_admin_to_response(a) for a in accounts]


@router.put("/{admin_id}", response_model=AdminResponse)
async def update_team_member(
    admin_id: str,
    update: AdminTeamUpdate,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    """
    Update another account's name/role/active status. Full admins only.
    An admin cannot deactivate or demote their own account (to avoid
    accidentally locking everyone out).
    """
    try:
        uuid_id = UUID(admin_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid admin ID")

    target = await db.get(Admin, uuid_id)
    if not target:
        raise HTTPException(status_code=404, detail="Account not found")

    update_data = update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    if target.id == admin.id:
        if update_data.get("is_active") is False:
            raise HTTPException(status_code=400, detail="You cannot deactivate your own account")
        if update_data.get("role") == "publisher":
            raise HTTPException(status_code=400, detail="You cannot demote your own account")

    for key, value in update_data.items():
        setattr(target, key, value)

    await db.commit()
    await db.refresh(target)
    return _admin_to_response(target)
