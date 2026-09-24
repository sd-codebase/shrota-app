import uuid
from typing import Optional
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from models.base import Base, TimestampMixin, SoftDeleteMixin


class AppOpenAd(Base, TimestampMixin, SoftDeleteMixin):
    """
    App-open ad image, managed by admins. Shown for ~2 seconds when the
    mobile app launches, over the app's own splash screen. Image only.

    Self-served for now (admin uploads their own promo image); the slot
    is intended to be sold to advertisers once the app has enough
    downloads, at which point this same mechanism just gets pointed at
    the advertiser's creative.
    """
    __tablename__ = "app_open_ads"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file: Mapped[str] = mapped_column(String(500), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # Optional "Know More" destination. When set, the app shows a "Know
    # More" button (opens this link) above "Continue to Shrota". When not
    # set, only "Continue to Shrota" is shown.
    link: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
