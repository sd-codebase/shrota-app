from datetime import datetime, timezone
from uuid import UUID
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Event
from models.admin import Admin
from schemas.event import EventCreate, EventUpdate, EventResponse
from utils.auth import get_current_admin

router = APIRouter(prefix="/events", tags=["Events"])


def event_to_response(event: Event) -> dict:
    return {
        "id": str(event.id),
        "title": event.title,
        "text": event.text,
        "cover_image": event.cover_image,
        "show_on_home": event.show_on_home,
        "is_active": event.is_active,
        "is_deleted": event.is_deleted,
        "created_at": event.created_at,
        "updated_at": event.updated_at,
    }


@router.get("", response_model=list[EventResponse])
async def get_events(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Event)
        .where(Event.is_deleted == False, Event.is_active == True)
        .order_by(Event.created_at.desc())
    )
    events = result.scalars().all()
    return [event_to_response(e) for e in events]


@router.get("/home", response_model=list[EventResponse])
async def get_home_events(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Event)
        .where(Event.is_deleted == False, Event.is_active == True, Event.show_on_home == True)
        .order_by(Event.created_at.desc())
    )
    events = result.scalars().all()
    return [event_to_response(e) for e in events]


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(event_id: str, db: AsyncSession = Depends(get_db)):
    try:
        uuid_id = UUID(event_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event ID")

    event = await db.get(Event, uuid_id)
    if not event or event.is_deleted:
        raise HTTPException(status_code=404, detail="Event not found")
    return event_to_response(event)


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event: EventCreate,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    new_event = Event(
        title=event.title,
        text=event.text,
        cover_image=event.cover_image,
        show_on_home=event.show_on_home,
        is_active=event.is_active,
    )
    db.add(new_event)
    await db.commit()
    await db.refresh(new_event)
    return event_to_response(new_event)


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    event: EventUpdate,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    try:
        uuid_id = UUID(event_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event ID")

    existing = await db.get(Event, uuid_id)
    if not existing or existing.is_deleted:
        raise HTTPException(status_code=404, detail="Event not found")

    update_data = event.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    for key, value in update_data.items():
        setattr(existing, key, value)
    existing.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(existing)
    return event_to_response(existing)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    try:
        uuid_id = UUID(event_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event ID")

    existing = await db.get(Event, uuid_id)
    if not existing or existing.is_deleted:
        raise HTTPException(status_code=404, detail="Event not found")

    existing.is_deleted = True
    existing.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return None
