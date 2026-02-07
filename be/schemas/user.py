from datetime import date, datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, EmailStr, field_validator
import re


class UserRegister(BaseModel):
    """Schema for user registration."""
    name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr = Field(..., description="User's email address (required)")
    birth_date: date = Field(..., description="User's birth date (required)")
    whatsapp_number: str = Field(..., min_length=10, max_length=15, description="WhatsApp number (10-15 digits)")

    @field_validator('birth_date')
    @classmethod
    def validate_birth_date(cls, v: date) -> date:
        if v > date.today():
            raise ValueError('Birth date cannot be in the future')
        return v

    @field_validator('whatsapp_number')
    @classmethod
    def validate_whatsapp_number(cls, v: str) -> str:
        digits = re.sub(r'\D', '', v)
        if len(digits) < 10 or len(digits) > 15:
            raise ValueError('WhatsApp number must be 10-15 digits')
        return v.strip()


class UserResponse(BaseModel):
    """Schema for user response."""
    id: str
    name: str
    email: str
    birth_date: date
    is_email_verified: bool
    is_active: bool
    whatsapp_number: Optional[str] = None
    is_whatsapp_verified: bool = False
    whatsapp_otp_sent: bool = False
    address: Optional[str] = None
    village_landmark: Optional[str] = None
    tahsil_city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pin_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Schema for updating user profile (all fields optional)."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    whatsapp_number: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)
    village_landmark: Optional[str] = Field(None, max_length=200)
    tahsil_city: Optional[str] = Field(None, max_length=100)
    district: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    pin_code: Optional[str] = Field(None, max_length=10)

    @field_validator('pin_code')
    @classmethod
    def validate_pin_code(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v != '':
            if not re.match(r'^\d{6}$', v):
                raise ValueError('Pin code must be exactly 6 digits')
        return v

    @field_validator('whatsapp_number')
    @classmethod
    def validate_whatsapp_number(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v != '':
            digits = re.sub(r'\D', '', v)
            if len(digits) < 10 or len(digits) > 15:
                raise ValueError('WhatsApp number must be 10-15 digits')
        return v


class SendOTPRequest(BaseModel):
    """Schema for sending OTP."""
    identifier: str = Field(..., min_length=1, description="Email address")
    otp_type: Literal['email'] = Field(..., description="Type of OTP to send")

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
    identifier: str = Field(..., min_length=1, description="Email address")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit OTP")
    otp_type: Literal['email'] = Field(..., description="Type of OTP")

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


# Admin schemas for user management
class UserAdminUpdate(BaseModel):
    """Schema for admin updating a user."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    email: Optional[EmailStr] = None
    birth_date: Optional[date] = None
    whatsapp_number: Optional[str] = Field(None, max_length=20)

    @field_validator('birth_date')
    @classmethod
    def validate_birth_date(cls, v: Optional[date]) -> Optional[date]:
        if v is not None and v > date.today():
            raise ValueError('Birth date cannot be in the future')
        return v


class UserListResponse(BaseModel):
    """Schema for paginated user list response."""
    users: list[UserResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


# WhatsApp OTP schemas
class SendWhatsAppOTPResponse(BaseModel):
    """Response when admin generates a WhatsApp OTP for a user."""
    otp: str
    whatsapp_number: str
    wa_me_link: str
    message: str


class VerifyWhatsAppOTPRequest(BaseModel):
    """Schema for user verifying their WhatsApp OTP."""
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit OTP")

    @field_validator('otp')
    @classmethod
    def validate_otp(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError('OTP must contain only digits')
        return v


class WhatsAppStatusResponse(BaseModel):
    """Response for WhatsApp verification status check."""
    whatsapp_number: str
    is_whatsapp_verified: bool
    otp_sent: bool
