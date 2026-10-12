from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class FeatureFlagUserResponse(BaseModel):
    id: str
    name: str
    email: str
    whatsapp_number: Optional[str] = None
    added_at: datetime


class FeatureFlagResponse(BaseModel):
    key: str
    name: str
    description: str
    enabled_for_all: bool
    user_count: int
    updated_at: Optional[datetime] = None


class FeatureFlagDetailResponse(FeatureFlagResponse):
    users: list[FeatureFlagUserResponse]


class FeatureFlagUpdate(BaseModel):
    enabled_for_all: bool


class FeatureFlagAddUser(BaseModel):
    user_id: str


class AppFeatureFlagsResponse(BaseModel):
    """Every known flag and whether it's on for the signed-in user."""
    flags: dict[str, bool]
