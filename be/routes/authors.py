from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Author
from schemas.author import (
    AuthorCreate,
    AuthorUpdate,
    AuthorResponse,
    AuthorBulkCreate,
)

router = APIRouter(prefix="/authors", tags=["Authors"])


def author_to_response(author: Author) -> dict:
    return {
        "id": str(author.id),
        "name": author.name,
        "bio": author.bio,
        "social_media": author.social_media,
        "is_deleted": author.is_deleted,
        "created_at": author.created_at,
        "updated_at": author.updated_at,
    }


@router.get("", response_model=list[AuthorResponse])
async def get_authors(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Author).where(Author.is_deleted == False).order_by(Author.name)
    )
    authors = result.scalars().all()
    return [author_to_response(a) for a in authors]


@router.get("/{author_id}", response_model=AuthorResponse)
async def get_author(author_id: str, db: AsyncSession = Depends(get_db)):
    try:
        uuid_id = UUID(author_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid author ID")

    author = await db.get(Author, uuid_id)
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")
    return author_to_response(author)


@router.post("", response_model=AuthorResponse, status_code=status.HTTP_201_CREATED)
async def create_author(author: AuthorCreate, db: AsyncSession = Depends(get_db)):
    new_author = Author(
        name=author.name,
        bio=author.bio,
        social_media=author.social_media.model_dump() if author.social_media else None,
    )
    db.add(new_author)
    await db.commit()
    await db.refresh(new_author)
    return author_to_response(new_author)


@router.post("/bulk", response_model=list[AuthorResponse], status_code=status.HTTP_201_CREATED)
async def bulk_create_authors(data: AuthorBulkCreate, db: AsyncSession = Depends(get_db)):
    new_authors = [
        Author(
            name=a.name,
            bio=a.bio,
            social_media=a.social_media.model_dump() if a.social_media else None,
        )
        for a in data.authors
    ]
    db.add_all(new_authors)
    await db.commit()
    for a in new_authors:
        await db.refresh(a)
    return [author_to_response(a) for a in new_authors]


@router.put("/{author_id}", response_model=AuthorResponse)
async def update_author(author_id: str, author: AuthorUpdate, db: AsyncSession = Depends(get_db)):
    try:
        uuid_id = UUID(author_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid author ID")

    existing = await db.get(Author, uuid_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Author not found")

    update_data = author.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    for key, value in update_data.items():
        if key == "social_media" and value is not None:
            setattr(existing, key, value if isinstance(value, dict) else value)
        else:
            setattr(existing, key, value)
    existing.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(existing)
    return author_to_response(existing)


@router.delete("/{author_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_author(author_id: str, db: AsyncSession = Depends(get_db)):
    """Soft delete an author by setting is_deleted to true."""
    try:
        uuid_id = UUID(author_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid author ID")

    existing = await db.get(Author, uuid_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Author not found")

    existing.is_deleted = True
    existing.updated_at = datetime.utcnow()
    await db.commit()
    return None
