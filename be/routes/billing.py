"""
Admin side of in-app purchases: subscription plans (mirrored to Google Play
as auto-renewing subscriptions), the Play sync state of Prime books, and the
list of store purchases. Full admins only.
"""
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from database import get_db
from models.admin import Admin
from models.book import Book
from models.payment import StorePurchase, SubscriptionPlan
from schemas.payment import (
    PrimeBookSyncResponse,
    StorePurchaseListResponse,
    SubscriptionPlanCreate,
    SubscriptionPlanResponse,
    SubscriptionPlanUpdate,
)
from services.payment_service import sync_book_to_play, sync_plan_to_play
from utils.auth import require_full_admin

router = APIRouter(prefix="/billing", tags=["Billing (admin)"])


def plan_to_response(plan: SubscriptionPlan) -> SubscriptionPlanResponse:
    return SubscriptionPlanResponse(
        id=str(plan.id),
        name=plan.name,
        description=plan.description,
        price=plan.price,
        billing_period=plan.billing_period,
        is_active=plan.is_active,
        sort_order=plan.sort_order,
        play_product_id=plan.play_product_id,
        play_base_plan_id=plan.play_base_plan_id,
        play_sync_status=plan.play_sync_status,
        play_sync_error=plan.play_sync_error,
        play_synced_at=plan.play_synced_at,
        created_at=plan.created_at,
        updated_at=plan.updated_at,
    )


def parse_id(value: str, label: str) -> UUID:
    try:
        return UUID(value)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid {label}")


async def get_plan_or_404(db: AsyncSession, plan_id: str) -> SubscriptionPlan:
    plan = await db.get(SubscriptionPlan, parse_id(plan_id, "plan ID"))
    if not plan or plan.is_deleted:
        raise HTTPException(status_code=404, detail="Subscription plan not found")
    return plan


# --- Plans ---

@router.get("/plans", response_model=list[SubscriptionPlanResponse])
async def list_plans(
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    result = await db.execute(
        select(SubscriptionPlan)
        .where(SubscriptionPlan.is_deleted == False)
        .order_by(SubscriptionPlan.sort_order, SubscriptionPlan.price)
    )
    return [plan_to_response(p) for p in result.scalars().all()]


@router.post("/plans", response_model=SubscriptionPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_plan(
    plan: SubscriptionPlanCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    """Creates the plan and, in the background, its subscription in Google Play."""
    new_plan = SubscriptionPlan(**plan.model_dump(), play_sync_status="pending")
    db.add(new_plan)
    await db.commit()
    await db.refresh(new_plan)
    background_tasks.add_task(sync_plan_to_play, new_plan.id)
    return plan_to_response(new_plan)


@router.put("/plans/{plan_id}", response_model=SubscriptionPlanResponse)
async def update_plan(
    plan_id: str,
    update: SubscriptionPlanUpdate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    """
    A price change applies to new subscribers; Google handles existing ones
    (they keep their price unless migrated in Play Console).
    """
    plan = await get_plan_or_404(db, plan_id)
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(plan, field, value)
    plan.play_sync_status = "pending"
    plan.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(plan)
    background_tasks.add_task(sync_plan_to_play, plan.id)
    return plan_to_response(plan)


@router.delete("/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan(
    plan_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    """Soft delete and stop new sign-ups in Play. Current subscribers keep renewing until they cancel."""
    plan = await get_plan_or_404(db, plan_id)
    plan.is_deleted = True
    plan.updated_at = datetime.now(timezone.utc)
    await db.commit()
    background_tasks.add_task(sync_plan_to_play, plan.id)
    return None


@router.post("/plans/{plan_id}/sync", response_model=SubscriptionPlanResponse)
async def resync_plan(
    plan_id: str,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    """Push a plan to Play again now (e.g. after fixing credentials) and return the result."""
    plan = await get_plan_or_404(db, plan_id)
    await sync_plan_to_play(plan.id)
    await db.refresh(plan)
    return plan_to_response(plan)


# --- Prime books in Play ---

def book_sync_response(book: Book) -> PrimeBookSyncResponse:
    return PrimeBookSyncResponse(
        id=str(book.id),
        title=book.title,
        prime_price=book.prime_price,
        is_published=book.is_published,
        play_product_id=book.play_product_id,
        play_sync_status=book.play_sync_status,
        play_sync_error=book.play_sync_error,
        play_synced_at=book.play_synced_at,
    )


@router.get("/prime-books", response_model=list[PrimeBookSyncResponse])
async def list_prime_books(
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    result = await db.execute(
        select(Book)
        .where(Book.is_deleted == False, Book.access_type == "prime_only")
        .order_by(Book.title)
    )
    return [book_sync_response(b) for b in result.scalars().all()]


@router.post("/prime-books/{book_id}/sync", response_model=PrimeBookSyncResponse)
async def resync_book(
    book_id: str,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    book = await db.get(Book, parse_id(book_id, "book ID"))
    if not book or book.is_deleted:
        raise HTTPException(status_code=404, detail="Book not found")
    await sync_book_to_play(book.id)
    await db.refresh(book)
    return book_sync_response(book)


# --- Purchases ---

@router.get("/purchases", response_model=StorePurchaseListResponse)
async def list_purchases(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status", max_length=20),
    kind: Optional[str] = Query(None, pattern="^(book|subscription)$"),
    include_test: bool = Query(True),
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    filters = []
    if status_filter:
        filters.append(StorePurchase.status == status_filter)
    if kind:
        filters.append(StorePurchase.kind == kind)
    if not include_test:
        filters.append(StorePurchase.is_test == False)

    total = await db.scalar(select(func.count(StorePurchase.id)).where(*filters)) or 0
    result = await db.execute(
        select(StorePurchase)
        .options(joinedload(StorePurchase.user))
        .where(*filters)
        .order_by(StorePurchase.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    rows = result.scalars().all()
    return StorePurchaseListResponse(
        purchases=[
            {
                "id": str(p.id),
                "user_id": str(p.user_id) if p.user_id else None,
                "user_name": p.user.name if p.user else None,
                "user_email": p.user.email if p.user else None,
                "store": p.store,
                "kind": p.kind,
                "product_id": p.product_id,
                "item_title": p.item_title,
                "list_price": p.list_price,
                "status": p.status,
                "order_id": p.order_id,
                "is_test": p.is_test,
                "acknowledged": p.acknowledged,
                "auto_renewing": p.auto_renewing,
                "purchased_at": p.purchased_at,
                "expires_at": p.expires_at,
                "created_at": p.created_at,
            }
            for p in rows
        ],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=(total + per_page - 1) // per_page,
    )
