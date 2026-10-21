import uuid
from datetime import datetime

from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from models.base import Base, utc_now


class SlugRedirect(Base):
    """
    A slug a book / genre / news item used to have. When an admin changes a
    slug, the old one is kept here so links already shared or indexed by
    search engines still lead (via a permanent redirect) to the current page.
    """
    __tablename__ = "slug_redirects"

    # "book" | "genre" | "news"
    kind: Mapped[str] = mapped_column(String(10), primary_key=True)
    old_slug: Mapped[str] = mapped_column(String(350), primary_key=True)
    target_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
