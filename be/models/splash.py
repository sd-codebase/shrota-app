import uuid
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from models.base import Base, TimestampMixin, SoftDeleteMixin


class SplashResource(Base, TimestampMixin, SoftDeleteMixin):
    """
    App splash screen resource (image or video), managed by admins.
    The mobile app plays whichever is_active=True resource was created
    most recently — see routes/splash.py get_active_splash.
    """
    __tablename__ = "splash_resources"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resource_type: Mapped[str] = mapped_column(String(10), nullable=False)  # "image" | "video"
    file: Mapped[str] = mapped_column(String(500), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
