from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from database import get_db
from models import NewRelease, FeaturedBook, PromotedBook, Book, Language, Genre
from schemas.content_promotion import (
    NewReleaseCreate,
    NewReleaseUpdate,
    NewReleaseResponse,
    FeaturedBookCreate,
    FeaturedBookUpdate,
    FeaturedBookResponse,
    PromotedBookCreate,
    PromotedBookUpdate,
    PromotedBookResponse,
    ReorderRequest,
)

router = APIRouter(prefix="/content", tags=["Content Promotion"])


# Helper functions
def new_release_to_response(entry: NewRelease) -> dict:
    return {
        "id": str(entry.id),
        "book_id": str(entry.book_id),
        "language_id": str(entry.language_id),
        "book": {
            "id": str(entry.book.id),
            "title": entry.book.title,
        },
        "language": {
            "id": str(entry.language.id),
            "name": entry.language.name,
            "code": entry.language.code,
        },
        "display_order": entry.display_order,
        "is_active": entry.is_active,
        "starts_at": entry.starts_at,
        "expires_at": entry.expires_at,
        "created_at": entry.created_at,
        "updated_at": entry.updated_at,
    }


def featured_book_to_response(entry: FeaturedBook) -> dict:
    return {
        "id": str(entry.id),
        "book_id": str(entry.book_id),
        "language_id": str(entry.language_id),
        "book": {
            "id": str(entry.book.id),
            "title": entry.book.title,
        },
        "language": {
            "id": str(entry.language.id),
            "name": entry.language.name,
            "code": entry.language.code,
        },
        "display_order": entry.display_order,
        "is_active": entry.is_active,
        "starts_at": entry.starts_at,
        "expires_at": entry.expires_at,
        "created_at": entry.created_at,
        "updated_at": entry.updated_at,
    }


def promoted_book_to_response(entry: PromotedBook) -> dict:
    return {
        "id": str(entry.id),
        "book_id": str(entry.book_id),
        "genre_id": str(entry.genre_id),
        "book": {
            "id": str(entry.book.id),
            "title": entry.book.title,
        },
        "genre": {
            "id": str(entry.genre.id),
            "name": entry.genre.name,
        },
        "display_order": entry.display_order,
        "is_active": entry.is_active,
        "starts_at": entry.starts_at,
        "expires_at": entry.expires_at,
        "created_at": entry.created_at,
        "updated_at": entry.updated_at,
    }


# ==================== NEW RELEASES ====================

@router.get("/new-releases", response_model=list[NewReleaseResponse])
async def get_new_releases(db: AsyncSession = Depends(get_db)):
    """Get all new releases (admin view)."""
    result = await db.execute(
        select(NewRelease)
        .options(joinedload(NewRelease.book), joinedload(NewRelease.language))
        .order_by(NewRelease.language_id, NewRelease.display_order)
    )
    entries = result.unique().scalars().all()
    return [new_release_to_response(e) for e in entries]


