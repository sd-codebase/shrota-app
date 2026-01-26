from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from schemas.user import UserResponse
from routes.user_auth import get_current_user

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

    return UserResponse(
        id=str(current_user.id),
        name=current_user.name,
        email=current_user.email,
        whatsapp_number=current_user.whatsapp_number,
        birth_date=current_user.birth_date,
        is_email_verified=current_user.is_email_verified,
        is_whatsapp_verified=current_user.is_whatsapp_verified,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
    )
