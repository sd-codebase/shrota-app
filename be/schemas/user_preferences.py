from datetime import datetime
from typing import List
from pydantic import BaseModel, Field


class PreferencesUpdate(BaseModel):
    """Schema for updating user preferences."""
    language_ids: List[str] = Field(..., min_length=1, description="List of language IDs")
    genre_ids: List[str] = Field(..., min_length=3, description="List of genre IDs (minimum 3)")


class PreferencesResponse(BaseModel):
    """Schema for user preferences response."""
    language_ids: List[str]
    genre_ids: List[str]
    updated_at: datetime

    class Config:
        from_attributes = True
