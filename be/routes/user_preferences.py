from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from database import get_db
from models.user import User
from models.language import Language
from models.genre import Genre
from models.user_preferences import UserPreferences, user_preferred_languages, user_preferred_genres
from schemas.user_preferences import PreferencesUpdate, PreferencesResponse
from routes.user_auth import get_current_user

router = APIRouter(prefix="/v1/preferences", tags=["User Preferences"])


@router.get("", response_model=PreferencesResponse)
async def get_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's preferences."""
    result = await db.execute(
        select(UserPreferences)
        .options(
            selectinload(UserPreferences.languages),
            selectinload(UserPreferences.genres)
        )
        .where(UserPreferences.user_id == current_user.id)
    )
    preferences = result.scalar_one_or_none()

    if not preferences:
        # Return empty preferences if none set
        return PreferencesResponse(
            language_ids=[],
            genre_ids=[],
            updated_at=datetime.now(timezone.utc)
        )

    return PreferencesResponse(
        language_ids=[str(lang.id) for lang in preferences.languages],
        genre_ids=[str(genre.id) for genre in preferences.genres],
        updated_at=preferences.updated_at
    )


@router.put("", response_model=PreferencesResponse)
async def update_preferences(
    data: PreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user's preferences."""
    # Validate language IDs
    language_uuids = []
    for lang_id in data.language_ids:
        try:
            language_uuids.append(UUID(lang_id))
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid language ID: {lang_id}")

    # Validate genre IDs
    genre_uuids = []
    for genre_id in data.genre_ids:
        try:
            genre_uuids.append(UUID(genre_id))
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid genre ID: {genre_id}")

    # Verify languages exist
    lang_result = await db.execute(
        select(Language).where(Language.id.in_(language_uuids), Language.is_deleted == False)
    )
    languages = lang_result.scalars().all()
    if len(languages) != len(language_uuids):
        raise HTTPException(status_code=400, detail="One or more languages not found")

    # Verify genres exist
    genre_result = await db.execute(
        select(Genre).where(Genre.id.in_(genre_uuids), Genre.is_deleted == False)
    )
    genres = genre_result.scalars().all()
    if len(genres) != len(genre_uuids):
        raise HTTPException(status_code=400, detail="One or more genres not found")

    # Get or create user preferences
    result = await db.execute(
        select(UserPreferences).where(UserPreferences.user_id == current_user.id)
    )
    preferences = result.scalar_one_or_none()

    if not preferences:
        preferences = UserPreferences(user_id=current_user.id)
        db.add(preferences)
        await db.flush()

    # Clear existing preferences
    await db.execute(
        delete(user_preferred_languages).where(
            user_preferred_languages.c.user_id == current_user.id
        )
    )
    await db.execute(
        delete(user_preferred_genres).where(
            user_preferred_genres.c.user_id == current_user.id
        )
    )

    # Set new preferences
    preferences.languages = list(languages)
    preferences.genres = list(genres)
    preferences.updated_at = datetime.now(timezone.utc)

    await db.commit()

    # Refresh to get updated relationships
    await db.refresh(preferences)
    result = await db.execute(
        select(UserPreferences)
        .options(
            selectinload(UserPreferences.languages),
            selectinload(UserPreferences.genres)
        )
        .where(UserPreferences.id == preferences.id)
    )
    preferences = result.scalar_one()

    return PreferencesResponse(
        language_ids=[str(lang.id) for lang in preferences.languages],
        genre_ids=[str(genre.id) for genre in preferences.genres],
        updated_at=preferences.updated_at
    )
