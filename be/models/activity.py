import uuid
from datetime import datetime
from typing import Optional, Any

from sqlalchemy import String, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB

from models.base import Base, TimestampMixin, utc_now


class ActivitySession(Base, TimestampMixin):
    """
    One app-usage session: from app open until the app is stopped.

    The id is generated on the device so that events can reference their
    session before the device has ever reached the server (first launch,
    offline, or pre-login). `user_id` stays null while the user is
    anonymous and is filled in once they authenticate — the whole session,
    including everything logged before login, is then attributed to them.
    """
    __tablename__ = "activity_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)

    # Stable per app install, so sessions from the same device can be
    # linked together (and back-attributed once the user logs in).
    install_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)

    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    platform: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    os_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    device_model: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    app_version: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)


class ActivityEvent(Base):
    """
    A single logged activity, always tied to a session and ordered by
    `occurred_at` (device clock). Events are batched and may arrive long
    after they happened, so `occurred_at` — not the row's insert time — is
    what the timeline is built from.
    """
    __tablename__ = "activity_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("activity_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Denormalised from the session at write time when already known. The
    # session remains the source of truth for attribution.
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    event_name: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    params: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)

    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    __table_args__ = (
        Index("ix_activity_events_session_occurred", "session_id", "occurred_at"),
        Index("ix_activity_events_name_occurred", "event_name", "occurred_at"),
    )
