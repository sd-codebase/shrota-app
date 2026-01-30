"""
Mobile API endpoints with optimized queries.
All endpoints require authentication and use user preferences from the database.
"""
from uuid import UUID
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload, joinedload

from database import get_db
from models.user import User
from models.book import Book, Chapter, book_authors, book_artists, book_genres
from models.author import Author
from models.artist import Artist
from models.genre import Genre
from models.language import Language
from models.content_promotion import NewRelease, FeaturedBook, PromotedBook
from models.user_preferences import UserPreferences
from routes.user_auth import get_current_user
from utils.age import is_adult as user_is_adult

router = APIRouter(prefix="/v1/mobile", tags=["Mobile API"])


def book_to_response(book: Book) -> dict:
    """Convert Book model to mobile response dict with all eager-loaded relationships."""
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
        for ch in sorted(book.chapters, key=lambda c: c.order)
        if not ch.is_deleted
    ]

    return {
        "id": str(book.id),
        "title": book.title,
        "information": book.information,
        "thumbnail": book.thumbnail,
        "total_duration": book.total_duration,
        "is_published": book.is_published,
        "genre_ids": [str(g.id) for g in book.genres],
        "genre_names": [g.name for g in book.genres],
        "author_ids": [str(a.id) for a in book.authors],
        "author_names": [a.name for a in book.authors],
        "artist_ids": [str(a.id) for a in book.artists],
        "artist_names": [a.name for a in book.artists],
        "publisher_id": str(book.publisher_id) if book.publisher_id else None,
        "publisher_name": book.publisher.name if book.publisher else None,
        "language_id": str(book.language_id) if book.language_id else None,
        "language_name": book.language.name if book.language else None,
        "chapters": chapters,
    }


def get_book_query_options():
    """Return common selectinload options for Book queries."""
    return [
        selectinload(Book.chapters),
        selectinload(Book.authors),
        selectinload(Book.artists),
        selectinload(Book.genres),
        joinedload(Book.language),
        joinedload(Book.publisher),
    ]


async def get_user_preferences(user: User, db: AsyncSession) -> Optional[UserPreferences]:
    """Get user's preferences with languages and genres loaded."""
    result = await db.execute(
        select(UserPreferences)
        .options(
            selectinload(UserPreferences.languages),
            selectinload(UserPreferences.genres)
        )
        .where(UserPreferences.user_id == user.id)
    )
    return result.scalar_one_or_none()


def is_user_adult(user: User) -> bool:
    """Check if user is 18+ based on birth date."""
    return user.birth_date is not None and user_is_adult(user.birth_date)


