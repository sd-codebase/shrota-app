import os
from typing import Optional
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, messaging

from config import FIREBASE_CREDENTIALS_PATH, NOTIFICATION_MODE

# Topic for broadcasting to all users
ALL_USERS_TOPIC = "all_users"

# Firebase app instance
_firebase_app: Optional[firebase_admin.App] = None


def initialize_firebase() -> bool:
    """
    Initialize Firebase Admin SDK.

    Returns:
        True if initialization successful, False otherwise
    """
    global _firebase_app

    if _firebase_app is not None:
        return True

    cred_path = Path(FIREBASE_CREDENTIALS_PATH)

    if not cred_path.exists():
        print(f"[FIREBASE] Credentials file not found: {cred_path}")
        print("[FIREBASE] Push notifications will be disabled")
        return False

    try:
        cred = credentials.Certificate(str(cred_path))
        _firebase_app = firebase_admin.initialize_app(cred)
        print("[FIREBASE] Initialized successfully")
        return True
    except Exception as e:
        print(f"[FIREBASE] Failed to initialize: {e}")
        return False


def is_firebase_initialized() -> bool:
    """Check if Firebase is initialized."""
    return _firebase_app is not None


async def send_notification_to_topic(
    title: str,
    body: str,
    topic: str = ALL_USERS_TOPIC,
    image_url: Optional[str] = None,
    data: Optional[dict] = None
) -> dict:
    """
    Send a push notification to all subscribers of a topic.

    Args:
        title: Notification title
        body: Notification body text
        topic: FCM topic name (default: all_users)
        image_url: Optional URL for notification image
        data: Optional custom data payload

    Returns:
        Dictionary with success status and message_id or error
    """
    if NOTIFICATION_MODE == "development":
        print(f"\n{'='*50}")
        print(f"[FIREBASE] Development mode - Notification would be sent")
        print(f"[FIREBASE] Topic: {topic}")
        print(f"[FIREBASE] Title: {title}")
        print(f"[FIREBASE] Body: {body}")
        if image_url:
            print(f"[FIREBASE] Image: {image_url}")
        if data:
            print(f"[FIREBASE] Data: {data}")
        print(f"{'='*50}\n")
        return {
            "success": True,
            "message_id": "dev-mode-mock-id",
            "mode": "development"
        }

    if not is_firebase_initialized():
        if not initialize_firebase():
            return {
                "success": False,
                "error": "Firebase not initialized. Check credentials file."
            }

    try:
        # Build notification
        notification = messaging.Notification(
            title=title,
            body=body,
            image=image_url
        )

        # Build Android-specific config
        android_config = messaging.AndroidConfig(
            priority="high",
            notification=messaging.AndroidNotification(
                icon="ic_notification",
                color="#FF6B35",  # Shrota brand orange
                sound="default"
            )
        )

        # Build iOS-specific config
        apns_config = messaging.APNSConfig(
            payload=messaging.APNSPayload(
                aps=messaging.Aps(
                    sound="default",
                    badge=1
                )
            )
        )

        # Build the message
        message = messaging.Message(
            notification=notification,
            android=android_config,
            apns=apns_config,
            topic=topic,
            data=data or {}
        )

        # Send the message
        response = messaging.send(message)

        print(f"[FIREBASE] Notification sent successfully: {response}")
        return {
            "success": True,
            "message_id": response
        }

    except messaging.UnregisteredError:
        print("[FIREBASE] Topic has no subscribers")
        return {
            "success": False,
            "error": "No subscribers for this topic"
        }
    except Exception as e:
        print(f"[FIREBASE] Failed to send notification: {e}")
        return {
            "success": False,
            "error": str(e)
        }


async def send_notification_to_all_users(
    title: str,
    body: str,
    image_url: Optional[str] = None,
    data: Optional[dict] = None
) -> dict:
    """
    Convenience function to send notification to all app users.

    Args:
        title: Notification title
        body: Notification body text
        image_url: Optional URL for notification image
        data: Optional custom data payload

    Returns:
        Dictionary with success status and message_id or error
    """
    return await send_notification_to_topic(
        title=title,
        body=body,
        topic=ALL_USERS_TOPIC,
        image_url=image_url,
        data=data
    )
