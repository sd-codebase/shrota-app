from typing import Optional
from fastapi import APIRouter, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from database import get_db
from models import Book, Author, Artist, Publication
from models.user import User
from utils.age import is_adult as user_is_adult
from routes.user_auth import get_optional_current_user


router = APIRouter(prefix="/v1/search", tags=["Search"])


MAX_RESULTS_PER_CATEGORY = 5


def book_to_search_response(book: Book) -> dict:
    """Convert Book model to search response dict with author/artist/publisher names."""
    # Filter out deleted chapters
    chapters = [
        {
            "id": str(ch.id),
            "title": ch.title,
            "description": ch.description,
            "order": ch.order,
            "file_id": ch.file_id,
            "audio_url": ch.audio_url,
            "duration": ch.duration,
            "file_size": ch.file_size,
            "is_published": ch.is_published,
            "is_deleted": ch.is_deleted,
            "image": ch.image,
        }
        for ch in book.chapters
        if not ch.is_deleted
    ]

    return {
        "id": str(book.id),
        "title": book.title,
        "genre_ids": [str(g.id) for g in book.genres],
        "information": book.information,
        "author_ids": [str(a.id) for a in book.authors],
        "author_names": [a.name for a in book.authors],
        "artist_ids": [str(a.id) for a in book.artists],
        "artist_names": [a.name for a in book.artists],
        "publisher_id": str(book.publisher_id) if book.publisher_id else None,
        "publisher_name": book.publisher.name if book.publisher else None,
        "language_id": str(book.language_id) if book.language_id else None,
        "thumbnail": book.thumbnail,
        "total_duration": book.total_duration,
        "is_published": book.is_published,
        "is_adult": book.is_adult,
        "is_deleted": book.is_deleted,
        "chapters": chapters,
        "created_at": book.created_at,
        "updated_at": book.updated_at,
    }


def author_to_response(author: Author) -> dict:
    """Convert Author model to response dict."""
    return {
        "id": str(author.id),
        "name": author.name,
        "bio": author.bio,
        "photo": author.photo,
        "book_count": len([b for b in author.books if b.is_published and not b.is_deleted]),
    }


def artist_to_response(artist: Artist) -> dict:
    """Convert Artist model to response dict."""
    return {
        "id": str(artist.id),
        "name": artist.name,
        "bio": artist.bio,
        "photo": artist.photo,
        "book_count": len([b for b in artist.books if b.is_published and not b.is_deleted]),
    }


def publication_to_response(publication: Publication) -> dict:
    """Convert Publication model to response dict."""
    return {
        "id": str(publication.id),
        "name": publication.name,
        "description": publication.description,
        "photo": publication.photo,
        "book_count": len([b for b in publication.books if b.is_published and not b.is_deleted]),
    }


@router.get("")
async def search_all(
    q: str = Query(..., min_length=3, description="Search query (minimum 3 characters)"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Search across books, authors (writers), artists (narrators), and publications.

    Returns up to 5 results per category with partial (ILIKE) matching.
    Only returns published, non-deleted items.
    Adult content is filtered for users under 18 or unauthenticated users.
    """
    # Check if user is adult (18+)
    is_adult = current_user and current_user.birth_date and user_is_adult(current_user.birth_date)

    search_pattern = f"%{q}%"

    # Search books by title
    books_query = (
        select(Book)
        .options(
            selectinload(Book.authors),
            selectinload(Book.artists),
            selectinload(Book.genres),
            selectinload(Book.chapters),
            selectinload(Book.publisher),
        )
        .where(Book.is_published == True)
        .where(Book.is_deleted == False)
        .where(Book.title.ilike(search_pattern))
    )

    # Filter out adult content for non-adult users
    if not is_adult:
        books_query = books_query.where(Book.is_adult == False)

    books_query = books_query.order_by(Book.updated_at.desc()).limit(MAX_RESULTS_PER_CATEGORY)
    books_result = await db.execute(books_query)
    books = books_result.scalars().all()

    # Filter to only include books with at least one published chapter
    filtered_books = [
        book for book in books
        if any(ch.is_published and not ch.is_deleted for ch in book.chapters)
    ]

    # Search authors (writers) by name
    authors_query = (
        select(Author)
        .options(selectinload(Author.books))
        .where(Author.is_deleted == False)
        .where(Author.name.ilike(search_pattern))
        .order_by(Author.name)
        .limit(MAX_RESULTS_PER_CATEGORY)
    )
    authors_result = await db.execute(authors_query)
    authors = authors_result.scalars().all()

    # Filter authors who have at least one published book
    filtered_authors = [
        a for a in authors
        if any(b.is_published and not b.is_deleted for b in a.books)
    ]

    # Search artists (narrators) by name
    artists_query = (
        select(Artist)
        .options(selectinload(Artist.books))
        .where(Artist.is_deleted == False)
        .where(Artist.name.ilike(search_pattern))
        .order_by(Artist.name)
        .limit(MAX_RESULTS_PER_CATEGORY)
    )
    artists_result = await db.execute(artists_query)
    artists = artists_result.scalars().all()

    # Filter artists who have at least one published book
    filtered_artists = [
        a for a in artists
        if any(b.is_published and not b.is_deleted for b in a.books)
    ]

    # Search publications by name
    publications_query = (
        select(Publication)
        .options(selectinload(Publication.books))
        .where(Publication.is_deleted == False)
        .where(Publication.name.ilike(search_pattern))
        .order_by(Publication.name)
        .limit(MAX_RESULTS_PER_CATEGORY)
    )
    publications_result = await db.execute(publications_query)
    publications = publications_result.scalars().all()

    # Filter publications that have at least one published book
    filtered_publications = [
        p for p in publications
        if any(b.is_published and not b.is_deleted for b in p.books)
    ]

    return {
        "query": q,
        "books": {
            "count": len(filtered_books),
            "results": [book_to_search_response(book) for book in filtered_books],
        },
        "writers": {
            "count": len(filtered_authors),
            "results": [author_to_response(a) for a in filtered_authors],
        },
        "narrators": {
            "count": len(filtered_artists),
            "results": [artist_to_response(a) for a in filtered_artists],
        },
        "publications": {
            "count": len(filtered_publications),
            "results": [publication_to_response(p) for p in filtered_publications],
        },
    }
