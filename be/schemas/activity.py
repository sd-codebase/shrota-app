from datetime import datetime
from typing import Optional, Any

from pydantic import BaseModel, Field


class ActivitySessionPayload(BaseModel):
    """Session metadata, re-sent with every batch so it stays an upsert."""
    session_id: str
    install_id: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    platform: Optional[str] = Field(None, max_length=20)
    os_version: Optional[str] = Field(None, max_length=50)
    device_model: Optional[str] = Field(None, max_length=120)
    app_version: Optional[str] = Field(None, max_length=30)


class ActivityEventPayload(BaseModel):
    # Generated on the device so a retried batch cannot create duplicates.
    event_id: str
    event_name: str = Field(..., min_length=1, max_length=60)
    occurred_at: datetime
    params: Optional[dict[str, Any]] = None


class ActivityIngestRequest(BaseModel):
    session: ActivitySessionPayload
    events: list[ActivityEventPayload] = Field(default_factory=list, max_length=500)


class ActivityIngestResponse(BaseModel):
    accepted: int
    duplicates: int
    session_id: str
    user_linked: bool


class ActivityEventResponse(BaseModel):
    id: str
    session_id: str
    user_id: Optional[str] = None
    event_name: str
    params: Optional[dict[str, Any]] = None
    occurred_at: datetime
    received_at: datetime

    class Config:
        from_attributes = True


class ActivitySessionResponse(BaseModel):
    id: str
    install_id: str
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    user_whatsapp: Optional[str] = None
    started_at: datetime
    ended_at: Optional[datetime] = None
    platform: Optional[str] = None
    os_version: Optional[str] = None
    device_model: Optional[str] = None
    app_version: Optional[str] = None
    event_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ActivitySessionListResponse(BaseModel):
    sessions: list[ActivitySessionResponse]
    total: int
    limit: int
    offset: int


class ActivityFilterOptions(BaseModel):
    """Distinct values present in the data, for populating filter dropdowns."""
    platforms: list[str]
    app_versions: list[str]
    event_names: list[str]
