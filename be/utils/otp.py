import random
import string
from datetime import datetime, timedelta
from typing import Tuple

from services.email_service import send_otp_email

# In-memory OTP storage: {identifier: (otp, expiry_time)}
_otp_store: dict[str, Tuple[str, datetime]] = {}

# OTP configuration
OTP_LENGTH = 6
OTP_EXPIRY_MINUTES = 5


def generate_otp() -> str:
    """Generate a random 6-digit OTP."""
    return ''.join(random.choices(string.digits, k=OTP_LENGTH))


async def store_otp(identifier: str, otp_type: str) -> Tuple[bool, str]:
    """
    Generate, store, and send an OTP for the given identifier.

    Args:
        identifier: Email or WhatsApp number
        otp_type: Type of OTP ('email' or 'whatsapp')

    Returns:
        Tuple of (success: bool, message: str)
    """
    otp = generate_otp()
    expiry = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)

    # Create a unique key combining identifier and type
    key = f"{otp_type}:{identifier}"
    _otp_store[key] = (otp, expiry)

    # Log OTP to console for debugging
    otp_type_display = "EMAIL" if otp_type == "email" else "WHATSAPP"
    print(f"\n{'='*50}")
    print(f"[OTP] {otp_type_display} OTP for {identifier}: {otp}")
    print(f"[OTP] Expires at: {expiry.isoformat()}")
    print(f"{'='*50}\n")

    # Send OTP via appropriate channel
    if otp_type == "email":
        success = await send_otp_email(identifier, otp)
        if not success:
            # Remove stored OTP if sending failed
            del _otp_store[key]
            return False, "Failed to send OTP email. Please try again."
        return True, "OTP sent to email"
    else:
        # WhatsApp not implemented yet
        return True, "OTP sent to WhatsApp (simulated)"


def verify_otp(identifier: str, otp: str, otp_type: str) -> bool:
    """
    Verify an OTP for the given identifier.

    Args:
        identifier: Email or WhatsApp number
        otp: The OTP to verify
        otp_type: Type of OTP ('email' or 'whatsapp')

    Returns:
        True if OTP is valid and not expired, False otherwise
    """
    key = f"{otp_type}:{identifier}"

    if key not in _otp_store:
        return False

    stored_otp, expiry = _otp_store[key]

    # Check if OTP matches and is not expired
    if stored_otp == otp and datetime.utcnow() <= expiry:
        # Remove OTP after successful verification
        del _otp_store[key]
        return True

    return False


def clear_expired_otps() -> None:
    """Remove all expired OTPs from storage."""
    now = datetime.utcnow()
    expired_keys = [
        key for key, (_, expiry) in _otp_store.items()
        if now > expiry
    ]
    for key in expired_keys:
        del _otp_store[key]


def get_otp_expiry_seconds() -> int:
    """Get OTP expiry time in seconds."""
    return OTP_EXPIRY_MINUTES * 60
