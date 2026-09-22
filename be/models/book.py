import uuid
from typing import Optional
from sqlalchemy import String, Integer, Boolean, ForeignKey, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from models.base import Base, TimestampMixin, SoftDeleteMixin


# Junction tables for many-to-many relationships
book_authors = Table(
    "book_authors",
    Base.metadata,
    Column("book_id", UUID(as_uuid=True), ForeignKey("books.id", ondelete="CASCADE"), primary_key=True),
    Column("author_id", UUID(as_uuid=True), ForeignKey("authors.id", ondelete="CASCADE"), primary_key=True),
)

book_artists = Table(
    "book_artists",
    Base.metadata,
    Column("book_id", UUID(as_uuid=True), ForeignKey("books.id", ondelete="CASCADE"), primary_key=True),
    Column("artist_id", UUID(as_uuid=True), ForeignKey("artists.id", ondelete="CASCADE"), primary_key=True),
)

book_genres = Table(
    "book_genres",
    Base.metadata,
    Column("book_id", UUID(as_uuid=True), ForeignKey("books.id", ondelete="CASCADE"), primary_key=True),
    Column("genre_id", UUID(as_uuid=True), ForeignKey("genres.id", ondelete="CASCADE"), primary_key=True),
)


class Book(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "books"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(250), nullable=False, unique=True, index=True)
    information: Mapped[str] = mapped_column(String(1000), nullable=False)
    thumbnail: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    total_duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_adult: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Access tier: "free" | "subscriber_only" | "prime_only". Chosen when
    # publishing a book. Enforcement of the paywall itself happens in the
    # mobile app (see mobile/TODO_BOOK_ACCESS.md) — this is just the admin
    # side of the feature for now.
    access_type: Mapped[str] = mapped_column(String(20), default="free", nullable=False)
    # Only set (and only meaningful) when access_type == "prime_only".
    # Whole rupees (₹), not paise.
    prime_price: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Foreign keys
    publisher_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("publications.id"), nullable=True)
    language_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("languages.id"), nullable=True)
    # Which admin/publisher account created this book. Nullable so existing
    # books stay "unowned" (visible only to full Admins, never claimable by
    # a Publisher). Set automatically on create, never editable afterward.
    owner_admin_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("admins.id"), nullable=True)

    # Relationships
    publisher = relationship("Publication", back_populates="books")
    language = relationship("Language", back_populates="books")
    authors = relationship("Author", secondary=book_authors, back_populates="books")
    artists = relationship("Artist", secondary=book_artists, back_populates="books")
    genres = relationship("Genre", secondary=book_genres, back_populates="books")
    chapters = relationship("Chapter", back_populates="book", cascade="all, delete-orphan", order_by="Chapter.order")


class Chapter(Base, SoftDeleteMixin):
    __tablename__ = "chapters"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    book_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    file_id: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    audio_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    file_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    image: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Relationship
    book = relationship("Book", back_populates="chapters")
