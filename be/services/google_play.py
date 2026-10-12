"""
Google Play Developer API: verify and acknowledge purchases, read
subscription state, and keep Play's catalogue (one-time products for Prime
books, subscriptions for plans) in step with the admin dashboard.

Talks to androidpublisher v3 with httpx (async). Auth is a service account
linked in Play Console; google-auth mints the OAuth token, which is cached
until shortly before it expires.
"""
import asyncio
import json
import time
from datetime import datetime, timezone
from typing import Any, Optional

import httpx

from config import (
    GOOGLE_PLAY_PACKAGE_NAME,
    GOOGLE_PLAY_PRICE_REGIONS,
    GOOGLE_PLAY_REGIONS_VERSION,
    GOOGLE_PLAY_SERVICE_ACCOUNT_PATH,
    GOOGLE_PLAY_SYNC_ENABLED,
)

API = "https://androidpublisher.googleapis.com/androidpublisher/v3"
SCOPE = "https://www.googleapis.com/auth/androidpublisher"
# Language of the product listings we push. Must be a language the app's
# store listing supports (Play rejects others).
LISTING_LANGUAGE = "en-US"
PURCHASE_OPTION_ID = "buy"


class GooglePlayError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(f"Google Play API {status}: {message}")
        self.status = status
        self.message = message


class GooglePlayNotConfigured(GooglePlayError):
    def __init__(self, message: str):
        super().__init__(503, message)


# --- Auth ---

_credentials = None
_token: Optional[str] = None
_token_expiry = 0.0
_token_lock = asyncio.Lock()


def _load_and_refresh():
    """Blocking: load the service account and fetch a fresh access token."""
    global _credentials
    from google.oauth2 import service_account
    from google.auth.transport.requests import Request

    if _credentials is None:
        try:
            _credentials = service_account.Credentials.from_service_account_file(
                GOOGLE_PLAY_SERVICE_ACCOUNT_PATH, scopes=[SCOPE]
            )
        except FileNotFoundError:
            raise GooglePlayNotConfigured(
                f"Google Play service account file not found at {GOOGLE_PLAY_SERVICE_ACCOUNT_PATH}"
            )
    _credentials.refresh(Request())
    return _credentials.token, _credentials.expiry


async def _access_token() -> str:
    global _token, _token_expiry
    async with _token_lock:
        if _token and time.time() < _token_expiry - 120:
            return _token
        token, expiry = await asyncio.to_thread(_load_and_refresh)
        _token = token
        _token_expiry = expiry.replace(tzinfo=timezone.utc).timestamp() if expiry else time.time() + 3000
        return _token


async def _request(method: str, path: str, *, params: Optional[dict] = None, body: Any = None) -> dict:
    token = await _access_token()
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.request(
                method,
                f"{API}/applications/{GOOGLE_PLAY_PACKAGE_NAME}{path}",
                params=params,
                json=body,
                headers={"Authorization": f"Bearer {token}"},
            )
    except httpx.HTTPError as exc:
        raise GooglePlayError(502, f"Could not reach Google Play: {exc}") from exc

    if response.status_code >= 400:
        try:
            message = response.json().get("error", {}).get("message") or response.text
        except ValueError:
            message = response.text
        raise GooglePlayError(response.status_code, message[:500])
    if not response.content:
        return {}
    return response.json()


# --- Purchases ---

