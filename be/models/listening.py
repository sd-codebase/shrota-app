import uuid
from datetime import date, datetime
from typing import Optional

from sqlalchemy import String, Integer, Boolean, Date, DateTime, ForeignKey, Index, Text, UniqueConstraint, BigInteger, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship, backref
from sqlalchemy.dialects.postgresql import UUID
from models.base import Base, TimestampMixin, utc_now


class BookListenDaily(Base, TimestampMixin):
    """
    Seconds of audio actually played, per book + chapter + device + day.

    This is the royalty ledger. Unlike `user_book_progress`, which holds only
    a listener's furthest position and is overwritten as they go, these rows
    accumulate and are never rewritten by later listening — so "what was
    listened to between April and September" stays answerable forever.

    Rows are keyed on `install_id` rather than `user_id` because listening
    starts before anyone signs in: a guest still consumes the audio. `user_id`
    is filled in when known and never cleared, so a device's history is
    attributed to the listener once they do sign in.

    Written from `listen_heartbeat` events, which report content seconds
    consumed (not wall-clock), so a book heard at 2x still counts in full
    while a seek to the end counts for nothing. Every row is reproducible
    from `activity_events` — see services/listening_ledger.rebuild_ledger.
    """
    __tablename__ = "book_listen_daily"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Local calendar date (config.ROYALTY_TIMEZONE), not UTC: a payout period
    # runs on the business's calendar, and late-night listening belongs to the
    # day the listener thinks it happened on.
    listen_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    book_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("books.id", ondelete="CASCADE"), nullable=False
    )
    # 0-based, as the player reports it. Kept so drop-off and per-chapter
    # payouts stay possible; roll it up for book-level reporting.
    chapter_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    install_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    seconds_listened: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    book = relationship("Book", backref=backref("listen_days", passive_deletes=True))

    __table_args__ = (
        UniqueConstraint(
            "listen_date", "book_id", "chapter_index", "install_id",
            name="unique_listen_day_book_chapter_install",
        ),
        Index("ix_book_listen_daily_book_date", "book_id", "listen_date"),
    )


class RoyaltySnapshot(Base, TimestampMixin):
    """
    A payout period, frozen.

    Re-running a report months later must produce the same numbers it did on
    payout day, even after late events arrive or a book is renamed or removed.
    So the figures are copied into `royalty_snapshot_lines` at the moment the
    snapshot is taken, and nothing recomputes them afterwards.
    """
    __tablename__ = "royalty_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    label: Mapped[str] = mapped_column(String(120), nullable=False)
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)

    # Whether listening from devices that never signed in was counted. A
    # business decision, recorded per snapshot so old payouts stay explicable.
    include_guests: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    total_seconds: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    generated_by_admin_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("admins.id", ondelete="SET NULL"), nullable=True
    )
    generated_by_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    lines = relationship(
        "RoyaltySnapshotLine",
        back_populates="snapshot",
        cascade="all, delete-orphan",
        order_by="RoyaltySnapshotLine.seconds_listened.desc()",
    )


class RoyaltySnapshotLine(Base):
    """
    One book's frozen share of a payout period.

    Title and author names are copied in as text on purpose: the line must
    still read correctly if the book is retitled or deleted later.
    """
    __tablename__ = "royalty_snapshot_lines"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    snapshot_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("royalty_snapshots.id", ondelete="CASCADE"), nullable=False, index=True
    )

    book_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("books.id", ondelete="SET NULL"), nullable=True
    )
    book_title: Mapped[str] = mapped_column(String(300), nullable=False)
    author_names: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    publisher_name: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)

    seconds_listened: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    unique_listeners: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    unique_devices: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # Share of the period's total listening, 0–100, frozen with the rest.
    share_percentage: Mapped[float] = mapped_column(Numeric(7, 4), default=0, nullable=False)

    snapshot = relationship("RoyaltySnapshot", back_populates="lines")
