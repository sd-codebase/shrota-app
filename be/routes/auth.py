from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func

from database import get_db
from models.admin import Admin
from schemas.admin import AdminLogin, AdminCreate, AdminResponse, TokenResponse
from utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_admin,
    get_optional_current_admin,
)
from config import JWT_ACCESS_TOKEN_EXPIRE_MINUTES


router = APIRouter(prefix="/auth", tags=["Authentication"])


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


@router.post("/login", response_model=TokenResponse)
async def login(credentials: AdminLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate admin and return JWT token."""
    # Find admin by email or username
    result = await db.execute(
        select(Admin).where(
            or_(Admin.email == credentials.email, Admin.username == credentials.email)
        )
    )
    admin = result.scalar_one_or_none()

    if admin is None or not verify_password(credentials.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is disabled"
        )

    # Create access token
    access_token = create_access_token(
        data={"sub": str(admin.id)},
        expires_delta=timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        admin=_admin_to_response(admin),
    )


@router.get("/me", response_model=AdminResponse)
async def get_current_admin_info(admin: Admin = Depends(get_current_admin)):
    """Get current authenticated admin info."""
    return _admin_to_response(admin)


@router.post("/register", response_model=AdminResponse, status_code=status.HTTP_201_CREATED)
async def register_admin(
    admin_data: AdminCreate,
    db: AsyncSession = Depends(get_db),
    requester: Optional[Admin] = Depends(get_optional_current_admin),
):
    """
    Create a new admin/publisher account.

    Bootstrap exception: if no admin accounts exist yet, this endpoint may
    be called without auth to create the very first (always full-admin)
    account. Once at least one admin exists, only a logged-in full Admin
    may create further accounts — Publishers cannot create accounts at all.
    """
    count_result = await db.execute(select(func.count(Admin.id)))
    existing_admin_count = count_result.scalar() or 0

    if existing_admin_count > 0:
        if requester is None or requester.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only an administrator can create new accounts",
            )
        role = admin_data.role
    else:
        # First account ever — always a full admin, regardless of what was sent.
        role = "admin"

    # Check if email already exists
    result = await db.execute(select(Admin).where(Admin.email == admin_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Check if username already exists
    result = await db.execute(select(Admin).where(Admin.username == admin_data.username))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Create new admin
    admin = Admin(
        email=admin_data.email,
        username=admin_data.username,
        password_hash=hash_password(admin_data.password),
        name=admin_data.name,
        role=role,
    )

    db.add(admin)
    await db.commit()
    await db.refresh(admin)

    return _admin_to_response(admin)
