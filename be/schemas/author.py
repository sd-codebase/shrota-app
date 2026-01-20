from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class SocialMedia(BaseModel):
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    youtube: Optional[str] = None
    x: Optional[str] = None


class AuthorCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    bio: Optional[str] = Field(None, max_length=1000)
    social_media: Optional[SocialMedia] = None
    photo: Optional[str] = Field(None, max_length=500)


class AuthorBulkCreate(BaseModel):
    authors: list[AuthorCreate]


class AuthorUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    bio: Optional[str] = Field(None, max_length=1000)
    social_media: Optional[SocialMedia] = None
    photo: Optional[str] = Field(None, max_length=500)


class AuthorResponse(BaseModel):
    id: str
    name: str
    bio: Optional[str] = None
    social_media: Optional[SocialMedia] = None
    photo: Optional[str] = None
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
