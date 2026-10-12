"""
Who may listen to what, and recording Google Play purchases.

Entitlement:
- prime_only book: the user has a BookPurchase row (bought once, kept).
- subscriber_only book: the user has a subscription StorePurchase whose
  paid period hasn't ended and that Google still considers good standing.

Purchases are only recorded from data read back from the Google Play
Developer API (services/google_play), never from what the app reports.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, delete
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from database import async_session
from models.book import Book
from models.payment import BookPurchase, StorePurchase, SubscriptionPlan
from models.user import User
from services import google_play

# Subscription states that still grant access until expires_at. A canceled
# subscription keeps access to the end of the period the user paid for;
# on_hold / paused / expired / revoked do not.
ENTITLED_SUBSCRIPTION_STATES = ("active", "grace_period", "canceled")


class PurchaseOwnershipError(Exception):
    """The purchase belongs to a different Shrota account."""


def account_id_for(user: User) -> str:
    """What the app passes to Play as obfuscatedAccountId, binding a purchase
    to a Shrota account. Not personal data: just the user's id."""
    return user.id.hex


# --- Entitlement ---

async def has_purchased_book(db: AsyncSession, user_id: uuid.UUID, book_id: uuid.UUID) -> bool:
    found = await db.scalar(
        select(BookPurchase.id).where(BookPurchase.user_id == user_id, BookPurchase.book_id == book_id)
    )
    return found is not None


