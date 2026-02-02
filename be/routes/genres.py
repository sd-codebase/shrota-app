from datetime import datetime, timezone
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Genre
from models.admin import Admin
from models.user import User
from schemas.genre import (
    GenreCreate,
    GenreUpdate,
    GenreResponse,
    GenreBulkCreate,
)
from utils.auth import get_current_admin
from utils.age import is_adult as user_is_adult
from routes.user_auth import get_optional_current_user

router = APIRouter(prefix="/genres", tags=["Genres"])


def genre_to_response(genre: Genre) -> dict:
    return {
        "id": str(genre.id),
        "name": genre.name,
        "description": genre.description,
        "thumbnail": genre.thumbnail,
        "is_adult": genre.is_adult,
        "is_deleted": genre.is_deleted,
        "created_at": genre.created_at,
        "updated_at": genre.updated_at,
    }


@router.get("", response_model=list[GenreResponse])
async def get_genres(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Genre).where(Genre.is_deleted == False).order_by(Genre.name)
    )
    genres = result.scalars().all()
    return [genre_to_response(g) for g in genres]


@router.get("/mobile", response_model=list[GenreResponse])
async def get_genres_for_mobile(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Get genres filtered by user age. Adult genres hidden for users under 18."""
    query = select(Genre).where(Genre.is_deleted == False)

    # Filter adult genres for non-adult users
    is_adult = current_user and current_user.birth_date and user_is_adult(current_user.birth_date)
    if not is_adult:
        query = query.where(Genre.is_adult == False)

    query = query.order_by(Genre.name)
    result = await db.execute(query)
    genres = result.scalars().all()
    return [genre_to_response(g) for g in genres]


@router.get("/{genre_id}", response_model=GenreResponse)
async def get_genre(genre_id: str, db: AsyncSession = Depends(get_db)):
    try:
        uuid_id = UUID(genre_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid genre ID")

    genre = await db.get(Genre, uuid_id)
    if not genre:
        raise HTTPException(status_code=404, detail="Genre not found")
    return genre_to_response(genre)


@router.post("", response_model=GenreResponse, status_code=status.HTTP_201_CREATED)
async def create_genre(
    genre: GenreCreate,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    new_genre = Genre(
        name=genre.name,
        description=genre.description,
        thumbnail=genre.thumbnail,
        is_adult=genre.is_adult,
    )
    db.add(new_genre)
    await db.commit()
    await db.refresh(new_genre)
    return genre_to_response(new_genre)


@router.post("/bulk", response_model=list[GenreResponse], status_code=status.HTTP_201_CREATED)
async def bulk_create_genres(
    data: GenreBulkCreate,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    new_genres = [
        Genre(name=g.name, description=g.description, thumbnail=g.thumbnail, is_adult=g.is_adult)
        for g in data.genres
    ]
    db.add_all(new_genres)
    await db.commit()
    for g in new_genres:
        await db.refresh(g)
    return [genre_to_response(g) for g in new_genres]


@router.put("/{genre_id}", response_model=GenreResponse)
async def update_genre(
    genre_id: str,
    genre: GenreUpdate,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    try:
        uuid_id = UUID(genre_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid genre ID")

    existing = await db.get(Genre, uuid_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Genre not found")

    update_data = genre.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    for key, value in update_data.items():
        setattr(existing, key, value)
    existing.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(existing)
    return genre_to_response(existing)


@router.delete("/{genre_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_genre(
    genre_id: str,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Soft delete a genre by setting is_deleted to true."""
    try:
        uuid_id = UUID(genre_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid genre ID")

    existing = await db.get(Genre, uuid_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Genre not found")

    existing.is_deleted = True
    existing.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return None
