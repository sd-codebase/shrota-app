import os
import re
import asyncio
from datetime import datetime, timezone
from uuid import UUID
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from database import get_db
from config import UPLOAD_DIR, AUDIO_LIBRARY_DIR
from models import Book, Chapter, Genre, Author, Artist, Language, Publication
from models.user import User
from models.book import book_authors, book_artists, book_genres
from schemas.book import (
    BookCreate,
    BookUpdate,
    BookResponse,
    ChapterCreate,
    ChapterUpdate,
    ChapterResponse,
)
from utils.hls_converter import convert_to_hls, HLSConversionError
from utils.age import is_adult as user_is_adult
from routes.user_auth import get_optional_current_user

router = APIRouter(prefix="/books", tags=["Books"])


def chapter_to_response(chapter: Chapter) -> dict:
    """Convert Chapter model to response dict."""
    return {
        "id": str(chapter.id),
        "title": chapter.title,
        "description": chapter.description,
        "order": chapter.order,
        "file_id": chapter.file_id,
        "audio_url": chapter.audio_url,
        "duration": chapter.duration,
        "file_size": chapter.file_size,
        "is_published": chapter.is_published,
        "is_deleted": chapter.is_deleted,
        "image": chapter.image,
    }


def book_to_response(book: Book) -> dict:
    """Convert Book model to response dict."""
    # Filter out deleted chapters and convert to response format
    chapters = [
        chapter_to_response(ch) for ch in book.chapters
        if not ch.is_deleted
    ]

    return {
        "id": str(book.id),
        "title": book.title,
        "genre_ids": [str(g.id) for g in book.genres],
        "information": book.information,
        "author_ids": [str(a.id) for a in book.authors],
        "artist_ids": [str(a.id) for a in book.artists],
        "publisher_id": str(book.publisher_id) if book.publisher_id else None,
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


async def recalculate_book_duration(db: AsyncSession, book_id: UUID):
    """Recalculate total_duration from all non-deleted chapter durations."""
    result = await db.execute(
        select(func.sum(Chapter.duration))
        .where(Chapter.book_id == book_id)
        .where(Chapter.is_deleted == False)
    )
    total_duration = result.scalar() or 0

    book = await db.get(Book, book_id)
    if book:
        book.total_duration = total_duration
        book.updated_at = datetime.now(timezone.utc)
        await db.commit()


async def get_book_with_relations(db: AsyncSession, book_id: UUID) -> Optional[Book]:
    """Get a book with all its relationships eagerly loaded."""
    result = await db.execute(
        select(Book)
        .options(
            selectinload(Book.authors),
            selectinload(Book.artists),
            selectinload(Book.genres),
            selectinload(Book.chapters),
        )
        .where(Book.id == book_id)
    )
    return result.scalar_one_or_none()


@router.get("", response_model=list[BookResponse])
async def get_books(
    search: Optional[str] = Query(None, description="Search books by title"),
    db: AsyncSession = Depends(get_db)
):
    """Get all non-deleted books, sorted by updated_at DESC (latest first)."""
    query = (
        select(Book)
        .options(
            selectinload(Book.authors),
            selectinload(Book.artists),
            selectinload(Book.genres),
            selectinload(Book.chapters),
        )
        .where(Book.is_deleted == False)
        .order_by(Book.updated_at.desc())
    )

    if search:
        query = query.where(Book.title.ilike(f"%{search}%"))

    result = await db.execute(query)
    books = result.scalars().all()
    return [book_to_response(book) for book in books]


@router.get("/published", response_model=list[BookResponse])
async def get_published_books(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Get only published non-deleted books, sorted by updated_at DESC (for mobile app)."""
    # Check if user is adult (18+)
    is_adult = current_user and current_user.birth_date and user_is_adult(current_user.birth_date)

    query = (
        select(Book)
        .options(
            selectinload(Book.authors),
            selectinload(Book.artists),
            selectinload(Book.genres),
            selectinload(Book.chapters),
        )
        .where(Book.is_published == True)
        .where(Book.is_deleted == False)
    )

    # Filter out adult content for non-adult users
    if not is_adult:
        query = query.where(Book.is_adult == False)

    query = query.order_by(Book.updated_at.desc())
    result = await db.execute(query)
    books = result.scalars().all()
    return [book_to_response(book) for book in books]


@router.get("/{book_id}", response_model=BookResponse)
async def get_book(
    book_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    try:
        uuid_id = UUID(book_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid book ID")

    book = await get_book_with_relations(db, uuid_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    # Check if adult content restriction applies
    if book.is_adult:
        is_adult = current_user and current_user.birth_date and user_is_adult(current_user.birth_date)
        if not is_adult:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This content is restricted to users 18 years or older"
            )

    return book_to_response(book)


@router.post("", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
async def create_book(book: BookCreate, db: AsyncSession = Depends(get_db)):
    # Validate all genres exist
    genres = []
    for genre_id in book.genre_ids:
        try:
            uuid_id = UUID(genre_id)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid genre ID: {genre_id}")
        genre = await db.get(Genre, uuid_id)
        if not genre:
            raise HTTPException(status_code=404, detail=f"Genre not found: {genre_id}")
        genres.append(genre)

    # Validate all authors exist
    authors = []
    for author_id in book.author_ids:
        try:
            uuid_id = UUID(author_id)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid author ID: {author_id}")
        author = await db.get(Author, uuid_id)
        if not author:
            raise HTTPException(status_code=404, detail=f"Author not found: {author_id}")
        authors.append(author)

    # Validate all artists exist
    artists = []
    for artist_id in book.artist_ids:
        try:
            uuid_id = UUID(artist_id)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid artist ID: {artist_id}")
        artist = await db.get(Artist, uuid_id)
        if not artist:
            raise HTTPException(status_code=404, detail=f"Artist not found: {artist_id}")
        artists.append(artist)

    # Validate language if provided
    language_uuid = None
    if book.language_id:
        try:
            language_uuid = UUID(book.language_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid language ID")
        language = await db.get(Language, language_uuid)
        if not language:
            raise HTTPException(status_code=404, detail="Language not found")

    # Validate publisher if provided
    publisher_uuid = None
    if book.publisher_id:
        try:
            publisher_uuid = UUID(book.publisher_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid publisher ID")
        publisher = await db.get(Publication, publisher_uuid)
        if not publisher:
            raise HTTPException(status_code=404, detail="Publisher not found")

    # Create the book
    new_book = Book(
        title=book.title,
        information=book.information,
        thumbnail=book.thumbnail,
        total_duration=0,
        is_published=False,
        is_adult=book.is_adult,
        publisher_id=publisher_uuid,
        language_id=language_uuid,
    )

    # Add relationships
    new_book.genres = genres
    new_book.authors = authors
    new_book.artists = artists

    db.add(new_book)
    await db.commit()

    # Reload with relationships
    book_with_relations = await get_book_with_relations(db, new_book.id)
    return book_to_response(book_with_relations)


@router.put("/{book_id}", response_model=BookResponse)
async def update_book(book_id: str, book: BookUpdate, db: AsyncSession = Depends(get_db)):
    try:
        uuid_id = UUID(book_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid book ID")

    existing = await get_book_with_relations(db, uuid_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Book not found")

    update_data = book.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Validate and update genres if provided
    if "genre_ids" in update_data:
        genres = []
        for genre_id in update_data["genre_ids"]:
            try:
                gid = UUID(genre_id)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid genre ID: {genre_id}")
            genre = await db.get(Genre, gid)
            if not genre:
                raise HTTPException(status_code=404, detail=f"Genre not found: {genre_id}")
            genres.append(genre)
        existing.genres = genres
        del update_data["genre_ids"]

    # Validate and update authors if provided
    if "author_ids" in update_data:
        authors = []
        for author_id in update_data["author_ids"]:
            try:
                aid = UUID(author_id)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid author ID: {author_id}")
            author = await db.get(Author, aid)
            if not author:
                raise HTTPException(status_code=404, detail=f"Author not found: {author_id}")
            authors.append(author)
        existing.authors = authors
        del update_data["author_ids"]

    # Validate and update artists if provided
    if "artist_ids" in update_data:
        artists = []
        for artist_id in update_data["artist_ids"]:
            try:
                aid = UUID(artist_id)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid artist ID: {artist_id}")
            artist = await db.get(Artist, aid)
            if not artist:
                raise HTTPException(status_code=404, detail=f"Artist not found: {artist_id}")
            artists.append(artist)
        existing.artists = artists
        del update_data["artist_ids"]

    # Validate language if being updated
    if "language_id" in update_data and update_data["language_id"]:
        try:
            lang_id = UUID(update_data["language_id"])
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid language ID")
        language = await db.get(Language, lang_id)
        if not language:
            raise HTTPException(status_code=404, detail="Language not found")
        existing.language_id = lang_id
        del update_data["language_id"]
    elif "language_id" in update_data:
        existing.language_id = None
        del update_data["language_id"]

    # Validate publisher if being updated
    if "publisher_id" in update_data and update_data["publisher_id"]:
        try:
            pub_id = UUID(update_data["publisher_id"])
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid publisher ID")
        publisher = await db.get(Publication, pub_id)
        if not publisher:
            raise HTTPException(status_code=404, detail="Publisher not found")
        existing.publisher_id = pub_id
        del update_data["publisher_id"]
    elif "publisher_id" in update_data:
        existing.publisher_id = None
        del update_data["publisher_id"]

    # Validate book can only be published if it has at least one published chapter
    if update_data.get("is_published") is True:
        published_chapters = [ch for ch in existing.chapters if ch.is_published and not ch.is_deleted]
        if not published_chapters:
            raise HTTPException(
                status_code=400,
                detail="Cannot publish book: at least one chapter must be published first"
            )

    # Update remaining fields
    for key, value in update_data.items():
        setattr(existing, key, value)

    existing.updated_at = datetime.now(timezone.utc)

    await db.commit()

    # Reload with relationships
    book_with_relations = await get_book_with_relations(db, uuid_id)
    return book_to_response(book_with_relations)


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(book_id: str, db: AsyncSession = Depends(get_db)):
    """Soft delete a book by setting is_deleted to true."""
    try:
        uuid_id = UUID(book_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid book ID")

    existing = await db.get(Book, uuid_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Book not found")

    existing.is_deleted = True
    existing.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return None


# Chapter endpoints
@router.post("/{book_id}/chapters", response_model=ChapterResponse, status_code=status.HTTP_201_CREATED)
async def add_chapter(book_id: str, chapter: ChapterCreate, db: AsyncSession = Depends(get_db)):
    try:
        uuid_id = UUID(book_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid book ID")

    book = await db.get(Book, uuid_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    new_chapter = Chapter(
        book_id=uuid_id,
        title=chapter.title,
        description=chapter.description,
        order=chapter.order,
        file_id=chapter.file_id,
        is_published=False,
        image=chapter.image,
    )

    db.add(new_chapter)
    book.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(new_chapter)

    return chapter_to_response(new_chapter)


@router.put("/{book_id}/chapters/{chapter_id}", response_model=ChapterResponse)
async def update_chapter(
    book_id: str,
    chapter_id: str,
    chapter: ChapterUpdate,
    db: AsyncSession = Depends(get_db)
):
    try:
        book_uuid = UUID(book_id)
        chapter_uuid = UUID(chapter_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    book = await get_book_with_relations(db, book_uuid)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    # Find the chapter
    existing_chapter = await db.get(Chapter, chapter_uuid)
    if not existing_chapter or existing_chapter.book_id != book_uuid:
        raise HTTPException(status_code=404, detail="Chapter not found")

    update_data = chapter.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Validate chapter can only be published if it has audio_url
    if update_data.get("is_published") is True:
        if not existing_chapter.audio_url:
            raise HTTPException(
                status_code=400,
                detail="Cannot publish chapter: chapter must be processed (have audio_url) first"
            )

    # If unpublishing a chapter, check if book should be unpublished too
    if update_data.get("is_published") is False and book.is_published:
        # Count remaining published chapters (excluding the one being unpublished)
        other_published = [
            ch for ch in book.chapters
            if ch.is_published and not ch.is_deleted and ch.id != chapter_uuid
        ]
        if not other_published:
            # This was the last published chapter, unpublish the book
            book.is_published = False

    # Update chapter fields
    for key, value in update_data.items():
        setattr(existing_chapter, key, value)

    book.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(existing_chapter)

    return chapter_to_response(existing_chapter)


@router.delete("/{book_id}/chapters/{chapter_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chapter(book_id: str, chapter_id: str, db: AsyncSession = Depends(get_db)):
    """Soft delete a chapter by setting is_deleted to true."""
    try:
        book_uuid = UUID(book_id)
        chapter_uuid = UUID(chapter_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    book = await db.get(Book, book_uuid)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    chapter = await db.get(Chapter, chapter_uuid)
    if not chapter or chapter.book_id != book_uuid or chapter.is_deleted:
        raise HTTPException(status_code=404, detail="Chapter not found")

    chapter.is_deleted = True
    book.updated_at = datetime.now(timezone.utc)
    await db.commit()

    # Recalculate book duration after soft deleting chapter
    await recalculate_book_duration(db, book_uuid)

    return None


def sanitize_filename(name: str) -> str:
    """Convert name to a safe filename."""
    sanitized = re.sub(r'[^\w\s-]', '', name.lower())
    sanitized = re.sub(r'[-\s]+', '-', sanitized).strip('-')
    return sanitized


@router.post("/{book_id}/chapters/{chapter_id}/process")
async def process_chapter(book_id: str, chapter_id: str, db: AsyncSession = Depends(get_db)):
    """
    Process a chapter's audio file to HLS format.

    Converts the uploaded M4A file to HLS segments for streaming.
    """
    try:
        book_uuid = UUID(book_id)
        chapter_uuid = UUID(chapter_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    book = await db.get(Book, book_uuid)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    chapter = await db.get(Chapter, chapter_uuid)
    if not chapter or chapter.book_id != book_uuid:
        raise HTTPException(status_code=404, detail="Chapter not found")

    if not chapter.file_id:
        raise HTTPException(status_code=400, detail="Chapter has no audio file to process")

    # Build input file path: uploads/{file_id}
    input_file = os.path.join(UPLOAD_DIR, chapter.file_id)

    if not os.path.exists(input_file):
        raise HTTPException(status_code=404, detail="Audio file not found on disk")

    # Build output directory: audio-library/shrota-audio-library/{book-name}-{book-id}/{chapter-name}-{chapter-id}
    safe_book_name = sanitize_filename(book.title)
    safe_chapter_name = sanitize_filename(chapter.title)
    book_folder = f"{safe_book_name}-{book_id}"
    chapter_folder = f"{safe_chapter_name}-{chapter_id}"
    output_dir = os.path.join(AUDIO_LIBRARY_DIR, book_folder, chapter_folder)

    try:
        # Run blocking FFmpeg conversion in thread pool
        result = await asyncio.to_thread(convert_to_hls, input_file, output_dir)

        # Build audio URL path (without host - CDN will serve this)
        audio_url = f"shrota-audio-library/{book_folder}/{chapter_folder}/playlist.m3u8"

        # Update chapter with audio URL, duration, and file_size
        chapter.audio_url = audio_url
        chapter.duration = result["duration"]
        chapter.file_size = result["file_size"]
        book.updated_at = datetime.now(timezone.utc)

        await db.commit()

        # Recalculate book's total_duration
        await recalculate_book_duration(db, book_uuid)

        return {
            "message": "Chapter processed successfully",
            "audio_url": audio_url,
            "segments_count": len(result["segments"]),
            "duration": result["duration"],
            "file_size": result["file_size"],
        }

    except HLSConversionError as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {type(e).__name__}: {str(e)}")
