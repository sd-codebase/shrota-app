from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class EventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    text: str = Field(..., min_length=1)
    cover_image: Optional[str] = Field(None, max_length=500)
    show_on_home: bool = False
    is_active: bool = True


class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=300)
    text: Optional[str] = Field(None, min_length=1)
    cover_image: Optional[str] = Field(None, max_length=500)
    show_on_home: Optional[bool] = None
    is_active: Optional[bool] = None


class EventResponse(BaseModel):
    id: str
    title: str
    text: str
    cover_image: Optional[str] = None
    show_on_home: bool = False
    is_active: bool = True
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
