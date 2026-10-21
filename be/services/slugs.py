"""
Slug bookkeeping shared by books, genres and news: uniqueness checks that
also respect old slugs still redirecting somewhere, and recording an old slug
when an admin changes it.
"""
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from models.slug_redirect import SlugRedirect
from utils.slugify import generate_unique_slug

LABELS = {"book": "book", "genre": "category", "news": "news item"}


async def is_slug_taken(db: AsyncSession, model, kind: str, slug: str, exclude_id: Optional[UUID] = None) -> bool:
    """In use as another row's current slug, or as another row's old (redirecting) slug."""
    query = select(model.id).where(model.slug == slug)
    if exclude_id is not None:
        query = query.where(model.id != exclude_id)
    if (await db.execute(query.limit(1))).first():
        return True
    query = select(SlugRedirect.target_id).where(SlugRedirect.kind == kind, SlugRedirect.old_slug == slug)
    if exclude_id is not None:
        query = query.where(SlugRedirect.target_id != exclude_id)
    return (await db.execute(query.limit(1))).first() is not None


async def choose_slug(
    db: AsyncSession,
    model,
    kind: str,
    requested: Optional[str],
    title: str,
    fallback: str,
    exclude_id: Optional[UUID] = None,
) -> str:
    """
    The admin's slug (already sanitized by the schema) if given — rejected
    with 409 when another item uses it — otherwise one generated from `title`.
    """
    if requested:
        if await is_slug_taken(db, model, kind, requested, exclude_id):
            raise HTTPException(
                status_code=409,
                detail=f'The slug "{requested}" is already used by another {LABELS[kind]}',
            )
        return requested
    return await generate_unique_slug(
        title, lambda candidate: is_slug_taken(db, model, kind, candidate, exclude_id), fallback
    )


async def record_slug_change(db: AsyncSession, kind: str, target_id: UUID, old_slug: str, new_slug: str) -> None:
    """Keep `old_slug` redirecting to `target_id`; the new slug is live again, so it no longer redirects."""
    if old_slug == new_slug:
        return
    await db.execute(
        delete(SlugRedirect).where(SlugRedirect.kind == kind, SlugRedirect.old_slug.in_([old_slug, new_slug]))
    )
    db.add(SlugRedirect(kind=kind, old_slug=old_slug, target_id=target_id))


async def find_redirect_target(db: AsyncSession, kind: str, slug: str) -> Optional[UUID]:
    result = await db.execute(
        select(SlugRedirect.target_id).where(SlugRedirect.kind == kind, SlugRedirect.old_slug == slug)
    )
    return result.scalar_one_or_none()
