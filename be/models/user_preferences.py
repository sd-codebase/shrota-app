import uuid
from sqlalchemy import Table, Column, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from models.base import Base, TimestampMixin


# Junction table for user preferred languages (many-to-many)
user_preferred_languages = Table(
    "user_preferred_languages",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("language_id", UUID(as_uuid=True), ForeignKey("languages.id", ondelete="CASCADE"), primary_key=True),
)

# Junction table for user preferred genres (many-to-many)
user_preferred_genres = Table(
    "user_preferred_genres",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("genre_id", UUID(as_uuid=True), ForeignKey("genres.id", ondelete="CASCADE"), primary_key=True),
)


class UserPreferences(Base, TimestampMixin):
    """User preferences for language and genre selections."""
    __tablename__ = "user_preferences"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="preferences")

    # Junction tables use user_id, so we need explicit join conditions
    languages = relationship(
        "Language",
        secondary=user_preferred_languages,
        primaryjoin="UserPreferences.user_id == user_preferred_languages.c.user_id",
        secondaryjoin="user_preferred_languages.c.language_id == Language.id",
        passive_deletes=True,
    )
    genres = relationship(
        "Genre",
        secondary=user_preferred_genres,
        primaryjoin="UserPreferences.user_id == user_preferred_genres.c.user_id",
        secondaryjoin="user_preferred_genres.c.genre_id == Genre.id",
        passive_deletes=True,
    )
