"""
In-app purchases through Google Play Billing.

Flow: the app buys a product with Google's own payment sheet (passing the
user's id as obfuscatedAccountId), then POSTs the purchase token to
/google/verify. The server reads the purchase back from the Google Play
Developer API, records it, unlocks the book or subscription, and
acknowledges it (Google refunds anything unacknowledged after 3 days).

Google also pushes real-time developer notifications (renewals,
cancellations, refunds, purchases the app never got to report) to
/google/rtdn through Cloud Pub/Sub, so state stays right without the app.
"""
import asyncio
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from config import (
    GOOGLE_PLAY_PACKAGE_NAME,
    GOOGLE_PLAY_RTDN_AUDIENCE,
    GOOGLE_PLAY_RTDN_SERVICE_ACCOUNT,
)
from database import get_db
from models.book import Book
from models.payment import ProcessedNotification, StorePurchase, SubscriptionPlan
from models.user import User
from routes.user_auth import get_current_user
from schemas.payment import (
    BookAccessResponse,
    GoogleVerifyRequest,
    GoogleVerifyResponse,
    StorePlanResponse,
    SubscriptionStatusResponse,
)
from services import feature_flags, google_play, payment_service
from services.payment_service import PurchaseOwnershipError

router = APIRouter(prefix="/v1/payments", tags=["Payments"])


def parse_uuid(value: str, label: str) -> UUID:
    try:
        return UUID(value)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid {label}")