@router.get("/new-releases/language/{language_id}", response_model=list[NewReleaseResponse])
async def get_new_releases_by_language(language_id: str, db: AsyncSession = Depends(get_db)):
    """Get active new releases for a specific language, ordered by display_order."""
    try:
        uuid_id = UUID(language_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid language ID")

    result = await db.execute(
        select(NewRelease)
        .options(joinedload(NewRelease.book), joinedload(NewRelease.language))
        .where(
            NewRelease.language_id == uuid_id,
            NewRelease.is_active == True,
        )
        .order_by(NewRelease.display_order)
    )
    entries = result.unique().scalars().all()
    return [new_release_to_response(e) for e in entries]


@router.post("/new-releases", response_model=NewReleaseResponse, status_code=status.HTTP_201_CREATED)
async def create_new_release(data: NewReleaseCreate, db: AsyncSession = Depends(get_db)):
    """Add a book as a new release for a language."""
    try:
        book_uuid = UUID(data.book_id)
        language_uuid = UUID(data.language_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")

    # Validate book exists
    book = await db.get(Book, book_uuid)
    if not book or book.is_deleted:
        raise HTTPException(status_code=404, detail="Book not found")

    # Validate language exists
    language = await db.get(Language, language_uuid)
    if not language or language.is_deleted:
        raise HTTPException(status_code=404, detail="Language not found")

    # Check for duplicate
    existing = await db.execute(
        select(NewRelease).where(
            NewRelease.book_id == book_uuid,
            NewRelease.language_id == language_uuid,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="This book is already a new release for this language")

    new_entry = NewRelease(
        book_id=book_uuid,
        language_id=language_uuid,
        display_order=data.display_order,
        is_active=data.is_active,
        starts_at=data.starts_at,
        expires_at=data.expires_at,
    )
    db.add(new_entry)
    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(NewRelease)
        .options(joinedload(NewRelease.book), joinedload(NewRelease.language))
        .where(NewRelease.id == new_entry.id)
    )
    entry = result.unique().scalar_one()
    return new_release_to_response(entry)


@router.put("/new-releases/{entry_id}", response_model=NewReleaseResponse)
async def update_new_release(entry_id: str, data: NewReleaseUpdate, db: AsyncSession = Depends(get_db)):
    """Update a new release entry."""
    try:
        uuid_id = UUID(entry_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid entry ID")

    result = await db.execute(
        select(NewRelease)
        .options(joinedload(NewRelease.book), joinedload(NewRelease.language))
        .where(NewRelease.id == uuid_id)
    )
    entry = result.unique().scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="New release entry not found")

    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    for key, value in update_data.items():
        setattr(entry, key, value)
    entry.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(entry)
    return new_release_to_response(entry)


@router.delete("/new-releases/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_new_release(entry_id: str, db: AsyncSession = Depends(get_db)):
    """Remove a book from new releases."""
    try:
        uuid_id = UUID(entry_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid entry ID")

    entry = await db.get(NewRelease, uuid_id)
    if not entry:
        raise HTTPException(status_code=404, detail="New release entry not found")

    await db.delete(entry)
    await db.commit()
    return None


@router.put("/new-releases/reorder", response_model=list[NewReleaseResponse])
async def reorder_new_releases(data: ReorderRequest, db: AsyncSession = Depends(get_db)):
    """Bulk reorder new releases."""
    updated_entries = []

    for item in data.items:
        try:
            uuid_id = UUID(item.id)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid entry ID: {item.id}")

        result = await db.execute(
            select(NewRelease)
            .options(joinedload(NewRelease.book), joinedload(NewRelease.language))
            .where(NewRelease.id == uuid_id)
        )
        entry = result.unique().scalar_one_or_none()
        if not entry:
            raise HTTPException(status_code=404, detail=f"New release entry not found: {item.id}")

        entry.display_order = item.display_order
        entry.updated_at = datetime.utcnow()
        updated_entries.append(entry)

    await db.commit()

    for entry in updated_entries:
        await db.refresh(entry)

    return [new_release_to_response(e) for e in updated_entries]


# ==================== FEATURED BOOKS ====================

@router.get("/featured", response_model=list[FeaturedBookResponse])
async def get_featured_books(db: AsyncSession = Depends(get_db)):
    """Get all featured books (admin view)."""
    result = await db.execute(
        select(FeaturedBook)
        .options(joinedload(FeaturedBook.book), joinedload(FeaturedBook.language))
        .order_by(FeaturedBook.language_id, FeaturedBook.display_order)
    )
    entries = result.unique().scalars().all()
    return [featured_book_to_response(e) for e in entries]


@router.get("/featured/language/{language_id}", response_model=list[FeaturedBookResponse])
async def get_featured_books_by_language(language_id: str, db: AsyncSession = Depends(get_db)):
    """Get active featured books for a specific language, ordered by display_order."""
    try:
        uuid_id = UUID(language_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid language ID")

    result = await db.execute(
        select(FeaturedBook)
        .options(joinedload(FeaturedBook.book), joinedload(FeaturedBook.language))
        .where(
            FeaturedBook.language_id == uuid_id,
            FeaturedBook.is_active == True,
        )
        .order_by(FeaturedBook.display_order)
    )
    entries = result.unique().scalars().all()
    return [featured_book_to_response(e) for e in entries]


@router.post("/featured", response_model=FeaturedBookResponse, status_code=status.HTTP_201_CREATED)
async def create_featured_book(data: FeaturedBookCreate, db: AsyncSession = Depends(get_db)):
    """Add a book as featured for a language."""
    try:
        book_uuid = UUID(data.book_id)
        language_uuid = UUID(data.language_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")

    # Validate book exists
    book = await db.get(Book, book_uuid)
    if not book or book.is_deleted:
        raise HTTPException(status_code=404, detail="Book not found")

    # Validate language exists
    language = await db.get(Language, language_uuid)
    if not language or language.is_deleted:
        raise HTTPException(status_code=404, detail="Language not found")

    # Check for duplicate
    existing = await db.execute(
        select(FeaturedBook).where(
            FeaturedBook.book_id == book_uuid,
            FeaturedBook.language_id == language_uuid,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="This book is already featured for this language")

    new_entry = FeaturedBook(
        book_id=book_uuid,
        language_id=language_uuid,
        display_order=data.display_order,
        is_active=data.is_active,
        starts_at=data.starts_at,
        expires_at=data.expires_at,
    )
    db.add(new_entry)
    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(FeaturedBook)
        .options(joinedload(FeaturedBook.book), joinedload(FeaturedBook.language))
        .where(FeaturedBook.id == new_entry.id)
    )
    entry = result.unique().scalar_one()
    return featured_book_to_response(entry)


@router.put("/featured/{entry_id}", response_model=FeaturedBookResponse)
async def update_featured_book(entry_id: str, data: FeaturedBookUpdate, db: AsyncSession = Depends(get_db)):
    """Update a featured book entry."""
    try:
        uuid_id = UUID(entry_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid entry ID")

    result = await db.execute(
        select(FeaturedBook)
        .options(joinedload(FeaturedBook.book), joinedload(FeaturedBook.language))
        .where(FeaturedBook.id == uuid_id)
    )
    entry = result.unique().scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Featured book entry not found")

    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    for key, value in update_data.items():
        setattr(entry, key, value)
    entry.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(entry)
    return featured_book_to_response(entry)


@router.delete("/featured/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_featured_book(entry_id: str, db: AsyncSession = Depends(get_db)):
    """Remove a book from featured."""
    try:
        uuid_id = UUID(entry_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid entry ID")

    entry = await db.get(FeaturedBook, uuid_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Featured book entry not found")

    await db.delete(entry)
    await db.commit()
    return None


@router.put("/featured/reorder", response_model=list[FeaturedBookResponse])
async def reorder_featured_books(data: ReorderRequest, db: AsyncSession = Depends(get_db)):
    """Bulk reorder featured books."""
    updated_entries = []

    for item in data.items:
        try:
            uuid_id = UUID(item.id)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid entry ID: {item.id}")

        result = await db.execute(
            select(FeaturedBook)
            .options(joinedload(FeaturedBook.book), joinedload(FeaturedBook.language))
            .where(FeaturedBook.id == uuid_id)
        )
        entry = result.unique().scalar_one_or_none()
        if not entry:
            raise HTTPException(status_code=404, detail=f"Featured book entry not found: {item.id}")

        entry.display_order = item.display_order
        entry.updated_at = datetime.utcnow()
        updated_entries.append(entry)

    await db.commit()

    for entry in updated_entries:
        await db.refresh(entry)

    return [featured_book_to_response(e) for e in updated_entries]


# ==================== PROMOTED BOOKS ====================

@router.get("/promoted", response_model=list[PromotedBookResponse])
async def get_promoted_books(db: AsyncSession = Depends(get_db)):
    """Get all promoted books (admin view)."""
    result = await db.execute(
        select(PromotedBook)
        .options(joinedload(PromotedBook.book), joinedload(PromotedBook.genre))
        .order_by(PromotedBook.genre_id, PromotedBook.display_order)
    )
    entries = result.unique().scalars().all()
    return [promoted_book_to_response(e) for e in entries]


@router.get("/promoted/genre/{genre_id}", response_model=list[PromotedBookResponse])
async def get_promoted_books_by_genre(genre_id: str, db: AsyncSession = Depends(get_db)):
    """Get active promoted books for a specific genre, ordered by display_order."""
    try:
        uuid_id = UUID(genre_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid genre ID")

    result = await db.execute(
        select(PromotedBook)
        .options(joinedload(PromotedBook.book), joinedload(PromotedBook.genre))
        .where(
            PromotedBook.genre_id == uuid_id,
            PromotedBook.is_active == True,
        )
        .order_by(PromotedBook.display_order)
    )
    entries = result.unique().scalars().all()
    return [promoted_book_to_response(e) for e in entries]


@router.post("/promoted", response_model=PromotedBookResponse, status_code=status.HTTP_201_CREATED)
async def create_promoted_book(data: PromotedBookCreate, db: AsyncSession = Depends(get_db)):
    """Add a book as promoted for a genre."""
    try:
        book_uuid = UUID(data.book_id)
        genre_uuid = UUID(data.genre_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")

    # Validate book exists
    book = await db.get(Book, book_uuid)
    if not book or book.is_deleted:
        raise HTTPException(status_code=404, detail="Book not found")

    # Validate genre exists
    genre = await db.get(Genre, genre_uuid)
    if not genre or genre.is_deleted:
        raise HTTPException(status_code=404, detail="Genre not found")

    # Check for duplicate
    existing = await db.execute(
        select(PromotedBook).where(
            PromotedBook.book_id == book_uuid,
            PromotedBook.genre_id == genre_uuid,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="This book is already promoted for this genre")

    new_entry = PromotedBook(
        book_id=book_uuid,
        genre_id=genre_uuid,
        display_order=data.display_order,
        is_active=data.is_active,
        starts_at=data.starts_at,
        expires_at=data.expires_at,
    )
    db.add(new_entry)
    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(PromotedBook)
        .options(joinedload(PromotedBook.book), joinedload(PromotedBook.genre))
        .where(PromotedBook.id == new_entry.id)
    )
    entry = result.unique().scalar_one()
    return promoted_book_to_response(entry)


@router.put("/promoted/{entry_id}", response_model=PromotedBookResponse)
async def update_promoted_book(entry_id: str, data: PromotedBookUpdate, db: AsyncSession = Depends(get_db)):
    """Update a promoted book entry."""
    try:
        uuid_id = UUID(entry_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid entry ID")

    result = await db.execute(
        select(PromotedBook)
        .options(joinedload(PromotedBook.book), joinedload(PromotedBook.genre))
        .where(PromotedBook.id == uuid_id)
    )
    entry = result.unique().scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Promoted book entry not found")

    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    for key, value in update_data.items():
        setattr(entry, key, value)
    entry.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(entry)
    return promoted_book_to_response(entry)


@router.delete("/promoted/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_promoted_book(entry_id: str, db: AsyncSession = Depends(get_db)):
    """Remove a book from promoted."""
    try:
        uuid_id = UUID(entry_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid entry ID")

    entry = await db.get(PromotedBook, uuid_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Promoted book entry not found")

    await db.delete(entry)
    await db.commit()
    return None


@router.put("/promoted/reorder", response_model=list[PromotedBookResponse])
async def reorder_promoted_books(data: ReorderRequest, db: AsyncSession = Depends(get_db)):
    """Bulk reorder promoted books."""
    updated_entries = []

    for item in data.items:
        try:
            uuid_id = UUID(item.id)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid entry ID: {item.id}")

        result = await db.execute(
            select(PromotedBook)
            .options(joinedload(PromotedBook.book), joinedload(PromotedBook.genre))
            .where(PromotedBook.id == uuid_id)
        )
        entry = result.unique().scalar_one_or_none()
        if not entry:
            raise HTTPException(status_code=404, detail=f"Promoted book entry not found: {item.id}")

        entry.display_order = item.display_order
        entry.updated_at = datetime.utcnow()
        updated_entries.append(entry)

    await db.commit()

    for entry in updated_entries:
        await db.refresh(entry)

    return [promoted_book_to_response(e) for e in updated_entries]