def _ts(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    # RFC 3339 with up to nanoseconds, e.g. 2026-10-12T06:21:46.381Z
    value = value.replace("Z", "+00:00")
    if "." in value:
        head, rest = value.split(".", 1)
        frac, _, tz = rest.partition("+")
        value = f"{head}.{frac[:6]}+{tz}" if tz else f"{head}.{frac[:6]}"
    return datetime.fromisoformat(value)


async def get_product_purchase(purchase_token: str) -> dict:
    """A one-time purchase, normalised. Raises GooglePlayError (404 = unknown token)."""
    data = await _request("GET", f"/purchases/productsv2/tokens/{purchase_token}")
    line_items = data.get("productLineItem") or []
    state = (data.get("purchaseStateContext") or {}).get("purchaseState")
    return {
        "product_id": line_items[0].get("productId") if line_items else None,
        # PURCHASED | PENDING | CANCELLED
        "status": {"PURCHASED": "purchased", "PENDING": "pending", "CANCELLED": "canceled"}.get(state, "pending"),
        "acknowledged": data.get("acknowledgementState") == "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED",
        "order_id": data.get("orderId"),
        "account_id": data.get("obfuscatedExternalAccountId"),
        "purchased_at": _ts(data.get("purchaseCompletionTime")),
        "is_test": bool(data.get("testPurchaseContext")),
    }


async def acknowledge_product(product_id: str, purchase_token: str) -> None:
    """Must happen within 3 days of purchase or Google refunds it."""
    await _request("POST", f"/purchases/products/{product_id}/tokens/{purchase_token}:acknowledge", body={})


SUBSCRIPTION_STATES = {
    "SUBSCRIPTION_STATE_ACTIVE": "active",
    "SUBSCRIPTION_STATE_IN_GRACE_PERIOD": "grace_period",
    "SUBSCRIPTION_STATE_ON_HOLD": "on_hold",
    "SUBSCRIPTION_STATE_PAUSED": "paused",
    "SUBSCRIPTION_STATE_CANCELED": "canceled",
    "SUBSCRIPTION_STATE_EXPIRED": "expired",
    "SUBSCRIPTION_STATE_PENDING": "pending",
    "SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED": "canceled",
}


async def get_subscription_purchase(purchase_token: str) -> dict:
    """A subscription's current state, normalised."""
    data = await _request("GET", f"/purchases/subscriptionsv2/tokens/{purchase_token}")
    line_items = data.get("lineItems") or []
    expiries = [_ts(li.get("expiryTime")) for li in line_items if li.get("expiryTime")]
    first = line_items[0] if line_items else {}
    return {
        "product_id": first.get("productId"),
        "base_plan_id": (first.get("offerDetails") or {}).get("basePlanId"),
        "status": SUBSCRIPTION_STATES.get(data.get("subscriptionState"), "pending"),
        "acknowledged": data.get("acknowledgementState") == "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED",
        "order_id": first.get("latestSuccessfulOrderId"),
        "account_id": (data.get("externalAccountIdentifiers") or {}).get("obfuscatedExternalAccountId"),
        "purchased_at": _ts(data.get("startTime")),
        "expires_at": max(expiries) if expiries else None,
        "auto_renewing": bool((first.get("autoRenewingPlan") or {}).get("autoRenewEnabled")),
        "linked_purchase_token": data.get("linkedPurchaseToken"),
        "is_test": "testPurchase" in data,
    }


async def acknowledge_subscription(product_id: str, purchase_token: str) -> None:
    await _request("POST", f"/purchases/subscriptions/{product_id}/tokens/{purchase_token}:acknowledge", body={})


# --- Catalogue sync ---

def _money(currency: str, amount: int) -> dict:
    return {"currencyCode": currency, "units": str(amount), "nanos": 0}


async def _regional_prices(rupees: int) -> dict[str, dict]:
    """Price per configured region. India is set exactly; other regions use
    Google's own INR conversion so they land on valid local price points."""
    prices = {"IN": _money("INR", rupees)} if "IN" in GOOGLE_PLAY_PRICE_REGIONS else {}
    others = [r for r in GOOGLE_PLAY_PRICE_REGIONS if r != "IN"]
    if others:
        converted = await _request("POST", "/pricing:convertRegionPrices", body={"price": _money("INR", rupees)})
        for region, entry in (converted.get("convertedRegionPrices") or {}).items():
            if region in others and entry.get("price"):
                prices[region] = entry["price"]
    return prices


def _require_sync_enabled():
    if not GOOGLE_PLAY_SYNC_ENABLED:
        raise GooglePlayNotConfigured("Google Play sync is turned off (GOOGLE_PLAY_SYNC_ENABLED=false)")


async def upsert_book_product(product_id: str, title: str, description: str, rupees: int, sell: bool) -> None:
    """
    Create or update the one-time product for a Prime book, then turn its
    purchase option on (sell=True) or off. Turning it off only stops new
    sales — listeners who bought it keep it (entitlement lives in our DB).
    """
    _require_sync_enabled()
    regional = await _regional_prices(rupees)
    product = {
        "packageName": GOOGLE_PLAY_PACKAGE_NAME,
        "productId": product_id,
        "listings": [{
            "languageCode": LISTING_LANGUAGE,
            "title": title[:55],
            "description": (description or title)[:200],
        }],
        "purchaseOptions": [{
            "purchaseOptionId": PURCHASE_OPTION_ID,
            "buyOption": {"legacyCompatible": True, "multiQuantityEnabled": False},
            "regionalPricingAndAvailabilityConfigs": [
                {"regionCode": region, "price": price, "availability": "AVAILABLE"}
                for region, price in regional.items()
            ],
        }],
    }
    # The live API is inconsistent about path case: PATCH is only served at
    # lowercase "onetimeproducts", while GET and batchUpdateStates are only
    # served at camelCase "oneTimeProducts" (the others return a 404 page).
    await _request(
        "PATCH",
        f"/onetimeproducts/{product_id}",
        params={
            "allowMissing": "true",
            "updateMask": "listings,purchaseOptions",
            "regionsVersion.version": GOOGLE_PLAY_REGIONS_VERSION,
        },
        body=product,
    )
    state_request = "activatePurchaseOptionRequest" if sell else "deactivatePurchaseOptionRequest"
    await _request(
        "POST",
        f"/oneTimeProducts/{product_id}/purchaseOptions:batchUpdateStates",
        body={"requests": [{state_request: {
            "packageName": GOOGLE_PLAY_PACKAGE_NAME,
            "productId": product_id,
            "purchaseOptionId": PURCHASE_OPTION_ID,
        }}]},
    )


async def upsert_subscription(
    product_id: str, base_plan_id: str, billing_period: str, title: str, description: Optional[str],
    rupees: int, sell: bool,
) -> None:
    """
    Create or update the subscription for a plan with one auto-renewing base
    plan, then activate it (sell=True) or deactivate it. Deactivating stops
    new sign-ups only; existing subscribers keep renewing.
    """
    _require_sync_enabled()
    regional = await _regional_prices(rupees)
    base_plan = {
        "basePlanId": base_plan_id,
        "autoRenewingBasePlanType": {
            "billingPeriodDuration": billing_period,
            "resubscribeState": "RESUBSCRIBE_STATE_ACTIVE",
            "legacyCompatible": True,
        },
        "regionalConfigs": [
            {"regionCode": region, "newSubscriberAvailability": True, "price": price}
            for region, price in regional.items()
        ],
    }
    listing = {"languageCode": LISTING_LANGUAGE, "title": title[:55]}
    if description:
        listing["description"] = description[:80]
    subscription = {
        "packageName": GOOGLE_PLAY_PACKAGE_NAME,
        "productId": product_id,
        "listings": [listing],
        "basePlans": [base_plan],
    }
    region_params = {"regionsVersion.version": GOOGLE_PLAY_REGIONS_VERSION}

    existing = None
    try:
        existing = await _request("GET", f"/subscriptions/{product_id}")
    except GooglePlayError as exc:
        if exc.status != 404:
            raise
    if existing is None:
        await _request("POST", "/subscriptions", params={"productId": product_id, **region_params}, body=subscription)
        current_state = "DRAFT"
    else:
        await _request(
            "PATCH",
            f"/subscriptions/{product_id}",
            params={"updateMask": "listings,basePlans", **region_params},
            body=subscription,
        )
        current_state = next(
            (bp.get("state") for bp in existing.get("basePlans", []) if bp.get("basePlanId") == base_plan_id),
            "DRAFT",
        )

    if sell and current_state != "ACTIVE":
        await _request("POST", f"/subscriptions/{product_id}/basePlans/{base_plan_id}:activate", body={})
    elif not sell and current_state == "ACTIVE":
        await _request("POST", f"/subscriptions/{product_id}/basePlans/{base_plan_id}:deactivate", body={})


def describe_error(exc: Exception) -> str:
    if isinstance(exc, GooglePlayError):
        return exc.message
    return f"{type(exc).__name__}: {exc}"


def decode_pubsub_data(data_b64: str) -> dict:
    import base64
    return json.loads(base64.b64decode(data_b64))
