from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Artist
from schemas.artist import (
    ArtistCreate,
    ArtistUpdate,
    ArtistResponse,
    ArtistBulkCreate,
)

router = APIRouter(prefix="/artists", tags=["Artists"])


def artist_to_response(artist: Artist) -> dict:
    return {
        "id": str(artist.id),
        "name": artist.name,
        "bio": artist.bio,
        "social_media": artist.social_media,
        "is_deleted": artist.is_deleted,
        "created_at": artist.created_at,
        "updated_at": artist.updated_at,
    }


@router.get("", response_model=list[ArtistResponse])
async def get_artists(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Artist).where(Artist.is_deleted == False).order_by(Artist.name)
    )
    artists = result.scalars().all()
    return [artist_to_response(a) for a in artists]


@router.get("/{artist_id}", response_model=ArtistResponse)
async def get_artist(artist_id: str, db: AsyncSession = Depends(get_db)):
    try:
        uuid_id = UUID(artist_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid artist ID")

    artist = await db.get(Artist, uuid_id)
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    return artist_to_response(artist)


@router.post("", response_model=ArtistResponse, status_code=status.HTTP_201_CREATED)
async def create_artist(artist: ArtistCreate, db: AsyncSession = Depends(get_db)):
    new_artist = Artist(
        name=artist.name,
        bio=artist.bio,
        social_media=artist.social_media.model_dump() if artist.social_media else None,
    )
    db.add(new_artist)
    await db.commit()
    await db.refresh(new_artist)
    return artist_to_response(new_artist)


@router.post("/bulk", response_model=list[ArtistResponse], status_code=status.HTTP_201_CREATED)
async def bulk_create_artists(data: ArtistBulkCreate, db: AsyncSession = Depends(get_db)):
    new_artists = [
        Artist(
            name=a.name,
            bio=a.bio,
            social_media=a.social_media.model_dump() if a.social_media else None,
        )
        for a in data.artists
    ]
    db.add_all(new_artists)
    await db.commit()
    for a in new_artists:
        await db.refresh(a)
    return [artist_to_response(a) for a in new_artists]


@router.put("/{artist_id}", response_model=ArtistResponse)
async def update_artist(artist_id: str, artist: ArtistUpdate, db: AsyncSession = Depends(get_db)):
    try:
        uuid_id = UUID(artist_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid artist ID")

    existing = await db.get(Artist, uuid_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Artist not found")

    update_data = artist.model_dump(exclude_unset=True)
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
    return artist_to_response(existing)


@router.delete("/{artist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_artist(artist_id: str, db: AsyncSession = Depends(get_db)):
    """Soft delete an artist by setting is_deleted to true."""
    try:
        uuid_id = UUID(artist_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid artist ID")

    existing = await db.get(Artist, uuid_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Artist not found")

    existing.is_deleted = True
    existing.updated_at = datetime.utcnow()
    await db.commit()
    return None
