import uuid
from typing import Optional
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from models.base import Base, TimestampMixin, SoftDeleteMixin


class Genre(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "genres"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    thumbnail: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Relationship to books (via junction table)
    books = relationship("Book", secondary="book_genres", back_populates="genres")
