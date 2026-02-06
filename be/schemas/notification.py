from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class NotificationSend(BaseModel):
    """Schema for sending a push notification."""

    title: str = Field(..., min_length=1, max_length=200, description="Notification title")
    body: str = Field(..., min_length=1, max_length=1000, description="Notification body text")
    image_url: Optional[str] = Field(None, max_length=500, description="Optional image URL")


class NotificationResponse(BaseModel):
    """Schema for notification response."""

    id: str
    title: str
    body: str
    image_url: Optional[str] = None
    topic: str
    fcm_message_id: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NotificationSendResponse(BaseModel):
    """Response after sending a notification."""

    success: bool
    notification: NotificationResponse
    message: str
