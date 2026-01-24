from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr


class AdminLogin(BaseModel):
    email: str = Field(..., description="Email or username")
    password: str = Field(..., min_length=1)


class AdminCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=1, max_length=200)


class AdminResponse(BaseModel):
    id: str
    email: str
    username: str
    name: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    admin: AdminResponse