@router.get("/new-releases")
async def get_new_releases(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get new releases for user's preferred languages.
    Returns promoted new releases first, then falls back to latest published books.
    Adult content is filtered for users under 18.
    """
    is_adult = is_user_adult(current_user)
    preferences = await get_user_preferences(current_user, db)

    if not preferences or not preferences.languages:
        return []

    language_ids = [lang.id for lang in preferences.languages]

    # Get promoted new releases for user's languages
    result = await db.execute(
        select(NewRelease)
        .options(
            joinedload(NewRelease.book).options(*get_book_query_options())
        )
        .where(
            NewRelease.language_id.in_(language_ids),
            NewRelease.is_active == True,
        )
        .order_by(NewRelease.display_order)
    )
    entries = result.unique().scalars().all()

    books = []
    seen_book_ids = set()

    for entry in entries:
        book = entry.book
        if book.id in seen_book_ids:
            continue
        if not is_adult and book.is_adult:
            continue
        if book.is_published and not book.is_deleted:
            books.append(book_to_response(book))
            seen_book_ids.add(book.id)

    if books:
        return books

    # Fallback: Get latest published books in user's languages
    fallback_query = (
        select(Book)
        .options(*get_book_query_options())
        .where(
            Book.language_id.in_(language_ids),
            Book.is_published == True,
            Book.is_deleted == False,
        )
    )
    if not is_adult:
        fallback_query = fallback_query.where(Book.is_adult == False)

    fallback_query = fallback_query.order_by(Book.created_at.desc()).limit(10)
    fallback_result = await db.execute(fallback_query)
    fallback_books = fallback_result.unique().scalars().all()

    return [book_to_response(book) for book in fallback_books]


@router.get("/featured")
async def get_featured_books(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get featured books for user's preferred languages.
    Returns promoted featured books first, then falls back to popular books.
    Adult content is filtered for users under 18.
    """
    is_adult = is_user_adult(current_user)
    preferences = await get_user_preferences(current_user, db)

    if not preferences or not preferences.languages:
        return []

    language_ids = [lang.id for lang in preferences.languages]

    # Get promoted featured books for user's languages
    result = await db.execute(
        select(FeaturedBook)
        .options(
            joinedload(FeaturedBook.book).options(*get_book_query_options())
        )
        .where(
            FeaturedBook.language_id.in_(language_ids),
            FeaturedBook.is_active == True,
        )
        .order_by(FeaturedBook.display_order)
    )
    entries = result.unique().scalars().all()

    books = []
    seen_book_ids = set()

    for entry in entries:
        book = entry.book
        if book.id in seen_book_ids:
            continue
        if not is_adult and book.is_adult:
            continue
        if book.is_published and not book.is_deleted:
            books.append(book_to_response(book))
            seen_book_ids.add(book.id)

    if books:
        return books

    # Fallback: Get popular books in user's languages
    fallback_query = (
        select(Book)
        .options(*get_book_query_options())
        .where(
            Book.language_id.in_(language_ids),
            Book.is_published == True,
            Book.is_deleted == False,
        )
    )
    if not is_adult:
        fallback_query = fallback_query.where(Book.is_adult == False)

    fallback_query = fallback_query.order_by(Book.updated_at.desc()).limit(10)
    fallback_result = await db.execute(fallback_query)
    fallback_books = fallback_result.unique().scalars().all()

    return [book_to_response(book) for book in fallback_books]


@router.get("/genre/{genre_id}")
async def get_books_by_genre(
    genre_id: str,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get books for a specific genre filtered by user's preferred languages.
    Tries promoted books first, then falls back to regular books.
    Adult content is filtered for users under 18.
    """
    is_adult = is_user_adult(current_user)
    preferences = await get_user_preferences(current_user, db)

    try:
        genre_uuid = UUID(genre_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid genre ID")

    # Get user's language IDs (or None for all languages)
    language_ids = None
    if preferences and preferences.languages:
        language_ids = [lang.id for lang in preferences.languages]

    # Try promoted books first
    promo_result = await db.execute(
        select(PromotedBook)
        .options(
            joinedload(PromotedBook.book).options(*get_book_query_options())
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
        book = entry.book
        if language_ids and book.language_id not in language_ids:
            continue
        if not is_adult and book.is_adult:
            continue
        if book.is_published and not book.is_deleted:
            promoted_books.append(book_to_response(book))

    if promoted_books:
        return promoted_books[offset:offset + limit]

    # Fallback: Get books by genre
    query = (
        select(Book)
        .options(*get_book_query_options())
        .join(book_genres, Book.id == book_genres.c.book_id)
        .where(
            book_genres.c.genre_id == genre_uuid,
            Book.is_published == True,
            Book.is_deleted == False,
        )
    )

    if not is_adult:
        query = query.where(Book.is_adult == False)

    if language_ids:
        query = query.where(Book.language_id.in_(language_ids))

    query = query.order_by(Book.created_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    books = result.unique().scalars().all()

    return [book_to_response(book) for book in books]


@router.get("/explore")
async def explore_books(
    search: Optional[str] = Query(None, description="Search by title"),
    genre_ids: Optional[str] = Query(None, description="Filter by genre IDs (comma-separated)"),
    language_ids: Optional[str] = Query(None, description="Filter by language IDs (comma-separated)"),
    author_ids: Optional[str] = Query(None, description="Filter by author IDs (comma-separated)"),
    artist_ids: Optional[str] = Query(None, description="Filter by artist IDs (comma-separated)"),
    publisher_ids: Optional[str] = Query(None, description="Filter by publisher IDs (comma-separated)"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Explore books with filters. If no language filter is provided,
    uses user's preferred languages from database.
    Adult content is filtered for users under 18.
    """
    is_adult = is_user_adult(current_user)

    def parse_uuids(ids_str: str) -> List[UUID]:
        uuids = []
        for id_str in ids_str.split(','):
            id_str = id_str.strip()
            if id_str:
                try:
                    uuids.append(UUID(id_str))
                except ValueError:
                    pass
        return uuids

    query = (
        select(Book)
        .options(*get_book_query_options())
        .where(
            Book.is_published == True,
            Book.is_deleted == False,
        )
    )

    if not is_adult:
        query = query.where(Book.is_adult == False)

    if search:
        query = query.where(Book.title.ilike(f"%{search}%"))

    # Use provided language_ids or fall back to user's preferences
    if language_ids:
        lang_uuids = parse_uuids(language_ids)
        if lang_uuids:
            query = query.where(Book.language_id.in_(lang_uuids))
    else:
        # Use user's preferred languages if no explicit filter
        preferences = await get_user_preferences(current_user, db)
        if preferences and preferences.languages:
            pref_lang_ids = [lang.id for lang in preferences.languages]
            query = query.where(Book.language_id.in_(pref_lang_ids))

    if publisher_ids:
        pub_uuids = parse_uuids(publisher_ids)
        if pub_uuids:
            query = query.where(Book.publisher_id.in_(pub_uuids))

    if genre_ids:
        genre_uuids = parse_uuids(genre_ids)
        if genre_uuids:
            query = query.join(book_genres, Book.id == book_genres.c.book_id).where(
                book_genres.c.genre_id.in_(genre_uuids)
            )

    if author_ids:
        author_uuids = parse_uuids(author_ids)
        if author_uuids:
            query = query.join(book_authors, Book.id == book_authors.c.book_id).where(
                book_authors.c.author_id.in_(author_uuids)
            )

    if artist_ids:
        artist_uuids = parse_uuids(artist_ids)
        if artist_uuids:
            query = query.join(book_artists, Book.id == book_artists.c.book_id).where(
                book_artists.c.artist_id.in_(artist_uuids)
            )

    query = query.order_by(Book.created_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    books = result.unique().scalars().all()

    return [book_to_response(book) for book in books]


@router.get("/book/{book_id}")
async def get_book(
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a single book by ID with full details.
    Adult content is restricted to users 18+.
    """
    is_adult = is_user_adult(current_user)

    try:
        book_uuid = UUID(book_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid book ID")

    result = await db.execute(
        select(Book)
        .options(*get_book_query_options())
        .where(
            Book.id == book_uuid,
            Book.is_published == True,
            Book.is_deleted == False,
        )
    )
    book = result.unique().scalar_one_or_none()

    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    if book.is_adult and not is_adult:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This content is restricted to users 18 years or older"
        )

    return book_to_response(book)


@router.get("/because-you-listened/{book_id}")
async def get_because_you_listened(
    book_id: str,
    exclude_book_ids: Optional[str] = Query(None, description="Comma-separated book IDs to exclude"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get book recommendations based on a book's genres.
    Uses user's preferred languages from database.
    Adult content is filtered for users under 18.
    """
    is_adult = is_user_adult(current_user)
    preferences = await get_user_preferences(current_user, db)

    try:
        source_book_uuid = UUID(book_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid book ID")

    # Get source book's genres
    source_book = await db.get(Book, source_book_uuid)
    if not source_book or source_book.is_deleted:
        raise HTTPException(status_code=404, detail="Book not found")

    source_genre_result = await db.execute(
        select(book_genres.c.genre_id).where(book_genres.c.book_id == source_book_uuid)
    )
    source_genre_ids = [row[0] for row in source_genre_result.fetchall()]

    if not source_genre_ids:
        return []

    # Parse exclude IDs
    exclude_uuids = [source_book_uuid]
    if exclude_book_ids:
        for id_str in exclude_book_ids.split(','):
            id_str = id_str.strip()
            if id_str:
                try:
                    exclude_uuids.append(UUID(id_str))
                except ValueError:
                    pass

    # Get user's language IDs
    language_ids = None
    if preferences and preferences.languages:
        language_ids = [lang.id for lang in preferences.languages]

    # Find books with matching genres
    genre_count_subq = (
        select(
            book_genres.c.book_id,
            func.count(book_genres.c.genre_id).label('genre_count')
        )
        .where(book_genres.c.genre_id.in_(source_genre_ids))
        .group_by(book_genres.c.book_id)
        .subquery()
    )

    query = (
        select(Book)
        .options(*get_book_query_options())
        .join(genre_count_subq, Book.id == genre_count_subq.c.book_id)
        .where(
            Book.is_published == True,
            Book.is_deleted == False,
            Book.id.notin_(exclude_uuids),
            genre_count_subq.c.genre_count >= 1,  # At least one matching genre
        )
    )

    if not is_adult:
        query = query.where(Book.is_adult == False)

    if language_ids:
        query = query.where(Book.language_id.in_(language_ids))

    query = query.order_by(
        genre_count_subq.c.genre_count.desc(),  # Most matching genres first
        Book.created_at.desc()                   # Then by newest
    ).offset(offset).limit(limit)

    result = await db.execute(query)
    books = result.unique().scalars().all()

    return [book_to_response(book) for book in books]


@router.get("/home")
async def get_home_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get aggregated home screen data in a single call.
    Includes new releases, featured books, and user's favorite genre sections.
    """
    is_adult = is_user_adult(current_user)
    preferences = await get_user_preferences(current_user, db)

    if not preferences or not preferences.languages:
        return {
            "new_releases": [],
            "featured": [],
            "genre_sections": [],
        }

    language_ids = [lang.id for lang in preferences.languages]

    # Fetch new releases
    new_releases_result = await db.execute(
        select(NewRelease)
        .options(
            joinedload(NewRelease.book).options(*get_book_query_options())
        )
        .where(
            NewRelease.language_id.in_(language_ids),
            NewRelease.is_active == True,
        )
        .order_by(NewRelease.display_order)
        .limit(10)
    )
    new_releases_entries = new_releases_result.unique().scalars().all()

    new_releases = []
    seen_ids = set()
    for entry in new_releases_entries:
        book = entry.book
        if book.id in seen_ids:
            continue
        if not is_adult and book.is_adult:
            continue
        if book.is_published and not book.is_deleted:
            new_releases.append(book_to_response(book))
            seen_ids.add(book.id)

    # Fetch featured books
    featured_result = await db.execute(
        select(FeaturedBook)
        .options(
            joinedload(FeaturedBook.book).options(*get_book_query_options())
        )
        .where(
            FeaturedBook.language_id.in_(language_ids),
            FeaturedBook.is_active == True,
        )
        .order_by(FeaturedBook.display_order)
        .limit(10)
    )
    featured_entries = featured_result.unique().scalars().all()

    featured = []
    seen_ids = set()
    for entry in featured_entries:
        book = entry.book
        if book.id in seen_ids:
            continue
        if not is_adult and book.is_adult:
            continue
        if book.is_published and not book.is_deleted:
            featured.append(book_to_response(book))
            seen_ids.add(book.id)

    # Fetch genre sections (first 3 preferred genres)
    genre_sections = []
    if preferences.genres:
        for genre in preferences.genres[:3]:
            genre_books_query = (
                select(Book)
                .options(*get_book_query_options())
                .join(book_genres, Book.id == book_genres.c.book_id)
                .where(
                    book_genres.c.genre_id == genre.id,
                    Book.language_id.in_(language_ids),
                    Book.is_published == True,
                    Book.is_deleted == False,
                )
            )
            if not is_adult:
                genre_books_query = genre_books_query.where(Book.is_adult == False)

            genre_books_query = genre_books_query.order_by(Book.created_at.desc()).limit(10)

            genre_result = await db.execute(genre_books_query)
            genre_books = genre_result.unique().scalars().all()

            if genre_books:
                genre_sections.append({
                    "genre": {
                        "id": str(genre.id),
                        "name": genre.name,
                        "thumbnail": genre.thumbnail,
                    },
                    "books": [book_to_response(book) for book in genre_books]
                })

    return {
        "new_releases": new_releases,
        "featured": featured,
        "genre_sections": genre_sections,
    }
