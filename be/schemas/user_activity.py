from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ProgressUpdate(BaseModel):
    """Request to update listening progress."""
    book_id: str
    current_chapter_index: int = Field(..., ge=0)
    current_position: float = Field(..., ge=0)  # Position in seconds
    total_listened_seconds: Optional[int] = Field(None, ge=0)
    progress_percentage: Optional[float] = Field(None, ge=0, le=100)
    is_completed: Optional[bool] = None


class ProgressResponse(BaseModel):
    """Response with book progress details."""
    id: str
    book_id: str
    current_chapter_index: int
    current_position: float
    total_listened_seconds: int
    progress_percentage: float
    is_completed: bool
    last_played_at: datetime
    created_at: datetime
    updated_at: datetime

    # Book details (included when fetching progress)
    book_title: Optional[str] = None
    book_thumbnail: Optional[str] = None
    book_author_names: Optional[list[str]] = None
    book_duration: Optional[int] = None


class LikedBookResponse(BaseModel):
    """Response for liked book."""
    id: str
    book_id: str
    liked_at: datetime

    # Book details
    book_title: Optional[str] = None
    book_thumbnail: Optional[str] = None
    book_author_names: Optional[list[str]] = None
    book_duration: Optional[int] = None


class LikeStatusResponse(BaseModel):
    """Response for like status check."""
    is_liked: bool
    liked_at: Optional[datetime] = None
