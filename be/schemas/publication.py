from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class PublicationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)


class PublicationBulkCreate(BaseModel):
    publications: list[PublicationCreate]


class PublicationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)


class PublicationResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
