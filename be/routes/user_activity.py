from datetime import datetime, timezone
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from database import get_db
from models import Book, User, UserBookProgress, UserLikedBook
from schemas.user_activity import (
    ProgressUpdate,
    ProgressResponse,
    LikedBookResponse,
    LikeStatusResponse,
)
from routes.user_auth import get_current_user


router = APIRouter(prefix="/v1/user", tags=["User Activity"])


def progress_to_response(progress: UserBookProgress, include_book: bool = True) -> dict:
    """Convert UserBookProgress to response dict."""
    response = {
        "id": str(progress.id),
        "book_id": str(progress.book_id),
        "current_chapter_index": progress.current_chapter_index,
        "current_position": progress.current_position,
        "total_listened_seconds": progress.total_listened_seconds,
        "progress_percentage": progress.progress_percentage,
        "is_completed": progress.is_completed,
        "last_played_at": progress.last_played_at,
        "created_at": progress.created_at,
        "updated_at": progress.updated_at,
    }

    if include_book and progress.book:
        response["book_title"] = progress.book.title
        response["book_thumbnail"] = progress.book.thumbnail
        response["book_author_names"] = [a.name for a in progress.book.authors] if progress.book.authors else []
        response["book_duration"] = progress.book.total_duration

    return response


def liked_to_response(liked: UserLikedBook, include_book: bool = True) -> dict:
    """Convert UserLikedBook to response dict."""
    response = {
        "id": str(liked.id),
        "book_id": str(liked.book_id),
        "liked_at": liked.liked_at,
    }

    if include_book and liked.book:
        response["book_title"] = liked.book.title
        response["book_thumbnail"] = liked.book.thumbnail
        response["book_author_names"] = [a.name for a in liked.book.authors] if liked.book.authors else []
        response["book_duration"] = liked.book.total_duration

    return response


# ==================== Progress Endpoints ====================

