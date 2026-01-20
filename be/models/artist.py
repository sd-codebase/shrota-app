import uuid
from typing import Optional, Dict, Any
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from models.base import Base, TimestampMixin, SoftDeleteMixin


class Artist(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "artists"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    bio: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    social_media: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    photo: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Relationship to books (via junction table)
    books = relationship("Book", secondary="book_artists", back_populates="artists")
