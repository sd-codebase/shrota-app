from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models.admin import Admin
from models.notification import Notification
from schemas.notification import NotificationSend, NotificationResponse, NotificationSendResponse
from utils.auth import get_current_admin
from services.firebase_service import send_notification_to_all_users, ALL_USERS_TOPIC


router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.post("/send", response_model=NotificationSendResponse)
async def send_notification(
    notification_data: NotificationSend,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Send a push notification to all app users.
    Requires admin authentication.
    """
    # Create notification record
    notification = Notification(
        title=notification_data.title,
        body=notification_data.body,
        image_url=notification_data.image_url,
        book_id=notification_data.book_id,
        topic=ALL_USERS_TOPIC,
        status="pending"
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)

    # Build data payload for deep linking
    data = {}
    if notification_data.book_id:
        data["book_id"] = notification_data.book_id
        data["action"] = "open_book"
    else:
        data["action"] = "open_app"

    # Send via FCM
    result = await send_notification_to_all_users(
        title=notification_data.title,
        body=notification_data.body,
        image_url=notification_data.image_url,
        data=data
    )

    # Update notification record with result
    if result.get("success"):
        notification.status = "sent"
        notification.fcm_message_id = result.get("message_id")
        message = "Notification sent successfully"
    else:
        notification.status = "failed"
        notification.error_message = result.get("error", "Unknown error")
        message = f"Failed to send notification: {notification.error_message}"

    await db.commit()
    await db.refresh(notification)

    return NotificationSendResponse(
        success=result.get("success", False),
        notification=NotificationResponse(
            id=str(notification.id),
            title=notification.title,
            body=notification.body,
            image_url=notification.image_url,
            book_id=str(notification.book_id) if notification.book_id else None,
            topic=notification.topic,
            fcm_message_id=notification.fcm_message_id,
            status=notification.status,
            error_message=notification.error_message,
            created_at=notification.created_at,
            updated_at=notification.updated_at,
        ),
        message=message
    )


@router.get("", response_model=list[NotificationResponse])
async def list_notifications(
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 50
):
    """
    List all sent notifications.
    Requires admin authentication.
    """
    result = await db.execute(
        select(Notification)
        .order_by(Notification.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    notifications = result.scalars().all()

    return [
        NotificationResponse(
            id=str(n.id),
            title=n.title,
            body=n.body,
            image_url=n.image_url,
            book_id=str(n.book_id) if n.book_id else None,
            topic=n.topic,
            fcm_message_id=n.fcm_message_id,
            status=n.status,
            error_message=n.error_message,
            created_at=n.created_at,
            updated_at=n.updated_at,
        )
        for n in notifications
    ]


@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: str,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific notification by ID.
    Requires admin authentication.
    """
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id)
    )
    notification = result.scalar_one_or_none()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    return NotificationResponse(
        id=str(notification.id),
        title=notification.title,
        body=notification.body,
        image_url=notification.image_url,
        book_id=str(notification.book_id) if notification.book_id else None,
        topic=notification.topic,
        fcm_message_id=notification.fcm_message_id,
        status=notification.status,
        error_message=notification.error_message,
        created_at=notification.created_at,
        updated_at=notification.updated_at,
    )
