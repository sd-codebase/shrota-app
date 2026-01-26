from datetime import datetime
from uuid import UUID
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
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


# ==================== MOBILE API ENDPOINTS ====================
# These endpoints return full book details for the mobile app

def book_to_mobile_response(book: Book, authors: list, artists: list) -> dict:
    """Convert Book model to full mobile response dict."""
    chapters = [
        {
            "id": str(ch.id),
            "title": ch.title,
            "description": ch.description,
            "order": ch.order,
            "audio_url": ch.audio_url,
            "duration": ch.duration,
            "is_published": ch.is_published,
            "thumbnail": ch.image,
        }
        for ch in book.chapters
        if not ch.is_deleted
    ]

    author_names = [a.name for a in authors if str(a.id) in [str(aid) for aid in book.author_ids_list]]
    artist_names = [a.name for a in artists if str(a.id) in [str(aid) for aid in book.artist_ids_list]]

    return {
        "id": str(book.id),
        "title": book.title,
        "information": book.information,
        "thumbnail": book.thumbnail,
        "total_duration": book.total_duration,
        "is_published": book.is_published,
        "genre_ids": [str(gid) for gid in book.genre_ids_list],
        "author_ids": [str(aid) for aid in book.author_ids_list],
        "author_names": author_names,
        "artist_ids": [str(aid) for aid in book.artist_ids_list],
        "artist_names": artist_names,
        "publisher_id": str(book.publisher_id) if book.publisher_id else None,
        "language_id": str(book.language_id) if book.language_id else None,
        "chapters": chapters,
    }


