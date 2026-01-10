from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class ChapterCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    order: int = Field(..., ge=0)
    file_id: Optional[str] = None


class ChapterUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    order: Optional[int] = Field(None, ge=0)
    file_id: Optional[str] = None
    duration: Optional[int] = None  # Duration in seconds (auto-set by HLS processing)
    file_size: Optional[int] = None  # File size in bytes (auto-set by HLS processing)
    is_published: Optional[bool] = None  # Publish status


class ChapterResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    order: int
    file_id: Optional[str] = None
    audio_url: Optional[str] = None
    duration: Optional[int] = None  # Duration in seconds
    file_size: Optional[int] = None  # File size in bytes
    is_published: bool = False  # Publish status
    is_deleted: bool = False  # Soft delete flag


class BookCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    genre_ids: list[str] = Field(..., min_length=1)  # Multiple genres
    information: str = Field(..., max_length=1000)
    author_ids: list[str] = Field(..., min_length=1)  # Multiple authors
    artist_ids: list[str] = Field(default_factory=list)  # Multiple narrators
    publisher_id: Optional[str] = None
    language_id: Optional[str] = None
    thumbnail: Optional[str] = None

    @field_validator("information")
    @classmethod
    def validate_information_word_count(cls, v: str) -> str:
        word_count = len(v.split())
        if word_count > 100:
            raise ValueError("Information must not exceed 100 words")
        return v


class BookUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    genre_ids: Optional[list[str]] = None  # Multiple genres
    information: Optional[str] = Field(None, max_length=1000)
    author_ids: Optional[list[str]] = None  # Multiple authors
    artist_ids: Optional[list[str]] = None  # Multiple narrators
    publisher_id: Optional[str] = None
    language_id: Optional[str] = None
    thumbnail: Optional[str] = None
    is_published: Optional[bool] = None  # Publish status

    @field_validator("information")
    @classmethod
    def validate_information_word_count(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            word_count = len(v.split())
            if word_count > 100:
                raise ValueError("Information must not exceed 100 words")
        return v


class BookResponse(BaseModel):
    id: str
    title: str
    genre_ids: list[str]  # Multiple genres
    information: str
    author_ids: list[str]  # Multiple authors
    artist_ids: list[str] = []  # Multiple narrators
    publisher_id: Optional[str] = None
    language_id: Optional[str] = None
    thumbnail: Optional[str] = None
    total_duration: Optional[int] = None  # Auto-calculated sum of chapter durations
    is_published: bool = False  # Publish status
    is_deleted: bool = False  # Soft delete flag
    chapters: list[ChapterResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
