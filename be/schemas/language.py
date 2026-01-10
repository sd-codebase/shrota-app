from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class LanguageCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=2, max_length=10)


class LanguageBulkCreate(BaseModel):
    languages: list[LanguageCreate]


class LanguageUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    code: Optional[str] = Field(None, min_length=2, max_length=10)


class LanguageResponse(BaseModel):
    id: str
    name: str
    code: str
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
