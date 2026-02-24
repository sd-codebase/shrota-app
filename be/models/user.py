import uuid
from datetime import date
from typing import TYPE_CHECKING
from sqlalchemy import String, Boolean, Date, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from models.user_preferences import UserPreferences


class User(Base, TimestampMixin):
    """Mobile app user model for OTP-based authentication."""
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    birth_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # WhatsApp verification
    whatsapp_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    country_code: Mapped[str] = mapped_column(String(4), default="91", nullable=False)
    is_whatsapp_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    whatsapp_otp: Mapped[str | None] = mapped_column(String(6), nullable=True)

    # Address fields (all optional)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    village_landmark: Mapped[str | None] = mapped_column(String(200), nullable=True)
    tahsil_city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    district: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pin_code: Mapped[str | None] = mapped_column(String(10), nullable=True)

    # Relationships
    preferences: Mapped["UserPreferences"] = relationship(
        "UserPreferences",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        Index('ix_users_email_lower', 'email'),
    )
