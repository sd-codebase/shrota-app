from datetime import datetime, timezone
from uuid import UUID
from math import ceil
from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from database import get_db
from models.user import User
from models.admin import Admin
from schemas.user import UserResponse, UserAdminUpdate, UserListResponse
from utils.auth import get_current_admin

router = APIRouter(prefix="/admin/users", tags=["Admin Users"])


def user_to_response(user: User) -> dict:
    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "birth_date": user.birth_date,
        "is_email_verified": user.is_email_verified,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    }


@router.get("", response_model=UserListResponse)
async def get_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """Get paginated list of users with optional search."""
    query = select(User)
    count_query = select(func.count(User.id))

    # Apply search filter
    if search:
        search_filter = or_(
            User.name.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Calculate pagination
    total_pages = ceil(total / per_page) if total > 0 else 1
    offset = (page - 1) * per_page

    # Get paginated results
    query = query.order_by(User.created_at.desc()).offset(offset).limit(per_page)
    result = await db.execute(query)
    users = result.scalars().all()

    return {
        "users": [user_to_response(u) for u in users],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
    }


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """Get a single user by ID."""
    try:
        uuid_id = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    user = await db.get(User, uuid_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user_to_response(user)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserAdminUpdate,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """Update user information."""
    try:
        uuid_id = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    user = await db.get(User, uuid_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Check for email uniqueness if email is being updated
    if "email" in update_data and update_data["email"] != user.email:
        existing = await db.execute(
            select(User).where(User.email == update_data["email"], User.id != uuid_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already in use")

    for key, value in update_data.items():
        setattr(user, key, value)
    user.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(user)
    return user_to_response(user)


@router.put("/{user_id}/toggle-status", response_model=UserResponse)
async def toggle_user_status(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """Toggle user's active status."""
    try:
        uuid_id = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    user = await db.get(User, uuid_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = not user.is_active
    user.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(user)
    return user_to_response(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """Delete a user. Only disabled users can be deleted."""
    try:
        uuid_id = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    user = await db.get(User, uuid_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_active:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete an active user. Please disable the user first."
        )

    await db.delete(user)
    await db.commit()
    return None
