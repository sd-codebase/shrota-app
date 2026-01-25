import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Boolean, ForeignKey, Float, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from models.base import Base, TimestampMixin


class UserBookProgress(Base, TimestampMixin):
    """Track user's listening progress for each book."""
    __tablename__ = "user_book_progress"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    book_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("books.id", ondelete="CASCADE"), nullable=False)

    # Current position
    current_chapter_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    current_position: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)  # Position in seconds within chapter

    # Overall progress
    total_listened_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    progress_percentage: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)  # 0.0 to 100.0

    # Status
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_played_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", backref="book_progress")
    book = relationship("Book", backref="user_progress")

    __table_args__ = (
        UniqueConstraint('user_id', 'book_id', name='unique_user_book_progress'),
    )


class UserLikedBook(Base):
    """Track user's liked/favorite books."""
    __tablename__ = "user_liked_books"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    book_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    liked_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", backref="liked_books")
    book = relationship("Book", backref="liked_by_users")

    __table_args__ = (
        UniqueConstraint('user_id', 'book_id', name='unique_user_liked_book'),
    )
