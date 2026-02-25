import httpx

from config import (
    NOTIFICATION_MODE,
    WHATSAPP_API_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID,
)


async def send_whatsapp_otp(phone_number: str, otp: str) -> bool:
    """
    Send OTP via WhatsApp Business API.

    In development mode, only logs to console.
    In production mode, sends actual WhatsApp message via Graph API.

    Args:
        phone_number: Full phone number with country code (e.g. "917722036122")
        otp: The OTP code to send

    Returns:
        True if successful, False otherwise
    """
    if NOTIFICATION_MODE == "development":
        print(f"\n{'='*50}")
        print(f"[WHATSAPP] Development mode - Message would be sent to: {phone_number}")
        print(f"[WHATSAPP] OTP: {otp}")
        print(f"{'='*50}\n")
        return True

    try:
        url = f"https://graph.facebook.com/v22.0/{WHATSAPP_PHONE_NUMBER_ID}/messages"
        headers = {
            "Authorization": f"Bearer {WHATSAPP_API_TOKEN}",
            "Content-Type": "application/json",
        }
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone_number,
            "type": "template",
            "template": {
                "name": "template_with_contact_number",
                "language": {"code": "en_US"},
                "components": [
                    {
                        "type": "body",
                        "parameters": [
                            {"type": "text", "text": otp},
                            {"type": "text", "text": "verifying Shrota Audiobook app account"},
                            {"type": "text", "text": "10 Minutes"},
                            {"type": "text", "text": "+91-9422215658"},
                        ],
                    },
                ],
            },
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers, timeout=30)

        if response.status_code == 200:
            print(f"[WHATSAPP] OTP sent successfully to {phone_number}")
            return True
        else:
            print(f"[WHATSAPP] Failed to send OTP to {phone_number}: {response.status_code} {response.text}")
            return False

    except Exception as e:
        print(f"[WHATSAPP] Failed to send OTP to {phone_number}: {str(e)}")
        return False
