from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Language
from schemas.language import (
    LanguageCreate,
    LanguageUpdate,
    LanguageResponse,
    LanguageBulkCreate,
)

router = APIRouter(prefix="/languages", tags=["Languages"])


def language_to_response(language: Language) -> dict:
    return {
        "id": str(language.id),
        "name": language.name,
        "code": language.code,
        "is_deleted": language.is_deleted,
        "created_at": language.created_at,
        "updated_at": language.updated_at,
    }


@router.get("", response_model=list[LanguageResponse])
async def get_languages(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Language).where(Language.is_deleted == False).order_by(Language.name)
    )
    languages = result.scalars().all()
    return [language_to_response(lang) for lang in languages]


@router.get("/{language_id}", response_model=LanguageResponse)
async def get_language(language_id: str, db: AsyncSession = Depends(get_db)):
    try:
        uuid_id = UUID(language_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid language ID")

    language = await db.get(Language, uuid_id)
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    return language_to_response(language)


@router.post("", response_model=LanguageResponse, status_code=status.HTTP_201_CREATED)
async def create_language(language: LanguageCreate, db: AsyncSession = Depends(get_db)):
    new_language = Language(
        name=language.name,
        code=language.code,
    )
    db.add(new_language)
    await db.commit()
    await db.refresh(new_language)
    return language_to_response(new_language)


@router.post("/bulk", response_model=list[LanguageResponse], status_code=status.HTTP_201_CREATED)
async def bulk_create_languages(data: LanguageBulkCreate, db: AsyncSession = Depends(get_db)):
    new_languages = [
        Language(name=lang.name, code=lang.code)
        for lang in data.languages
    ]
    db.add_all(new_languages)
    await db.commit()
    for lang in new_languages:
        await db.refresh(lang)
    return [language_to_response(lang) for lang in new_languages]


@router.put("/{language_id}", response_model=LanguageResponse)
async def update_language(language_id: str, language: LanguageUpdate, db: AsyncSession = Depends(get_db)):
    try:
        uuid_id = UUID(language_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid language ID")

    existing = await db.get(Language, uuid_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Language not found")

    update_data = language.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    for key, value in update_data.items():
        setattr(existing, key, value)
    existing.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(existing)
    return language_to_response(existing)


@router.delete("/{language_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_language(language_id: str, db: AsyncSession = Depends(get_db)):
    """Soft delete a language by setting is_deleted to true."""
    try:
        uuid_id = UUID(language_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid language ID")

    existing = await db.get(Language, uuid_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Language not found")

    existing.is_deleted = True
    existing.updated_at = datetime.utcnow()
    await db.commit()
    return None
