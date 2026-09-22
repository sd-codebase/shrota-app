import uuid
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from models.base import Base, TimestampMixin


class Admin(Base, TimestampMixin):
    __tablename__ = "admins"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # "admin" — full access. "publisher" — scoped to their own books/chapters
    # only, plus read-only reference data. See utils/auth.require_full_admin.
    role: Mapped[str] = mapped_column(String(20), default="admin", nullable=False)
