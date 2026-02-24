from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
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
    VerifyWhatsAppOTPRequest,
    WhatsAppStatusResponse,
    SendChangeWhatsAppOTPRequest,
    VerifyChangeWhatsAppRequest,
)
from utils.otp import store_otp, verify_otp, get_otp_expiry_seconds
from utils.auth import create_access_token, decode_access_token
from utils.age import is_eligible_for_registration
from config import JWT_ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/v1/auth", tags=["User Authentication"])

security = HTTPBearer()


def build_user_response(user: User) -> UserResponse:
    """Build a UserResponse from a User model instance."""
    return UserResponse(
        id=str(user.id),
        name=user.name,
        email=user.email,
        birth_date=user.birth_date,
        is_email_verified=user.is_email_verified,
        is_active=user.is_active,
        whatsapp_number=user.whatsapp_number,
        country_code=user.country_code,
        is_whatsapp_verified=user.is_whatsapp_verified,
        whatsapp_otp_sent=user.whatsapp_otp is not None,
        address=user.address,
        village_landmark=user.village_landmark,
        tahsil_city=user.tahsil_city,
        district=user.district,
        state=user.state,
        pin_code=user.pin_code,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


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
    Register a new user with email and WhatsApp number.
    """
    # Check for existing user with same email
    result = await db.execute(select(User).where(User.email == payload.email.lower()))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    # Check for existing user with same WhatsApp number (if provided)
    if payload.whatsapp_number:
        result = await db.execute(
            select(User).where(
                User.whatsapp_number == payload.whatsapp_number,
                User.whatsapp_number.isnot(None)
            )
        )
        existing_wa_user = result.scalar_one_or_none()
        if existing_wa_user:
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
        email=payload.email.lower(),
        birth_date=payload.birth_date,
        whatsapp_number=payload.whatsapp_number,
        country_code=payload.country_code,
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return build_user_response(user)


@router.post("/send-otp", response_model=SendOTPResponse)
async def send_otp(
    payload: SendOTPRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Send OTP to user's email or WhatsApp.
    """
    identifier = payload.identifier.lower()

    if payload.otp_type == "whatsapp":
        # Find user by WhatsApp number
        result = await db.execute(
            select(User).where(
                User.whatsapp_number == identifier,
                User.whatsapp_number.isnot(None)
            )
        )
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found with this WhatsApp number"
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deleted, contact support for help."
            )

        # Use full phone number (country_code + number) for OTP sending
        full_phone = f"{user.country_code}{user.whatsapp_number}"
        success, message = await store_otp(full_phone, payload.otp_type)
    else:
        # Find user by email
        result = await db.execute(select(User).where(User.email == identifier))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found with this email"
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deleted, contact support for help."
            )

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

    if payload.otp_type == "whatsapp":
        # Find user by WhatsApp number
        result = await db.execute(
            select(User).where(
                User.whatsapp_number == identifier,
                User.whatsapp_number.isnot(None)
            )
        )
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Verify OTP using full phone number
        full_phone = f"{user.country_code}{user.whatsapp_number}"
        if not verify_otp(full_phone, payload.otp, payload.otp_type):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP"
            )

        # Mark WhatsApp as verified
        if not user.is_whatsapp_verified:
            user.is_whatsapp_verified = True
            await db.commit()
            await db.refresh(user)
    else:
        # Verify OTP for email
        if not verify_otp(identifier, payload.otp, payload.otp_type):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP"
            )

        # Find user by email
        result = await db.execute(select(User).where(User.email == identifier))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Mark email as verified
        if not user.is_email_verified:
            user.is_email_verified = True
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
        user=build_user_response(user),
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user's information.
    """
    return build_user_response(current_user)


@router.get("/whatsapp-status", response_model=WhatsAppStatusResponse)
async def get_whatsapp_status(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's WhatsApp verification status.
    Used by mobile app for 24h reminder check.
    """
    return WhatsAppStatusResponse(
        whatsapp_number=current_user.whatsapp_number,
        is_whatsapp_verified=current_user.is_whatsapp_verified,
        otp_sent=current_user.whatsapp_otp is not None,
    )


@router.post("/verify-whatsapp-otp", response_model=UserResponse)
async def verify_whatsapp_otp(
    payload: VerifyWhatsAppOTPRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Verify WhatsApp OTP. Compares submitted OTP with stored whatsapp_otp.
    On success, sets is_whatsapp_verified=True and clears OTP.
    """
    if current_user.is_whatsapp_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WhatsApp number is already verified"
        )

    if current_user.whatsapp_otp is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP has been sent yet. Please contact admin."
        )

    if current_user.whatsapp_otp != payload.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP"
        )

    current_user.is_whatsapp_verified = True
    current_user.whatsapp_otp = None
    await db.commit()
    await db.refresh(current_user)

    return build_user_response(current_user)


@router.post("/send-change-whatsapp-otp", response_model=SendOTPResponse)
async def send_change_whatsapp_otp(
    payload: SendChangeWhatsAppOTPRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Send OTP to a new WhatsApp number for changing/verifying.
    Does NOT update user record yet - that happens after verification.
    """
    full_phone = f"{payload.country_code}{payload.whatsapp_number}"

    success, message = await store_otp(full_phone, "whatsapp")

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=message
        )

    return SendOTPResponse(
        message=message,
        expires_in=get_otp_expiry_seconds()
    )


@router.post("/verify-change-whatsapp", response_model=UserResponse)
async def verify_change_whatsapp(
    payload: VerifyChangeWhatsAppRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Verify OTP for a new WhatsApp number and update user record.
    """
    full_phone = f"{payload.country_code}{payload.whatsapp_number}"

    # Verify the OTP
    if not verify_otp(full_phone, payload.otp, "whatsapp"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )

    # Check uniqueness of new number (skip if same user already has it)
    if payload.whatsapp_number != current_user.whatsapp_number:
        result = await db.execute(
            select(User).where(
                User.whatsapp_number == payload.whatsapp_number,
                User.whatsapp_number.isnot(None),
                User.id != current_user.id,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This WhatsApp number is already registered to another user"
            )

    # Update user record
    current_user.whatsapp_number = payload.whatsapp_number
    current_user.country_code = payload.country_code
    current_user.is_whatsapp_verified = True
    await db.commit()
    await db.refresh(current_user)

    return build_user_response(current_user)
