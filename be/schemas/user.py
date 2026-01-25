from datetime import date, datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, EmailStr, field_validator
import re


class UserRegister(BaseModel):
    """Schema for user registration."""
    name: str = Field(..., min_length=1, max_length=200)
    email: Optional[EmailStr] = None
    whatsapp_number: Optional[str] = Field(None, max_length=20)
    birth_date: Optional[date] = None

    @field_validator('whatsapp_number')
    @classmethod
    def validate_whatsapp(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        # Remove spaces and dashes, keep + for country code
        cleaned = re.sub(r'[\s-]', '', v)
        # Validate format: optional +, then 10-15 digits
        if not re.match(r'^\+?\d{10,15}$', cleaned):
            raise ValueError('Invalid WhatsApp number format')
        return cleaned

    @field_validator('birth_date')
    @classmethod
    def validate_birth_date(cls, v: Optional[date]) -> Optional[date]:
        if v is None:
            return v
        if v > date.today():
            raise ValueError('Birth date cannot be in the future')
        return v

    def model_post_init(self, __context) -> None:
        """Ensure at least one contact method is provided."""
        if not self.email and not self.whatsapp_number:
            raise ValueError('At least one of email or whatsapp_number must be provided')


class UserResponse(BaseModel):
    """Schema for user response."""
    id: str
    name: str
    email: Optional[str] = None
    whatsapp_number: Optional[str] = None
    birth_date: Optional[date] = None
    is_email_verified: bool
    is_whatsapp_verified: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SendOTPRequest(BaseModel):
    """Schema for sending OTP."""
    identifier: str = Field(..., min_length=1, description="Email or WhatsApp number")
    otp_type: Literal['email', 'whatsapp'] = Field(..., description="Type of OTP to send")

    @field_validator('identifier')
    @classmethod
    def validate_identifier(cls, v: str) -> str:
        return v.strip().lower()


class SendOTPResponse(BaseModel):
    """Schema for send OTP response."""
    message: str
    expires_in: int = Field(..., description="OTP expiry time in seconds")


class VerifyOTPRequest(BaseModel):
    """Schema for verifying OTP."""
    identifier: str = Field(..., min_length=1, description="Email or WhatsApp number")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit OTP")
    otp_type: Literal['email', 'whatsapp'] = Field(..., description="Type of OTP")

    @field_validator('identifier')
    @classmethod
    def validate_identifier(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator('otp')
    @classmethod
    def validate_otp(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError('OTP must contain only digits')
        return v


class UserTokenResponse(BaseModel):
    """Schema for user authentication token response."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse
