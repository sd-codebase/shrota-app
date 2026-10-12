import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey, Index, UniqueConstraint, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from models.base import Base, TimestampMixin, SoftDeleteMixin, utc_now


class SubscriptionPlan(Base, TimestampMixin, SoftDeleteMixin):
    """
    An auto-renewing subscription sold through Google Play, e.g. "Monthly —
    ₹99 / month". Unlocks every `subscriber_only` book while active.

    Managed in the admin dashboard; each plan is mirrored to Google Play as a
    subscription product with one auto-renewing base plan (see
    services/google_play.sync_plan). `price` is what we push to Play; Google
    is the source of truth for what a listener is actually charged.
    """
    __tablename__ = "subscription_plans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    # Whole rupees (₹), like Book.prime_price.
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    # ISO 8601 period Google bills on: P1M, P3M, P6M or P1Y. Immutable in
    # Play once the base plan exists, so it can't be edited afterwards.
    billing_period: Mapped[str] = mapped_column(String(8), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Google Play mirror state, same meaning as on Book.play_sync_status.
    play_sync_status: Mapped[str] = mapped_column(String(10), default="pending", nullable=False)
    play_sync_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    play_synced_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    @property
    def play_product_id(self) -> str:
        return f"plan_{self.id.hex}"

    @property
    def play_base_plan_id(self) -> str:
        # e.g. "p1m" — lowercase letters, numbers and hyphens only.
        return self.billing_period.lower()


class StorePurchase(Base, TimestampMixin):
    """
    One Google Play purchase (a Prime book) or subscription, identified by
    its purchase token.

    Rows are written only after the token has been checked with the Google
    Play Developer API, and are refreshed from Google whenever a real-time
    developer notification (RTDN) arrives — renewals, cancellations, refunds.
    Entitlement is read from here: a book purchase in state "purchased", or a
    subscription whose `expires_at` is still in the future.

    `item_title` and `list_price` are copied in at purchase time so the record
    reads correctly after a price change or a book is removed. `list_price`
    is our catalogue price, not what Google paid out (that's net of fees and
    tax — see Play Console earnings reports).
    """
    __tablename__ = "store_purchases"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    # "google_play" today; "app_store" when iOS billing lands.
    store: Mapped[str] = mapped_column(String(20), default="google_play", nullable=False)
    # "book" | "subscription"
    kind: Mapped[str] = mapped_column(String(20), nullable=False)
    product_id: Mapped[str] = mapped_column(String(150), nullable=False)
    book_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("books.id", ondelete="SET NULL"), nullable=True
    )
    plan_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("subscription_plans.id", ondelete="SET NULL"), nullable=True
    )
    item_title: Mapped[str] = mapped_column(String(300), nullable=False)
    list_price: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    purchase_token: Mapped[str] = mapped_column(String(512), nullable=False, unique=True)
    # Google order id (GPA.xxxx); for subscriptions, the latest successful one.
    order_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    # Book: purchased | pending | canceled | refunded
    # Subscription: active | grace_period | on_hold | paused | canceled |
    #               expired | pending | revoked | refunded
    status: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_test: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    purchased_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    # Subscriptions only: access runs until here (end of the paid period).
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    auto_renewing: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    # Set when a resubscribe/upgrade replaced an older token.
    linked_purchase_token: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    user = relationship("User")
    book = relationship("Book")
    plan = relationship("SubscriptionPlan")

    __table_args__ = (
        Index("ix_store_purchases_user_kind", "user_id", "kind"),
    )


class BookPurchase(Base):
    """
    A listener owns a prime_only book. One row per user + book, pointing at
    the store purchase that paid for it; removed if that purchase is refunded.
    """
    __tablename__ = "book_purchases"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    book_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("books.id", ondelete="CASCADE"), nullable=False
    )
    store_purchase_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("store_purchases.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "book_id", name="unique_book_purchase_user_book"),
    )


class ProcessedNotification(Base):
    """
    Pub/Sub message ids already handled, so a redelivered RTDN is a no-op.
    Google delivers at least once and recommends de-duplicating on messageId.
    """
    __tablename__ = "processed_play_notifications"

    message_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
