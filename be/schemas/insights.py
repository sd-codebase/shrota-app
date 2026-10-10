from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class InsightsSummary(BaseModel):
    """Top-line numbers across every book the caller is allowed to see."""
    books_total: int
    books_published: int
    # Distinct app users who have any listening progress at all.
    listeners_total: int
    likes_total: int
    listened_hours: float
    books_completed: int
    # Devices seen in the activity stream — includes guests, who never
    # reach the progress table (see routes/insights.py).
    unique_devices: int


class ChapterInsight(BaseModel):
    chapter_id: str
    order: int
    title: str
    duration: Optional[int] = None
    # Listeners whose furthest position is at or past this chapter.
    listeners_reached: int
    # chapter_completed events logged for this chapter (guests included).
    completions: int


class BookListenerRow(BaseModel):
    user_id: str
    name: str
    whatsapp_number: Optional[str] = None
    current_chapter_index: int
    progress_percentage: float
    total_listened_seconds: int
    is_completed: bool
    last_played_at: datetime


class BookInsight(BaseModel):
    book_id: str
    title: str
    thumbnail: Optional[str] = None
    is_published: bool
    access_type: str
    language: Optional[str] = None
    authors: list[str] = []
    genres: list[str] = []
    chapters_total: int
    total_duration: Optional[int] = None

    # Signed-in listening (user_book_progress)
    listeners: int
    completed_listeners: int
    completion_rate: float
    avg_progress_percentage: float
    avg_chapter_reached: float
    listened_seconds: int
    last_played_at: Optional[datetime] = None

    # Where unfinished listeners stopped: the chapter index holding the
    # most abandoned listeners, and how many sit there.
    dropoff_chapter_index: Optional[int] = None
    dropoff_listeners: int = 0

    likes: int

    # Activity stream (counts devices, so guest listening shows up here)
    unique_viewers: int
    unique_players: int
    view_to_play_rate: float


class BookInsightDetail(BookInsight):
    chapters: list[ChapterInsight] = []
    recent_listeners: list[BookListenerRow] = []
    # book_viewed `source` param → count, i.e. how people found the book.
    view_sources: dict[str, int] = {}


class BookInsightListResponse(BaseModel):
    books: list[BookInsight]
    total: int
    limit: int
    offset: int
