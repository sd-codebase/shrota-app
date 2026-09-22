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
from utils.slugify import generate_unique_slug

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


async def _slug_exists(db: AsyncSession, slug: str, exclude_id: UUID | None = None) -> bool:
    query = select(News.id).where(News.slug == slug)
    if exclude_id is not None:
        query = query.where(News.id != exclude_id)
    result = await db.execute(query)
    return result.scalar_one_or_none() is not None


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
    """Website news detail page: lookup by hyphen-separated slug."""
    result = await db.execute(
        select(News).where(
            News.slug == slug,
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
    slug = await generate_unique_slug(
        news.title, lambda candidate: _slug_exists(db, candidate)
    )

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

    if "title" in update_data and update_data["title"] != existing.title:
        update_data["slug"] = await generate_unique_slug(
            update_data["title"],
            lambda candidate: _slug_exists(db, candidate, exclude_id=uuid_id),
        )

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
