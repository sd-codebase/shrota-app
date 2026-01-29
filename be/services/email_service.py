import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path

from config import (
    NOTIFICATION_MODE,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASSWORD,
    SMTP_FROM_EMAIL,
    SMTP_FROM_NAME,
    SMTP_USE_TLS,
)


def _load_template(template_name: str) -> str:
    """Load an email template from the templates directory."""
    template_path = Path(__file__).parent.parent / "templates" / "email" / template_name
    try:
        with open(template_path, "r") as f:
            return f.read()
    except FileNotFoundError:
        print(f"[EMAIL] Template not found: {template_path}")
        raise
    except IOError as e:
        print(f"[EMAIL] Error reading template {template_path}: {e}")
        raise


async def send_otp_email(email: str, otp: str) -> bool:
    """
    Send OTP email to the specified address.

    In development mode, only logs to console.
    In production mode, sends actual email via SMTP.

    Args:
        email: Recipient email address
        otp: The OTP code to send

    Returns:
        True if successful, False otherwise
    """
    if NOTIFICATION_MODE == "development":
        print(f"\n{'='*50}")
        print(f"[EMAIL] Development mode - Email would be sent to: {email}")
        print(f"[EMAIL] OTP: {otp}")
        print(f"{'='*50}\n")
        return True

    try:
        # Load and format HTML template
        html_template = _load_template("otp.html")
        html_content = html_template.replace("{{OTP}}", otp)

        # Create message
        message = MIMEMultipart("alternative")
        message["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
        message["To"] = email
        message["Subject"] = f"Your Shrota Verification Code: {otp}"

        # Plain text fallback
        text_content = f"""
Your Shrota Verification Code

Your OTP is: {otp}

This code will expire in 5 minutes.

If you didn't request this code, please ignore this email.

- The Shrota Team
"""

        message.attach(MIMEText(text_content, "plain"))
        message.attach(MIMEText(html_content, "html"))

        # Send email
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            start_tls=SMTP_USE_TLS,
        )

        print(f"[EMAIL] OTP email sent successfully to {email}")
        return True

    except Exception as e:
        print(f"[EMAIL] Failed to send OTP email to {email}: {str(e)}")
        return False
