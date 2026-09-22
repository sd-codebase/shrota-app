from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr, field_validator

ADMIN_ROLES = ("admin", "publisher")


class AdminLogin(BaseModel):
    email: str = Field(..., description="Email or username")
    password: str = Field(..., min_length=1)


class AdminCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=1, max_length=200)
    role: str = Field("admin", description=f"One of: {', '.join(ADMIN_ROLES)}")

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ADMIN_ROLES:
            raise ValueError(f"role must be one of: {', '.join(ADMIN_ROLES)}")
        return v


class AdminTeamUpdate(BaseModel):
    """Admin-only: update another team member's role/name/active status."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    role: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ADMIN_ROLES:
            raise ValueError(f"role must be one of: {', '.join(ADMIN_ROLES)}")
        return v


class AdminResponse(BaseModel):
    id: str
    email: str
    username: str
    name: str
    is_active: bool
    role: str = "admin"
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    admin: AdminResponse
