from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class RoyaltyBookLine(BaseModel):
    book_id: Optional[str] = None
    book_title: str
    author_names: list[str] = []
    publisher_name: Optional[str] = None
    seconds_listened: int
    hours_listened: float
    unique_listeners: int
    unique_devices: int
    share_percentage: float


class RoyaltyAuthorLine(BaseModel):
    author_id: Optional[str] = None
    author_name: str
    books: int
    seconds_listened: int
    hours_listened: float
    unique_listeners: int
    share_percentage: float


class RoyaltyReport(BaseModel):
    date_from: date
    date_to: date
    include_guests: bool
    timezone: str
    total_seconds: int
    total_hours: float
    total_listeners: int
    total_devices: int
    books: list[RoyaltyBookLine] = []
    authors: list[RoyaltyAuthorLine] = []


class RoyaltySnapshotCreate(BaseModel):
    label: str = Field(..., min_length=1, max_length=120)
    period_start: date
    period_end: date
    include_guests: bool = True
    notes: Optional[str] = None

    @field_validator("period_end")
    @classmethod
    def end_after_start(cls, value: date, info):
        start = info.data.get("period_start")
        if start and value < start:
            raise ValueError("period_end must not be before period_start")
        return value


class RoyaltySnapshotLineResponse(BaseModel):
    book_id: Optional[str] = None
    book_title: str
    author_names: str
    publisher_name: Optional[str] = None
    seconds_listened: int
    hours_listened: float
    unique_listeners: int
    unique_devices: int
    share_percentage: float


class RoyaltySnapshotResponse(BaseModel):
    id: str
    label: str
    period_start: date
    period_end: date
    include_guests: bool
    total_seconds: int
    total_hours: float
    notes: Optional[str] = None
    generated_at: datetime
    generated_by_name: Optional[str] = None
    line_count: int


class RoyaltySnapshotDetail(RoyaltySnapshotResponse):
    lines: list[RoyaltySnapshotLineResponse] = []


class LedgerRebuildResponse(BaseModel):
    date_from: date
    date_to: date
    events_read: int
    entries_written: int
    seconds_credited: int