@router.get("/plans", response_model=list[StorePlanResponse])
async def list_plans(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Plans on sale in Play, in display order. The app fetches live prices from Play by id."""
    if not await feature_flags.is_enabled(db, feature_flags.PAYMENTS, current_user.id):
        return []
    result = await db.execute(
        select(SubscriptionPlan)
        .where(
            SubscriptionPlan.is_deleted == False,
            SubscriptionPlan.is_active == True,
            SubscriptionPlan.play_sync_status == "synced",
        )
        .order_by(SubscriptionPlan.sort_order, SubscriptionPlan.price)
    )
    return [
        StorePlanResponse(
            id=str(p.id),
            name=p.name,
            description=p.description,
            price=p.price,
            billing_period=p.billing_period,
            play_product_id=p.play_product_id,
            play_base_plan_id=p.play_base_plan_id,
        )
        for p in result.scalars().all()
    ]


@router.get("/subscription", response_model=SubscriptionStatusResponse)
async def get_subscription_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    active = await payment_service.get_active_subscription(db, current_user.id)
    if not active:
        return SubscriptionStatusResponse(is_active=False)
    return SubscriptionStatusResponse(
        is_active=True,
        plan_name=active.item_title,
        status=active.status,
        expires_at=active.expires_at,
        auto_renewing=active.auto_renewing,
        play_product_id=active.product_id,
    )


@router.get("/access/{book_id}", response_model=BookAccessResponse)
async def get_book_access(
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Whether the user may play this book. The app checks this before playback."""
    book = await db.get(Book, parse_uuid(book_id, "book ID"))
    if not book or book.is_deleted or not book.is_published:
        raise HTTPException(status_code=404, detail="Book not found")
    if not await feature_flags.is_enabled(db, feature_flags.PAYMENTS, current_user.id):
        # In-app purchases aren't switched on for this user: every book is open.
        access = payment_service.open_access(book)
    else:
        access = await payment_service.book_access(db, current_user.id, book)
    return BookAccessResponse(book_id=str(book.id), **access)


@router.post("/google/verify", response_model=GoogleVerifyResponse)
async def verify_google_purchase(
    payload: GoogleVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Check a purchase token with Google, unlock what it paid for, and
    acknowledge it. Safe to call repeatedly (e.g. on restore).
    """
    kind = payment_service.kind_of(payload.product_id)
    if kind == "unknown":
        raise HTTPException(status_code=400, detail="Unknown product")

    try:
        if kind == "book":
            info = await google_play.get_product_purchase(payload.purchase_token)
        else:
            info = await google_play.get_subscription_purchase(payload.purchase_token)
    except google_play.GooglePlayNotConfigured as exc:
        print(f"[PLAY] verify unavailable: {exc.message}")
        raise HTTPException(status_code=503, detail="Purchases can't be verified right now. Please try again later.")
    except google_play.GooglePlayError as exc:
        if exc.status in (400, 404, 410):
            raise HTTPException(status_code=400, detail="This purchase could not be found")
        print(f"[PLAY] verify failed: {exc}")
        # Not 401: that status means "your session expired" to the app and logs the user out.
        raise HTTPException(status_code=502, detail="Could not reach Google Play. Please try again.")

    # The token must be for the product the app says it is.
    if info["product_id"] != payload.product_id:
        raise HTTPException(status_code=400, detail="Purchase does not match the product")

    try:
        if kind == "book":
            row = await payment_service.record_book_purchase(db, current_user, payload.purchase_token, info)
        else:
            row = await payment_service.record_subscription(db, current_user, payload.purchase_token, info)
    except PurchaseOwnershipError:
        raise HTTPException(status_code=409, detail="This purchase belongs to a different Shrota account")

    await payment_service.acknowledge_if_needed(row)
    await db.commit()

    if kind == "book":
        granted = row.status == "purchased"
    else:
        granted = (
            row.status in payment_service.ENTITLED_SUBSCRIPTION_STATES
            and row.expires_at is not None
            and row.expires_at > datetime.now(timezone.utc)
        )
    return GoogleVerifyResponse(
        kind=kind,
        status=row.status,
        granted=granted,
        book_id=str(row.book_id) if row.book_id else None,
        expires_at=row.expires_at,
    )


def _verify_pubsub_jwt(auth_header: str) -> None:
    """Blocking: check the Google-signed OIDC token Pub/Sub attaches to pushes."""
    from google.auth.transport import requests as google_requests
    from google.oauth2 import id_token

    if not auth_header.startswith("Bearer "):
        raise ValueError("missing bearer token")
    claims = id_token.verify_oauth2_token(
        auth_header.split(" ", 1)[1], google_requests.Request(), audience=GOOGLE_PLAY_RTDN_AUDIENCE
    )
    if GOOGLE_PLAY_RTDN_SERVICE_ACCOUNT and (
        claims.get("email") != GOOGLE_PLAY_RTDN_SERVICE_ACCOUNT or not claims.get("email_verified")
    ):
        raise ValueError("unexpected signer")


async def _user_for_account_id(db: AsyncSession, account_id: str | None) -> User | None:
    if not account_id:
        return None
    try:
        user_id = UUID(hex=account_id)
    except ValueError:
        return None
    return await db.get(User, user_id)


@router.post("/google/rtdn", include_in_schema=False)
async def google_rtdn(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Real-time developer notifications from Google Play, pushed by Cloud
    Pub/Sub. A notification only says *something changed*; the current state
    is always re-read from the Developer API.
    """
    if not GOOGLE_PLAY_RTDN_AUDIENCE:
        raise HTTPException(status_code=503, detail="RTDN not configured")
    try:
        await asyncio.to_thread(_verify_pubsub_jwt, request.headers.get("Authorization", ""))
    except Exception as exc:
        print(f"[PLAY] rejected RTDN push: {exc}")
        raise HTTPException(status_code=401, detail="Unauthorized")

    envelope = await request.json()
    message = envelope.get("message") or {}
    message_id = message.get("messageId") or message.get("message_id")
    if not message_id or not message.get("data"):
        return {"status": "ignored"}

    # At-least-once delivery: skip anything already handled.
    db.add(ProcessedNotification(message_id=message_id))
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        return {"status": "duplicate"}

    notification = google_play.decode_pubsub_data(message["data"])
    if notification.get("packageName") != GOOGLE_PLAY_PACKAGE_NAME:
        await db.commit()
        return {"status": "ignored"}

    try:
        if "subscriptionNotification" in notification:
            token = notification["subscriptionNotification"]["purchaseToken"]
            info = await google_play.get_subscription_purchase(token)
            user = await _user_for_account_id(db, info.get("account_id"))
            if user is None:
                existing = (
                    await db.execute(select(StorePurchase).where(StorePurchase.purchase_token == token))
                ).scalar_one_or_none()
                user = await db.get(User, existing.user_id) if existing and existing.user_id else None
            if user and payment_service.kind_of(info["product_id"]) == "subscription":
                row = await payment_service.record_subscription(db, user, token, info)
                await payment_service.acknowledge_if_needed(row)

        elif "oneTimeProductNotification" in notification:
            token = notification["oneTimeProductNotification"]["purchaseToken"]
            info = await google_play.get_product_purchase(token)
            user = await _user_for_account_id(db, info.get("account_id"))
            if user and payment_service.kind_of(info["product_id"]) == "book":
                row = await payment_service.record_book_purchase(db, user, token, info)
                await payment_service.acknowledge_if_needed(row)

        elif "voidedPurchaseNotification" in notification:
            token = notification["voidedPurchaseNotification"]["purchaseToken"]
            await payment_service.revoke_purchase(db, token, reason="refunded")

    except PurchaseOwnershipError:
        print("[PLAY] RTDN purchase belongs to a different account than recorded; left unchanged")
    except google_play.GooglePlayError as exc:
        # Let Pub/Sub retry later: undo the dedupe marker with the rest.
        await db.rollback()
        print(f"[PLAY] RTDN processing failed, will retry: {exc}")
        raise HTTPException(status_code=503, detail="Retry later")

    await db.commit()
    return {"status": "ok"}
