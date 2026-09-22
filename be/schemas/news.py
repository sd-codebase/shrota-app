from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class NewsCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    text: str = Field(..., min_length=1)
    cover_image: Optional[str] = Field(None, max_length=500)
    is_active: bool = True


class NewsUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=300)
    text: Optional[str] = Field(None, min_length=1)
    cover_image: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None


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
