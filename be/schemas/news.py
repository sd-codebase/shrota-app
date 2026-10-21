from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from utils.slugify import validate_slug_input


class NewsCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    # URL slug; blank = generate from the title. Sanitized by validate_slug_input.
    slug: Optional[str] = Field(None, max_length=200)
    text: str = Field(..., min_length=1)
    cover_image: Optional[str] = Field(None, max_length=500)
    is_active: bool = True

    @field_validator("slug")
    @classmethod
    def clean_slug(cls, v: Optional[str]) -> Optional[str]:
        return validate_slug_input(v)


class NewsUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=300)
    # URL slug; blank = generate from the title. Sanitized by validate_slug_input.
    slug: Optional[str] = Field(None, max_length=200)
    text: Optional[str] = Field(None, min_length=1)
    cover_image: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None

    @field_validator("slug")
    @classmethod
    def clean_slug(cls, v: Optional[str]) -> Optional[str]:
        return validate_slug_input(v)


class NewsResponse(BaseModel):
    id: str
    title: str
    slug: str
    text: str
    cover_image: Optional[str] = None
    is_active: bool = True
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
