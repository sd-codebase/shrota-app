from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from utils.slugify import validate_slug_input


class GenreCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    # URL slug; blank = generate from the name. Sanitized by validate_slug_input.
    slug: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    thumbnail: Optional[str] = Field(None, max_length=500)
    is_adult: bool = False

    @field_validator("slug")
    @classmethod
    def clean_slug(cls, v: Optional[str]) -> Optional[str]:
        return validate_slug_input(v)


class GenreBulkCreate(BaseModel):
    genres: list[GenreCreate]


class GenreUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    # URL slug; blank = generate from the name. Sanitized by validate_slug_input.
    slug: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    thumbnail: Optional[str] = Field(None, max_length=500)
    is_adult: Optional[bool] = None

    @field_validator("slug")
    @classmethod
    def clean_slug(cls, v: Optional[str]) -> Optional[str]:
        return validate_slug_input(v)


class GenreResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    is_adult: bool = False
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
