from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from schemas.author import SocialMedia


class ArtistCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    bio: Optional[str] = Field(None, max_length=1000)
    social_media: Optional[SocialMedia] = None


class ArtistBulkCreate(BaseModel):
    artists: list[ArtistCreate]


class ArtistUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    bio: Optional[str] = Field(None, max_length=1000)
    social_media: Optional[SocialMedia] = None


class ArtistResponse(BaseModel):
    id: str
    name: str
    bio: Optional[str] = None
    social_media: Optional[SocialMedia] = None
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
