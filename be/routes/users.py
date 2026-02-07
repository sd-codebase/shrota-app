from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from schemas.user import UserResponse, UserUpdate
from routes.user_auth import get_current_user, build_user_response

router = APIRouter(prefix="/v1/users", tags=["Users"])


@router.post("/me/deactivate", response_model=UserResponse)
async def deactivate_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Deactivate the current user's account.

    After deactivation, the user will not be able to login again.
    """
    current_user.is_active = False
    await db.commit()
    await db.refresh(current_user)

    return build_user_response(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user's profile."""
    update_data = user_update.model_dump(exclude_unset=True)

    # If updating whatsapp_number, only allow if not yet verified
    if 'whatsapp_number' in update_data:
        if current_user.is_whatsapp_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot change a verified WhatsApp number"
            )
        # If number is changing, clear any pending OTP
        if update_data['whatsapp_number'] != current_user.whatsapp_number:
            current_user.whatsapp_otp = None

    for key, value in update_data.items():
        setattr(current_user, key, value)

    current_user.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(current_user)

    return build_user_response(current_user)
