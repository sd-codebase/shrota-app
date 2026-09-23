from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class AppOpenAdCreate(BaseModel):
    file: str = Field(..., min_length=1, max_length=500)
    is_active: bool = True
    # Optional "Know More" destination — see models/app_open_ad.py
    link: Optional[str] = Field(None, max_length=1000)


class AppOpenAdUpdate(BaseModel):
    is_active: bool


class AppOpenAdResponse(BaseModel):
    id: str
    file: str
    is_active: bool
    link: Optional[str] = None
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
