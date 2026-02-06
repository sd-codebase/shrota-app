import uuid
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from models.base import Base, TimestampMixin


class Notification(Base, TimestampMixin):
    """Model for storing sent push notifications."""

    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str] = mapped_column(String(500), nullable=True)
    topic: Mapped[str] = mapped_column(String(100), nullable=False, default="all_users")
    book_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=True)
    fcm_message_id: Mapped[str] = mapped_column(String(200), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
    error_message: Mapped[str] = mapped_column(Text, nullable=True)
