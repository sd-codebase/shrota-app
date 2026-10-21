from datetime import datetime, timezone
from uuid import UUID
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import News
from models.admin import Admin
from schemas.news import NewsCreate, NewsUpdate, NewsResponse
from utils.auth import require_full_admin
from services.slugs import choose_slug, record_slug_change, find_redirect_target

router = APIRouter(prefix="/news", tags=["News"])


def news_to_response(news: News) -> dict:
    return {
        "id": str(news.id),
        "title": news.title,
        "slug": news.slug,
        "text": news.text,
        "cover_image": news.cover_image,
        "is_active": news.is_active,
        "is_deleted": news.is_deleted,
        "created_at": news.created_at,
        "updated_at": news.updated_at,
    }


@router.get("", response_model=list[NewsResponse])
async def get_news_list(
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    """Admin: all non-deleted news regardless of active status."""
    result = await db.execute(
        select(News)
        .where(News.is_deleted == False)
        .order_by(News.created_at.desc())
    )
    news_items = result.scalars().all()
    return [news_to_response(n) for n in news_items]


@router.get("/public", response_model=list[NewsResponse])
async def get_public_news(db: AsyncSession = Depends(get_db)):
    """Website news page: active news only, descending."""
    result = await db.execute(
        select(News)
        .where(News.is_deleted == False, News.is_active == True)
        .order_by(News.created_at.desc())
    )
    news_items = result.scalars().all()
    return [news_to_response(n) for n in news_items]


@router.get("/{slug}", response_model=NewsResponse)
async def get_news_item(slug: str, db: AsyncSession = Depends(get_db)):
    """
    Website news detail page: lookup by hyphen-separated slug. An old slug
    returns the item with its current slug, so the website can redirect.
    """
    target_id = await find_redirect_target(db, "news", slug)
    condition = News.id == target_id if target_id else News.slug == slug
    result = await db.execute(
        select(News).where(
            condition,
            News.is_deleted == False,
            News.is_active == True,
        )
    )
    news = result.scalar_one_or_none()
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    return news_to_response(news)


@router.post("", response_model=NewsResponse, status_code=status.HTTP_201_CREATED)
async def create_news(
    news: NewsCreate,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    slug = await choose_slug(db, News, "news", news.slug, news.title, fallback="news")

    new_news = News(
        title=news.title,
        slug=slug,
        text=news.text,
        cover_image=news.cover_image,
        is_active=news.is_active,
    )
    db.add(new_news)
    await db.commit()
    await db.refresh(new_news)
    return news_to_response(new_news)


@router.put("/{news_id}", response_model=NewsResponse)
async def update_news(
    news_id: str,
    news: NewsUpdate,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    try:
        uuid_id = UUID(news_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid news ID")

    existing = await db.get(News, uuid_id)
    if not existing or existing.is_deleted:
        raise HTTPException(status_code=404, detail="News not found")

    update_data = news.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    # The slug changes only when the admin edits it (blank = generate from
    # the title), so shared links stay put. The old slug keeps redirecting.
    requested_slug = update_data.pop("slug", None)
    if requested_slug is not None and requested_slug != existing.slug:
        new_slug = await choose_slug(
            db, News, "news", requested_slug,
            update_data.get("title", existing.title), fallback="news", exclude_id=uuid_id,
        )
        if new_slug != existing.slug:
            await record_slug_change(db, "news", existing.id, existing.slug, new_slug)
            existing.slug = new_slug

    for key, value in update_data.items():
        setattr(existing, key, value)
    existing.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(existing)
    return news_to_response(existing)


@router.delete("/{news_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_news(
    news_id: str,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    try:
        uuid_id = UUID(news_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid news ID")

    existing = await db.get(News, uuid_id)
    if not existing or existing.is_deleted:
        raise HTTPException(status_code=404, detail="News not found")

    existing.is_deleted = True
    existing.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return None