@router.get("/mobile/new-releases/language/{language_id}")
async def get_new_releases_mobile(language_id: str, db: AsyncSession = Depends(get_db)):
    """
    Get active new releases for a specific language with full book details.
    Returns published books only, ordered by display_order.
    Falls back to latest published books in the language if no promotions exist.
    """
    from sqlalchemy.orm import selectinload
    from models import Author, Artist
    from models.book import book_authors, book_artists, book_genres

    try:
        uuid_id = UUID(language_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid language ID")

    # First try to get promoted new releases
    result = await db.execute(
        select(NewRelease)
        .options(
            joinedload(NewRelease.book).selectinload(Book.chapters),
        )
        .where(
            NewRelease.language_id == uuid_id,
            NewRelease.is_active == True,
        )
        .order_by(NewRelease.display_order)
    )
    entries = result.unique().scalars().all()

    # Get all authors and artists for mapping
    authors_result = await db.execute(select(Author))
    all_authors = authors_result.scalars().all()
    artists_result = await db.execute(select(Artist))
    all_artists = artists_result.scalars().all()

    if entries:
        books = []
        for entry in entries:
            if entry.book.is_published and not entry.book.is_deleted:
                # Get book's author and artist IDs
                book_author_ids = await db.execute(
                    select(book_authors.c.author_id).where(book_authors.c.book_id == entry.book.id)
                )
                entry.book.author_ids_list = [row[0] for row in book_author_ids.fetchall()]

                book_artist_ids = await db.execute(
                    select(book_artists.c.artist_id).where(book_artists.c.book_id == entry.book.id)
                )
                entry.book.artist_ids_list = [row[0] for row in book_artist_ids.fetchall()]

                book_genre_ids = await db.execute(
                    select(book_genres.c.genre_id).where(book_genres.c.book_id == entry.book.id)
                )
                entry.book.genre_ids_list = [row[0] for row in book_genre_ids.fetchall()]

                books.append(book_to_mobile_response(entry.book, all_authors, all_artists))
        return books

    # Fallback: Get latest published books in this language
    fallback_result = await db.execute(
        select(Book)
        .options(selectinload(Book.chapters))
        .where(
            Book.language_id == uuid_id,
            Book.is_published == True,
            Book.is_deleted == False,
        )
        .order_by(Book.created_at.desc())
        .limit(10)
    )
    fallback_books = fallback_result.scalars().all()

    books = []
    for book in fallback_books:
        book_author_ids = await db.execute(
            select(book_authors.c.author_id).where(book_authors.c.book_id == book.id)
        )
        book.author_ids_list = [row[0] for row in book_author_ids.fetchall()]

        book_artist_ids = await db.execute(
            select(book_artists.c.artist_id).where(book_artists.c.book_id == book.id)
        )
        book.artist_ids_list = [row[0] for row in book_artist_ids.fetchall()]

        book_genre_ids = await db.execute(
            select(book_genres.c.genre_id).where(book_genres.c.book_id == book.id)
        )
        book.genre_ids_list = [row[0] for row in book_genre_ids.fetchall()]

        books.append(book_to_mobile_response(book, all_authors, all_artists))

    return books


@router.get("/mobile/featured/language/{language_id}")
async def get_featured_books_mobile(language_id: str, db: AsyncSession = Depends(get_db)):
    """
    Get active featured books for a specific language with full book details.
    Returns published books only, ordered by display_order.
    Falls back to popular books in the language if no promotions exist.
    """
    from sqlalchemy.orm import selectinload
    from models import Author, Artist
    from models.book import book_authors, book_artists, book_genres

    try:
        uuid_id = UUID(language_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid language ID")

    # First try to get promoted featured books
    result = await db.execute(
        select(FeaturedBook)
        .options(
            joinedload(FeaturedBook.book).selectinload(Book.chapters),
        )
        .where(
            FeaturedBook.language_id == uuid_id,
            FeaturedBook.is_active == True,
        )
        .order_by(FeaturedBook.display_order)
    )
    entries = result.unique().scalars().all()

    # Get all authors and artists for mapping
    authors_result = await db.execute(select(Author))
    all_authors = authors_result.scalars().all()
    artists_result = await db.execute(select(Artist))
    all_artists = artists_result.scalars().all()

    if entries:
        books = []
        for entry in entries:
            if entry.book.is_published and not entry.book.is_deleted:
                book_author_ids = await db.execute(
                    select(book_authors.c.author_id).where(book_authors.c.book_id == entry.book.id)
                )
                entry.book.author_ids_list = [row[0] for row in book_author_ids.fetchall()]

                book_artist_ids = await db.execute(
                    select(book_artists.c.artist_id).where(book_artists.c.book_id == entry.book.id)
                )
                entry.book.artist_ids_list = [row[0] for row in book_artist_ids.fetchall()]

                book_genre_ids = await db.execute(
                    select(book_genres.c.genre_id).where(book_genres.c.book_id == entry.book.id)
                )
                entry.book.genre_ids_list = [row[0] for row in book_genre_ids.fetchall()]

                books.append(book_to_mobile_response(entry.book, all_authors, all_artists))
        return books

    # Fallback: Get published books in this language (random selection)
    fallback_result = await db.execute(
        select(Book)
        .options(selectinload(Book.chapters))
        .where(
            Book.language_id == uuid_id,
            Book.is_published == True,
            Book.is_deleted == False,
        )
        .order_by(Book.updated_at.desc())
        .limit(10)
    )
    fallback_books = fallback_result.scalars().all()

    books = []
    for book in fallback_books:
        book_author_ids = await db.execute(
            select(book_authors.c.author_id).where(book_authors.c.book_id == book.id)
        )
        book.author_ids_list = [row[0] for row in book_author_ids.fetchall()]

        book_artist_ids = await db.execute(
            select(book_artists.c.artist_id).where(book_artists.c.book_id == book.id)
        )
        book.artist_ids_list = [row[0] for row in book_artist_ids.fetchall()]

        book_genre_ids = await db.execute(
            select(book_genres.c.genre_id).where(book_genres.c.book_id == book.id)
        )
        book.genre_ids_list = [row[0] for row in book_genre_ids.fetchall()]

        books.append(book_to_mobile_response(book, all_authors, all_artists))

    return books


@router.get("/mobile/genre/{genre_id}")
async def get_books_by_genre_mobile(
    genre_id: str,
    language_id: str = None,
    limit: int = 10,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """
    Get published books for a specific genre with full book details.
    Optionally filter by language. Returns books ordered by creation date.
    First tries promoted books, then falls back to regular books.
    """
    from sqlalchemy.orm import selectinload
    from models import Author, Artist
    from models.book import book_authors, book_artists, book_genres

    try:
        genre_uuid = UUID(genre_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid genre ID")

    language_uuid = None
    if language_id:
        try:
            language_uuid = UUID(language_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid language ID")

    # Get all authors and artists for mapping
    authors_result = await db.execute(select(Author))
    all_authors = authors_result.scalars().all()
    artists_result = await db.execute(select(Artist))
    all_artists = artists_result.scalars().all()

    # First try promoted books for this genre
    promo_result = await db.execute(
        select(PromotedBook)
        .options(
            joinedload(PromotedBook.book).selectinload(Book.chapters),
        )
        .where(
            PromotedBook.genre_id == genre_uuid,
            PromotedBook.is_active == True,
        )
        .order_by(PromotedBook.display_order)
    )
    promo_entries = promo_result.unique().scalars().all()

    promoted_books = []
    for entry in promo_entries:
        # Filter by language if specified
        if language_uuid and entry.book.language_id != language_uuid:
            continue
        if entry.book.is_published and not entry.book.is_deleted:
            book_author_ids = await db.execute(
                select(book_authors.c.author_id).where(book_authors.c.book_id == entry.book.id)
            )
            entry.book.author_ids_list = [row[0] for row in book_author_ids.fetchall()]

            book_artist_ids = await db.execute(
                select(book_artists.c.artist_id).where(book_artists.c.book_id == entry.book.id)
            )
            entry.book.artist_ids_list = [row[0] for row in book_artist_ids.fetchall()]

            book_genre_ids = await db.execute(
                select(book_genres.c.genre_id).where(book_genres.c.book_id == entry.book.id)
            )
            entry.book.genre_ids_list = [row[0] for row in book_genre_ids.fetchall()]

            promoted_books.append(book_to_mobile_response(entry.book, all_authors, all_artists))

    if promoted_books:
        return promoted_books[offset:offset + limit]

    # Fallback: Get published books in this genre
    query = (
        select(Book)
        .options(selectinload(Book.chapters))
        .join(book_genres, Book.id == book_genres.c.book_id)
        .where(
            book_genres.c.genre_id == genre_uuid,
            Book.is_published == True,
            Book.is_deleted == False,
        )
    )

    if language_uuid:
        query = query.where(Book.language_id == language_uuid)

    query = query.order_by(Book.created_at.desc()).offset(offset).limit(limit)

    fallback_result = await db.execute(query)
    fallback_books = fallback_result.scalars().all()

    books = []
    for book in fallback_books:
        book_author_ids = await db.execute(
            select(book_authors.c.author_id).where(book_authors.c.book_id == book.id)
        )
        book.author_ids_list = [row[0] for row in book_author_ids.fetchall()]

        book_artist_ids = await db.execute(
            select(book_artists.c.artist_id).where(book_artists.c.book_id == book.id)
        )
        book.artist_ids_list = [row[0] for row in book_artist_ids.fetchall()]

        book_genre_ids = await db.execute(
            select(book_genres.c.genre_id).where(book_genres.c.book_id == book.id)
        )
        book.genre_ids_list = [row[0] for row in book_genre_ids.fetchall()]

        books.append(book_to_mobile_response(book, all_authors, all_artists))

    return books


@router.get("/mobile/because-you-listened/{book_id}")
async def get_because_you_listened(
    book_id: str,
    exclude_book_ids: Optional[str] = Query(None, description="Comma-separated book IDs to exclude"),
    language_id: Optional[str] = Query(None, description="Filter by language ID"),
    limit: int = Query(20, ge=1, le=100, description="Number of results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get book recommendations based on a completed book's genres.
    Returns books that share the same genres as the specified book,
    sorted by created_at DESC (latest first).
    """
    from sqlalchemy.orm import selectinload
    from models import Author, Artist
    from models.book import book_authors, book_artists, book_genres

    # Validate book_id
    try:
        source_book_uuid = UUID(book_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid book ID")

    # Get the source book to find its genres
    source_book = await db.get(Book, source_book_uuid)
    if not source_book or source_book.is_deleted:
        raise HTTPException(status_code=404, detail="Book not found")

    # Get the source book's genre IDs
    source_genre_result = await db.execute(
        select(book_genres.c.genre_id).where(book_genres.c.book_id == source_book_uuid)
    )
    source_genre_ids = [row[0] for row in source_genre_result.fetchall()]

    if not source_genre_ids:
        return []

    # Parse exclude_book_ids
    exclude_uuids = [source_book_uuid]  # Always exclude the source book
    if exclude_book_ids:
        for id_str in exclude_book_ids.split(','):
            id_str = id_str.strip()
            if id_str:
                try:
                    exclude_uuids.append(UUID(id_str))
                except ValueError:
                    pass  # Skip invalid UUIDs

    # Parse language_id
    language_uuid = None
    if language_id:
        try:
            language_uuid = UUID(language_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid language ID")

    # Get all authors and artists for mapping
    authors_result = await db.execute(select(Author))
    all_authors = authors_result.scalars().all()
    artists_result = await db.execute(select(Artist))
    all_artists = artists_result.scalars().all()

    # Find books that have ALL the same genres as the source book
    # First, get all books that have at least one matching genre
    from sqlalchemy import func

    # Subquery to count how many of the source genres each book has
    genre_count_subq = (
        select(
            book_genres.c.book_id,
            func.count(book_genres.c.genre_id).label('genre_count')
        )
        .where(book_genres.c.genre_id.in_(source_genre_ids))
        .group_by(book_genres.c.book_id)
        .subquery()
    )

    # Build main query - find books with matching genre count
    query = (
        select(Book)
        .options(selectinload(Book.chapters))
        .join(genre_count_subq, Book.id == genre_count_subq.c.book_id)
        .where(
            Book.is_published == True,
            Book.is_deleted == False,
            Book.id.notin_(exclude_uuids),
            genre_count_subq.c.genre_count == len(source_genre_ids),
        )
    )

    if language_uuid:
        query = query.where(Book.language_id == language_uuid)

    query = query.order_by(Book.created_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    books_list = result.unique().scalars().all()

    # Build response
    response_books = []
    for book in books_list:
        # Verify the book has EXACTLY the same genres (not more, not less)
        book_genre_result = await db.execute(
            select(book_genres.c.genre_id).where(book_genres.c.book_id == book.id)
        )
        book_genre_ids = set(row[0] for row in book_genre_result.fetchall())

        # Only include if genres match exactly
        if book_genre_ids == set(source_genre_ids):
            book_author_ids = await db.execute(
                select(book_authors.c.author_id).where(book_authors.c.book_id == book.id)
            )
            book.author_ids_list = [row[0] for row in book_author_ids.fetchall()]

            book_artist_ids = await db.execute(
                select(book_artists.c.artist_id).where(book_artists.c.book_id == book.id)
            )
            book.artist_ids_list = [row[0] for row in book_artist_ids.fetchall()]

            book.genre_ids_list = list(book_genre_ids)

            response_books.append(book_to_mobile_response(book, all_authors, all_artists))

    return response_books


@router.get("/mobile/explore")
async def explore_books(
    search: Optional[str] = Query(None, description="Search by title"),
    genre_ids: Optional[str] = Query(None, description="Filter by genre IDs (comma-separated)"),
    language_ids: Optional[str] = Query(None, description="Filter by language IDs (comma-separated)"),
    author_ids: Optional[str] = Query(None, description="Filter by author IDs (comma-separated)"),
    artist_ids: Optional[str] = Query(None, description="Filter by artist IDs (comma-separated)"),
    publisher_ids: Optional[str] = Query(None, description="Filter by publisher IDs (comma-separated)"),
    limit: int = Query(20, ge=1, le=100, description="Number of results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    db: AsyncSession = Depends(get_db),
):
    """
    Explore all published books with optional filters.
    Supports multiple IDs per filter (comma-separated).
    Returns books sorted by created_at DESC (latest first).
    """
    from sqlalchemy.orm import selectinload
    from models import Author, Artist
    from models.book import book_authors, book_artists, book_genres

    # Helper to parse comma-separated UUIDs
    def parse_uuids(ids_str: str) -> list[UUID]:
        uuids = []
        for id_str in ids_str.split(','):
            id_str = id_str.strip()
            if id_str:
                try:
                    uuids.append(UUID(id_str))
                except ValueError:
                    pass  # Skip invalid UUIDs
        return uuids

    # Build base query
    query = (
        select(Book)
        .options(selectinload(Book.chapters))
        .where(
            Book.is_published == True,
            Book.is_deleted == False,
        )
    )

    # Apply search filter
    if search:
        search_pattern = f"%{search}%"
        query = query.where(Book.title.ilike(search_pattern))

    # Apply language filter (multiple)
    if language_ids:
        lang_uuids = parse_uuids(language_ids)
        if lang_uuids:
            query = query.where(Book.language_id.in_(lang_uuids))

    # Apply publisher filter (multiple)
    if publisher_ids:
        pub_uuids = parse_uuids(publisher_ids)
        if pub_uuids:
            query = query.where(Book.publisher_id.in_(pub_uuids))

    # Apply genre filter (multiple)
    if genre_ids:
        genre_uuids = parse_uuids(genre_ids)
        if genre_uuids:
            query = query.join(book_genres, Book.id == book_genres.c.book_id).where(
                book_genres.c.genre_id.in_(genre_uuids)
            )

    # Apply author filter (multiple)
    if author_ids:
        author_uuids = parse_uuids(author_ids)
        if author_uuids:
            query = query.join(book_authors, Book.id == book_authors.c.book_id).where(
                book_authors.c.author_id.in_(author_uuids)
            )

    # Apply artist filter (multiple)
    if artist_ids:
        artist_uuids = parse_uuids(artist_ids)
        if artist_uuids:
            query = query.join(book_artists, Book.id == book_artists.c.book_id).where(
                book_artists.c.artist_id.in_(artist_uuids)
            )

    # Order by latest first and apply pagination
    query = query.order_by(Book.created_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    books_list = result.unique().scalars().all()

    # Get all authors and artists for mapping
    authors_result = await db.execute(select(Author))
    all_authors = authors_result.scalars().all()
    artists_result = await db.execute(select(Artist))
    all_artists = artists_result.scalars().all()

    # Build response
    response_books = []
    for book in books_list:
        # Get book's author and artist IDs
        book_author_ids = await db.execute(
            select(book_authors.c.author_id).where(book_authors.c.book_id == book.id)
        )
        book.author_ids_list = [row[0] for row in book_author_ids.fetchall()]

        book_artist_ids = await db.execute(
            select(book_artists.c.artist_id).where(book_artists.c.book_id == book.id)
        )
        book.artist_ids_list = [row[0] for row in book_artist_ids.fetchall()]

        book_genre_ids = await db.execute(
            select(book_genres.c.genre_id).where(book_genres.c.book_id == book.id)
        )
        book.genre_ids_list = [row[0] for row in book_genre_ids.fetchall()]

        response_books.append(book_to_mobile_response(book, all_authors, all_artists))

    return response_books


@router.get("/mobile/book/{book_id}")
async def get_book_mobile(book_id: str, db: AsyncSession = Depends(get_db)):
    """
    Get a single book by ID with full details for mobile app.
    Returns the same format as other mobile endpoints.
    """
    from sqlalchemy.orm import selectinload
    from models import Author, Artist
    from models.book import book_authors, book_artists, book_genres

    try:
        book_uuid = UUID(book_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid book ID")

    # Get the book with chapters
    result = await db.execute(
        select(Book)
        .options(selectinload(Book.chapters))
        .where(
            Book.id == book_uuid,
            Book.is_published == True,
            Book.is_deleted == False,
        )
    )
    book = result.scalar_one_or_none()

    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    # Get all authors and artists for mapping
    authors_result = await db.execute(select(Author))
    all_authors = authors_result.scalars().all()
    artists_result = await db.execute(select(Artist))
    all_artists = artists_result.scalars().all()

    # Get book's author, artist, and genre IDs
    book_author_ids = await db.execute(
        select(book_authors.c.author_id).where(book_authors.c.book_id == book.id)
    )
    book.author_ids_list = [row[0] for row in book_author_ids.fetchall()]

    book_artist_ids = await db.execute(
        select(book_artists.c.artist_id).where(book_artists.c.book_id == book.id)
    )
    book.artist_ids_list = [row[0] for row in book_artist_ids.fetchall()]

    book_genre_ids = await db.execute(
        select(book_genres.c.genre_id).where(book_genres.c.book_id == book.id)
    )
    book.genre_ids_list = [row[0] for row in book_genre_ids.fetchall()]

    return book_to_mobile_response(book, all_authors, all_artists)