@router.post("/progress", response_model=ProgressResponse)
async def update_progress(
    payload: ProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update or create listening progress for a book.
    Called periodically by the mobile app during playback.
    """
    try:
        book_uuid = UUID(payload.book_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid book ID")

    # Verify book exists
    book = await db.get(Book, book_uuid)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    # Find existing progress or create new
    result = await db.execute(
        select(UserBookProgress)
        .options(selectinload(UserBookProgress.book).selectinload(Book.authors))
        .where(UserBookProgress.user_id == current_user.id)
        .where(UserBookProgress.book_id == book_uuid)
    )
    progress = result.scalar_one_or_none()

    if progress:
        # Update existing progress
        progress.current_chapter_index = payload.current_chapter_index
        progress.current_position = payload.current_position
        progress.last_played_at = datetime.now(timezone.utc)

        if payload.total_listened_seconds is not None:
            progress.total_listened_seconds = payload.total_listened_seconds

        if payload.progress_percentage is not None:
            progress.progress_percentage = payload.progress_percentage

        if payload.is_completed is not None:
            progress.is_completed = payload.is_completed
    else:
        # Create new progress
        progress = UserBookProgress(
            user_id=current_user.id,
            book_id=book_uuid,
            current_chapter_index=payload.current_chapter_index,
            current_position=payload.current_position,
            total_listened_seconds=payload.total_listened_seconds or 0,
            progress_percentage=payload.progress_percentage or 0.0,
            is_completed=payload.is_completed or False,
            last_played_at=datetime.now(timezone.utc),
        )
        db.add(progress)

    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(UserBookProgress)
        .options(selectinload(UserBookProgress.book).selectinload(Book.authors))
        .where(UserBookProgress.id == progress.id)
    )
    progress = result.scalar_one()

    return progress_to_response(progress)


@router.get("/progress", response_model=list[ProgressResponse])
async def get_all_progress(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all listening progress for the current user.
    Used for 'Continue Listening' section.
    """
    result = await db.execute(
        select(UserBookProgress)
        .options(selectinload(UserBookProgress.book).selectinload(Book.authors))
        .where(UserBookProgress.user_id == current_user.id)
        .where(UserBookProgress.is_completed == False)
        .order_by(UserBookProgress.last_played_at.desc())
    )
    progress_list = result.scalars().all()

    return [progress_to_response(p) for p in progress_list]


@router.get("/progress/completed", response_model=list[ProgressResponse])
async def get_completed_books(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all completed books for the current user.
    Used for 'Listened' section in bookshelf.
    """
    result = await db.execute(
        select(UserBookProgress)
        .options(selectinload(UserBookProgress.book).selectinload(Book.authors))
        .where(UserBookProgress.user_id == current_user.id)
        .where(UserBookProgress.is_completed == True)
        .order_by(UserBookProgress.last_played_at.desc())
    )
    progress_list = result.scalars().all()

    return [progress_to_response(p) for p in progress_list]


@router.get("/progress/{book_id}", response_model=ProgressResponse)
async def get_book_progress(
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get listening progress for a specific book.
    """
    try:
        book_uuid = UUID(book_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid book ID")

    result = await db.execute(
        select(UserBookProgress)
        .options(selectinload(UserBookProgress.book).selectinload(Book.authors))
        .where(UserBookProgress.user_id == current_user.id)
        .where(UserBookProgress.book_id == book_uuid)
    )
    progress = result.scalar_one_or_none()

    if not progress:
        raise HTTPException(status_code=404, detail="No progress found for this book")

    return progress_to_response(progress)


@router.delete("/progress/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book_progress(
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete progress for a specific book (reset progress).
    """
    try:
        book_uuid = UUID(book_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid book ID")

    await db.execute(
        delete(UserBookProgress)
        .where(UserBookProgress.user_id == current_user.id)
        .where(UserBookProgress.book_id == book_uuid)
    )
    await db.commit()

    return None


# ==================== Like/Favorite Endpoints ====================

@router.post("/books/{book_id}/like", response_model=LikedBookResponse)
async def like_book(
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Like/favorite a book.
    """
    try:
        book_uuid = UUID(book_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid book ID")

    # Verify book exists
    book = await db.get(Book, book_uuid)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    # Check if already liked
    result = await db.execute(
        select(UserLikedBook)
        .where(UserLikedBook.user_id == current_user.id)
        .where(UserLikedBook.book_id == book_uuid)
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(status_code=400, detail="Book already liked")

    # Create like
    liked = UserLikedBook(
        user_id=current_user.id,
        book_id=book_uuid,
        liked_at=datetime.now(timezone.utc),
    )
    db.add(liked)
    await db.commit()

    # Reload with book details
    result = await db.execute(
        select(UserLikedBook)
        .options(selectinload(UserLikedBook.book).selectinload(Book.authors))
        .where(UserLikedBook.id == liked.id)
    )
    liked = result.scalar_one()

    return liked_to_response(liked)


@router.delete("/books/{book_id}/like", status_code=status.HTTP_204_NO_CONTENT)
async def unlike_book(
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Unlike/unfavorite a book.
    """
    try:
        book_uuid = UUID(book_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid book ID")

    result = await db.execute(
        delete(UserLikedBook)
        .where(UserLikedBook.user_id == current_user.id)
        .where(UserLikedBook.book_id == book_uuid)
    )
    await db.commit()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Book not liked")

    return None


@router.get("/books/{book_id}/like", response_model=LikeStatusResponse)
async def get_like_status(
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Check if a book is liked by the current user.
    """
    try:
        book_uuid = UUID(book_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid book ID")

    result = await db.execute(
        select(UserLikedBook)
        .where(UserLikedBook.user_id == current_user.id)
        .where(UserLikedBook.book_id == book_uuid)
    )
    liked = result.scalar_one_or_none()

    return LikeStatusResponse(
        is_liked=liked is not None,
        liked_at=liked.liked_at if liked else None,
    )


@router.get("/liked-books", response_model=list[LikedBookResponse])
async def get_liked_books(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all liked books for the current user.
    """
    result = await db.execute(
        select(UserLikedBook)
        .options(selectinload(UserLikedBook.book).selectinload(Book.authors))
        .where(UserLikedBook.user_id == current_user.id)
        .order_by(UserLikedBook.liked_at.desc())
    )
    liked_list = result.scalars().all()

    return [liked_to_response(l) for l in liked_list]
