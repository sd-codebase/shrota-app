from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from database import get_db
from models.user import User
from schemas.user import (
    UserRegister,
    UserResponse,
    SendOTPRequest,
    SendOTPResponse,
    VerifyOTPRequest,
    UserTokenResponse,
)
from utils.otp import store_otp, verify_otp, get_otp_expiry_seconds
from utils.auth import create_access_token, decode_access_token
from utils.age import is_eligible_for_registration
from config import JWT_ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/v1/auth", tags=["User Authentication"])

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """FastAPI dependency to get the current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise credentials_exception

    # Check if this is a user token (not admin)
    token_type = payload.get("type")
    if token_type != "user":
        raise credentials_exception

    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deleted, contact support for help."
        )

    return user


async def get_optional_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    FastAPI dependency to optionally get the current authenticated user.
    Returns User if valid auth token present, None otherwise.
    Does NOT raise exception for missing or invalid auth.
    """
    if not authorization:
        return None

    # Extract token from "Bearer <token>" format
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    token = parts[1]
    payload = decode_access_token(token)

    if payload is None:
        return None

    # Check if this is a user token (not admin)
    token_type = payload.get("type")
    if token_type != "user":
        return None

    user_id: str = payload.get("sub")
    if user_id is None:
        return None

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        return None

    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    payload: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user.

    At least one of email or whatsapp_number must be provided.
    """
    # Check for existing user with same email or WhatsApp
    conditions = []
    if payload.email:
        conditions.append(User.email == payload.email.lower())
    if payload.whatsapp_number:
        conditions.append(User.whatsapp_number == payload.whatsapp_number)

    if conditions:
        result = await db.execute(select(User).where(or_(*conditions)))
        existing_user = result.scalar_one_or_none()

        if existing_user:
            if payload.email and existing_user.email == payload.email.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User with this email already exists"
                )
            if payload.whatsapp_number and existing_user.whatsapp_number == payload.whatsapp_number:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User with this WhatsApp number already exists"
                )

    # Validate age - user must be at least 13 years and 1 day old
    if not is_eligible_for_registration(payload.birth_date):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must be at least 13 years old to register"
        )

    # Create new user
    user = User(
        name=payload.name,
        email=payload.email.lower() if payload.email else None,
        whatsapp_number=payload.whatsapp_number,
        birth_date=payload.birth_date,
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return UserResponse(
        id=str(user.id),
        name=user.name,
        email=user.email,
        whatsapp_number=user.whatsapp_number,
        birth_date=user.birth_date,
        is_email_verified=user.is_email_verified,
        is_whatsapp_verified=user.is_whatsapp_verified,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.post("/send-otp", response_model=SendOTPResponse)
async def send_otp(
    payload: SendOTPRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Send OTP to user's email or WhatsApp.

    The OTP will be logged to the FastAPI console (simulated sending).
    """
    identifier = payload.identifier.lower()

    # Find user by email or WhatsApp
    if payload.otp_type == "email":
        result = await db.execute(select(User).where(User.email == identifier))
    else:
        result = await db.execute(select(User).where(User.whatsapp_number == identifier))

    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User not found with this {payload.otp_type}"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deleted, contact support for help."
        )

    # Generate and store OTP
    success, message = await store_otp(identifier, payload.otp_type)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=message
        )

    return SendOTPResponse(
        message=message,
        expires_in=get_otp_expiry_seconds()
    )


@router.post("/verify-otp", response_model=UserTokenResponse)
async def verify_otp_endpoint(
    payload: VerifyOTPRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Verify OTP and return JWT token on success.
    """
    identifier = payload.identifier.lower()

    # Verify OTP
    if not verify_otp(identifier, payload.otp, payload.otp_type):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )

    # Find user
    if payload.otp_type == "email":
        result = await db.execute(select(User).where(User.email == identifier))
    else:
        result = await db.execute(select(User).where(User.whatsapp_number == identifier))

    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Mark appropriate contact method as verified
    if payload.otp_type == "email" and not user.is_email_verified:
        user.is_email_verified = True
        await db.commit()
        await db.refresh(user)
    elif payload.otp_type == "whatsapp" and not user.is_whatsapp_verified:
        user.is_whatsapp_verified = True
        await db.commit()
        await db.refresh(user)

    # Create JWT token with user type
    access_token = create_access_token(
        data={"sub": str(user.id), "type": "user"}
    )

    return UserTokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse(
            id=str(user.id),
            name=user.name,
            email=user.email,
            whatsapp_number=user.whatsapp_number,
            birth_date=user.birth_date,
            is_email_verified=user.is_email_verified,
            is_whatsapp_verified=user.is_whatsapp_verified,
            is_active=user.is_active,
            address=user.address,
            village_landmark=user.village_landmark,
            tahsil_city=user.tahsil_city,
            district=user.district,
            state=user.state,
            pin_code=user.pin_code,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user's information.
    """
    return UserResponse(
        id=str(current_user.id),
        name=current_user.name,
        email=current_user.email,
        whatsapp_number=current_user.whatsapp_number,
        birth_date=current_user.birth_date,
        is_email_verified=current_user.is_email_verified,
        is_whatsapp_verified=current_user.is_whatsapp_verified,
        is_active=current_user.is_active,
        address=current_user.address,
        village_landmark=current_user.village_landmark,
        tahsil_city=current_user.tahsil_city,
        district=current_user.district,
        state=current_user.state,
        pin_code=current_user.pin_code,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
    )
