from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# Nested response schemas for related entities
class BookSummary(BaseModel):
    id: str
    title: str

    class Config:
        from_attributes = True


class LanguageSummary(BaseModel):
    id: str
    name: str
    code: str

    class Config:
        from_attributes = True


class GenreSummary(BaseModel):
    id: str
    name: str

    class Config:
        from_attributes = True


# New Release schemas
class NewReleaseCreate(BaseModel):
    book_id: str = Field(..., description="UUID of the book")
    language_id: str = Field(..., description="UUID of the language")
    display_order: int = Field(default=0, ge=0)
    is_active: bool = Field(default=True)
    starts_at: Optional[datetime] = Field(None, description="When this promotion starts")
    expires_at: Optional[datetime] = Field(None, description="When this promotion ends")


class NewReleaseUpdate(BaseModel):
    display_order: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None
    starts_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None


class NewReleaseResponse(BaseModel):
    id: str
    book_id: str
    language_id: str
    book: BookSummary
    language: LanguageSummary
    display_order: int
    is_active: bool
    starts_at: Optional[datetime]
    expires_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Featured Book schemas
class FeaturedBookCreate(BaseModel):
    book_id: str = Field(..., description="UUID of the book")
    language_id: str = Field(..., description="UUID of the language")
    display_order: int = Field(default=0, ge=0)
    is_active: bool = Field(default=True)
    starts_at: Optional[datetime] = Field(None, description="When this promotion starts")
    expires_at: Optional[datetime] = Field(None, description="When this promotion ends")


class FeaturedBookUpdate(BaseModel):
    display_order: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None
    starts_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None


class FeaturedBookResponse(BaseModel):
    id: str
    book_id: str
    language_id: str
    book: BookSummary
    language: LanguageSummary
    display_order: int
    is_active: bool
    starts_at: Optional[datetime]
    expires_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Promoted Book schemas
class PromotedBookCreate(BaseModel):
    book_id: str = Field(..., description="UUID of the book")
    genre_id: str = Field(..., description="UUID of the genre")
    display_order: int = Field(default=0, ge=0)
    is_active: bool = Field(default=True)
    starts_at: Optional[datetime] = Field(None, description="When this promotion starts")
    expires_at: Optional[datetime] = Field(None, description="When this promotion ends")


class PromotedBookUpdate(BaseModel):
    display_order: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None
    starts_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None


class PromotedBookResponse(BaseModel):
    id: str
    book_id: str
    genre_id: str
    book: BookSummary
    genre: GenreSummary
    display_order: int
    is_active: bool
    starts_at: Optional[datetime]
    expires_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Reorder schemas
class ReorderItem(BaseModel):
    id: str = Field(..., description="UUID of the promotion entry")
    display_order: int = Field(..., ge=0)


class ReorderRequest(BaseModel):
    items: list[ReorderItem] = Field(..., min_length=1)