async def get_active_subscription(db: AsyncSession, user_id: uuid.UUID) -> Optional[StorePurchase]:
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(StorePurchase)
        .where(
            StorePurchase.user_id == user_id,
            StorePurchase.kind == "subscription",
            StorePurchase.status.in_(ENTITLED_SUBSCRIPTION_STATES),
            StorePurchase.expires_at > now,
        )
        .order_by(StorePurchase.expires_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def book_access(db: AsyncSession, user_id: uuid.UUID, book: Book) -> dict:
    """Can this user listen to this book, and if not, what would unlock it."""
    if book.access_type == "prime_only":
        purchased = await has_purchased_book(db, user_id, book.id)
        return {
            "access_type": book.access_type,
            "prime_price": book.prime_price,
            "can_listen": purchased,
            "has_purchased": purchased,
            "subscription_active": None,
            # Only offer a buy button once the product exists in Play.
            "play_product_id": book.play_product_id if book.play_sync_status == "synced" else None,
        }
    if book.access_type == "subscriber_only":
        subscribed = await get_active_subscription(db, user_id) is not None
        return {
            "access_type": book.access_type,
            "prime_price": None,
            "can_listen": subscribed,
            "has_purchased": None,
            "subscription_active": subscribed,
            "play_product_id": None,
        }
    return {
        "access_type": book.access_type,
        "prime_price": None,
        "can_listen": True,
        "has_purchased": None,
        "subscription_active": None,
        "play_product_id": None,
    }


# --- Recording verified purchases ---

def _parse_product_id(product_id: str) -> tuple[str, Optional[uuid.UUID]]:
    """book_<hex> -> ("book", id); plan_<hex> -> ("subscription", id)."""
    prefix, _, hex_id = (product_id or "").partition("_")
    try:
        parsed = uuid.UUID(hex=hex_id)
    except ValueError:
        return "unknown", None
    if prefix == "book":
        return "book", parsed
    if prefix == "plan":
        return "subscription", parsed
    return "unknown", None


def kind_of(product_id: str) -> str:
    return _parse_product_id(product_id)[0]


async def _check_owner(db: AsyncSession, user: User, purchase_token: str, account_id: Optional[str]) -> None:
    if account_id and account_id != account_id_for(user):
        raise PurchaseOwnershipError()
    other = await db.scalar(
        select(StorePurchase.user_id).where(
            StorePurchase.purchase_token == purchase_token,
            StorePurchase.user_id.is_not(None),
            StorePurchase.user_id != user.id,
        )
    )
    if other:
        raise PurchaseOwnershipError()


async def _upsert_store_purchase(db: AsyncSession, purchase_token: str, values: dict) -> StorePurchase:
    row = (
        await db.execute(
            select(StorePurchase).where(StorePurchase.purchase_token == purchase_token).with_for_update()
        )
    ).scalar_one_or_none()
    if row is None:
        row = StorePurchase(purchase_token=purchase_token, **values)
        db.add(row)
    else:
        for key, value in values.items():
            if value is not None or key in ("expires_at",):
                setattr(row, key, value)
    await db.flush()
    return row


async def record_book_purchase(db: AsyncSession, user: User, purchase_token: str, info: dict) -> StorePurchase:
    """Save a verified one-time purchase and unlock the book. Caller commits."""
    _, book_id = _parse_product_id(info["product_id"])
    book = await db.get(Book, book_id) if book_id else None
    await _check_owner(db, user, purchase_token, info.get("account_id"))

    row = await _upsert_store_purchase(db, purchase_token, {
        "user_id": user.id,
        "store": "google_play",
        "kind": "book",
        "product_id": info["product_id"],
        "book_id": book.id if book else None,
        "item_title": book.title if book else info["product_id"],
        "list_price": book.prime_price if book else None,
        "order_id": info.get("order_id"),
        "status": info["status"],
        "acknowledged": info.get("acknowledged", False),
        "is_test": info.get("is_test", False),
        "purchased_at": info.get("purchased_at"),
    })

    if row.status == "purchased" and book:
        await db.execute(
            insert(BookPurchase)
            .values(
                id=uuid.uuid4(),
                user_id=user.id,
                book_id=book.id,
                store_purchase_id=row.id,
                created_at=datetime.now(timezone.utc),
            )
            .on_conflict_do_nothing(constraint="unique_book_purchase_user_book")
        )
    return row


async def record_subscription(db: AsyncSession, user: User, purchase_token: str, info: dict) -> StorePurchase:
    """Save a verified subscription (new or refreshed). Caller commits."""
    _, plan_id = _parse_product_id(info["product_id"])
    plan = await db.get(SubscriptionPlan, plan_id) if plan_id else None
    await _check_owner(db, user, purchase_token, info.get("account_id"))

    row = await _upsert_store_purchase(db, purchase_token, {
        "user_id": user.id,
        "store": "google_play",
        "kind": "subscription",
        "product_id": info["product_id"],
        "plan_id": plan.id if plan else None,
        "item_title": plan.name if plan else info["product_id"],
        "list_price": plan.price if plan else None,
        "order_id": info.get("order_id"),
        "status": info["status"],
        "acknowledged": info.get("acknowledged", False),
        "is_test": info.get("is_test", False),
        "purchased_at": info.get("purchased_at"),
        "expires_at": info.get("expires_at"),
        "auto_renewing": info.get("auto_renewing"),
        "linked_purchase_token": info.get("linked_purchase_token"),
    })

    # A resubscribe or plan change issues a new token; Google says to treat
    # the linked (older) one as superseded so access isn't counted twice.
    if info.get("linked_purchase_token"):
        old = (
            await db.execute(
                select(StorePurchase).where(StorePurchase.purchase_token == info["linked_purchase_token"])
            )
        ).scalar_one_or_none()
        if old and old.id != row.id and old.status in ENTITLED_SUBSCRIPTION_STATES:
            old.status = "expired"
    return row


async def acknowledge_if_needed(row: StorePurchase) -> None:
    """Best effort: an unacknowledged purchase is refunded by Google after
    3 days, so every verify/notification for the token retries this."""
    if row.acknowledged or row.status not in ("purchased", "active", "grace_period"):
        return
    try:
        if row.kind == "book":
            await google_play.acknowledge_product(row.product_id, row.purchase_token)
        else:
            await google_play.acknowledge_subscription(row.product_id, row.purchase_token)
        row.acknowledged = True
    except google_play.GooglePlayError as exc:
        # 400 "already acknowledged" is fine; anything else retries later.
        if "acknowledged" in exc.message.lower():
            row.acknowledged = True
        else:
            print(f"[PLAY] acknowledge failed for {row.product_id}: {exc.message}")


async def revoke_purchase(db: AsyncSession, purchase_token: str, reason: str = "refunded") -> Optional[StorePurchase]:
    """A refund or chargeback: take access away. Caller commits."""
    row = (
        await db.execute(select(StorePurchase).where(StorePurchase.purchase_token == purchase_token))
    ).scalar_one_or_none()
    if row is None:
        return None
    row.status = reason
    if row.kind == "book":
        await db.execute(delete(BookPurchase).where(BookPurchase.store_purchase_id == row.id))
    else:
        row.expires_at = datetime.now(timezone.utc)
    return row


# --- Catalogue sync jobs (run in the background after admin saves) ---

async def sync_book_to_play(book_id: uuid.UUID) -> None:
    """Push a book's Prime product to Play and record the outcome on the book."""
    async with async_session() as db:
        book = await db.get(Book, book_id)
        if not book:
            return
        should_exist = book.access_type == "prime_only" and bool(book.prime_price)
        if not should_exist and book.play_sync_status is None:
            return  # never sold through Play: nothing to switch off
        sell = should_exist and book.is_published and not book.is_deleted
        try:
            await google_play.upsert_book_product(
                book.play_product_id,
                title=book.title,
                description=book.information,
                rupees=book.prime_price or 1,
                sell=sell,
            )
            book.play_sync_status = "synced"
            book.play_sync_error = None
            book.play_synced_at = datetime.now(timezone.utc)
        except Exception as exc:
            book.play_sync_status = "disabled" if isinstance(exc, google_play.GooglePlayNotConfigured) else "error"
            book.play_sync_error = google_play.describe_error(exc)
            print(f"[PLAY] book {book.id} sync failed: {book.play_sync_error}")
        await db.commit()


async def sync_plan_to_play(plan_id: uuid.UUID) -> None:
    async with async_session() as db:
        plan = await db.get(SubscriptionPlan, plan_id)
        if not plan:
            return
        try:
            await google_play.upsert_subscription(
                plan.play_product_id,
                plan.play_base_plan_id,
                plan.billing_period,
                title=plan.name,
                description=plan.description,
                rupees=plan.price,
                sell=plan.is_active and not plan.is_deleted,
            )
            plan.play_sync_status = "synced"
            plan.play_sync_error = None
            plan.play_synced_at = datetime.now(timezone.utc)
        except Exception as exc:
            plan.play_sync_status = "disabled" if isinstance(exc, google_play.GooglePlayNotConfigured) else "error"
            plan.play_sync_error = google_play.describe_error(exc)
            print(f"[PLAY] plan {plan.id} sync failed: {plan.play_sync_error}")
        await db.commit()
