from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field

BillingPeriod = Literal["P1M", "P3M", "P6M", "P1Y"]
PlaySyncStatus = Literal["pending", "synced", "error", "disabled"]


# --- Subscription plans (admin) ---

class SubscriptionPlanCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=55)  # Play listing title limit
    description: Optional[str] = Field(None, max_length=80)
    # Whole rupees.
    price: int = Field(..., ge=10, le=100000)
    billing_period: BillingPeriod
    is_active: bool = True
    sort_order: int = 0


class SubscriptionPlanUpdate(BaseModel):
    # billing_period is deliberately absent: Play makes it immutable.
    name: Optional[str] = Field(None, min_length=1, max_length=55)
    description: Optional[str] = Field(None, max_length=80)
    price: Optional[int] = Field(None, ge=10, le=100000)
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class SubscriptionPlanResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    price: int
    billing_period: str
    is_active: bool
    sort_order: int
    play_product_id: str
    play_base_plan_id: str
    play_sync_status: str
    play_sync_error: Optional[str] = None
    play_synced_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class PrimeBookSyncResponse(BaseModel):
    id: str
    title: str
    prime_price: Optional[int] = None
    is_published: bool
    play_product_id: str
    play_sync_status: Optional[str] = None
    play_sync_error: Optional[str] = None
    play_synced_at: Optional[datetime] = None


# --- App ---

class BookAccessResponse(BaseModel):
    book_id: str
    access_type: str
    prime_price: Optional[int] = None
    can_listen: bool
    has_purchased: Optional[bool] = None
    subscription_active: Optional[bool] = None
    # Google Play product to buy this book with (Prime books on sale only).
    play_product_id: Optional[str] = None


class StorePlanResponse(BaseModel):
    """A plan the app can offer: what to fetch from Play and how to show it."""
    id: str
    name: str
    description: Optional[str] = None
    price: int
    billing_period: str
    play_product_id: str
    play_base_plan_id: str


class SubscriptionStatusResponse(BaseModel):
    is_active: bool
    plan_name: Optional[str] = None
    status: Optional[str] = None
    # End of the current paid period.
    expires_at: Optional[datetime] = None
    auto_renewing: Optional[bool] = None
    # For the "Manage subscription" deep link into Play.
    play_product_id: Optional[str] = None


class GoogleVerifyRequest(BaseModel):
    product_id: str = Field(..., min_length=1, max_length=150)
    purchase_token: str = Field(..., min_length=1, max_length=512)


class GoogleVerifyResponse(BaseModel):
    kind: Literal["book", "subscription"]
    status: str
    # True once the purchase unlocks something (pending UPI etc. is False).
    granted: bool
    book_id: Optional[str] = None
    expires_at: Optional[datetime] = None


# --- Purchases list (admin) ---

class StorePurchaseAdminResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    store: str
    kind: str
    product_id: str
    item_title: str
    list_price: Optional[int] = None
    status: str
    order_id: Optional[str] = None
    is_test: bool
    acknowledged: bool
    auto_renewing: Optional[bool] = None
    purchased_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime


class StorePurchaseListResponse(BaseModel):
    purchases: list[StorePurchaseAdminResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
