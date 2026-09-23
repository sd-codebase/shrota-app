from datetime import datetime
from pydantic import BaseModel, Field, field_validator

SPLASH_RESOURCE_TYPES = ("image", "video")


class SplashResourceCreate(BaseModel):
    resource_type: str = Field(..., description=f"One of: {', '.join(SPLASH_RESOURCE_TYPES)}")
    file: str = Field(..., min_length=1, max_length=500)
    is_active: bool = True

    @field_validator("resource_type")
    @classmethod
    def validate_resource_type(cls, v: str) -> str:
        if v not in SPLASH_RESOURCE_TYPES:
            raise ValueError(f"resource_type must be one of: {', '.join(SPLASH_RESOURCE_TYPES)}")
        return v


class SplashResourceUpdate(BaseModel):
    is_active: bool


class SplashResourceResponse(BaseModel):
    id: str
    resource_type: str
    file: str
    is_active: bool
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
