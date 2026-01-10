from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class GenreCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


class GenreBulkCreate(BaseModel):
    genres: list[GenreCreate]


class GenreUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


class GenreResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
