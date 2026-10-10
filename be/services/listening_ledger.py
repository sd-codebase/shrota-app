"""
Maintains `book_listen_daily`, the royalty ledger.

Heartbeats are folded into the ledger as they arrive (see routes/activity.py),
and the whole thing can be rebuilt from the raw `activity_events` stream at any
time. That rebuild is what makes the ledger trustworthy enough to pay on: it is
derived data, so a bug here is repairable rather than a permanent hole in
somebody's royalty statement.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta
from typing import Iterable, Optional
from zoneinfo import ZoneInfo

from sqlalchemy import select, func, delete
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from config import ROYALTY_TIMEZONE
from models.activity import ActivityEvent, ActivitySession
from models.book import Book
from models.listening import BookListenDaily

HEARTBEAT_EVENT = "listen_heartbeat"

# A single heartbeat covers one save interval (10s) plus slack for a fast
# playback speed and a late flush. Anything beyond this is a device clock
# problem or a bad payload, and is clamped rather than trusted — one bogus
# event must not be able to distort a payout.
MAX_HEARTBEAT_SECONDS = 120

_TZ = ZoneInfo(ROYALTY_TIMEZONE)


def local_date(moment: datetime) -> date:
    """The payout calendar's date for an instant (see ROYALTY_TIMEZONE)."""
    if moment.tzinfo is None:
        # Stored naive values are UTC by convention everywhere in this app.
        moment = moment.replace(tzinfo=ZoneInfo("UTC"))
    return moment.astimezone(_TZ).date()


def _coerce_uuid(value) -> Optional[uuid.UUID]:
    if isinstance(value, uuid.UUID):
        return value
    try:
        return uuid.UUID(str(value))
    except (ValueError, AttributeError, TypeError):
        return None


def _coerce_seconds(value) -> int:
    try:
        seconds = int(float(value))
    except (TypeError, ValueError):
        return 0
    if seconds <= 0:
        return 0
    return min(seconds, MAX_HEARTBEAT_SECONDS)


class LedgerEntry:
    """One heartbeat, reduced to the fields the ledger keys on."""

    __slots__ = ("listen_date", "book_id", "chapter_index", "install_id", "user_id", "seconds")

    def __init__(self, listen_date, book_id, chapter_index, install_id, user_id, seconds):
        self.listen_date = listen_date
        self.book_id = book_id
        self.chapter_index = chapter_index
        self.install_id = install_id
        self.user_id = user_id
        self.seconds = seconds


def entry_from_event(
    params: Optional[dict],
    occurred_at: datetime,
    install_id: uuid.UUID,
    user_id: Optional[uuid.UUID],
) -> Optional[LedgerEntry]:
    """Turn one heartbeat's payload into a ledger entry, or None if unusable."""
    if not params:
        return None
    book_id = _coerce_uuid(params.get("book_id"))
    if book_id is None:
        return None
    seconds = _coerce_seconds(params.get("seconds"))
    if seconds == 0:
        return None
    try:
        chapter_index = max(0, int(params.get("chapter_index") or 0))
    except (TypeError, ValueError):
        chapter_index = 0
    return LedgerEntry(local_date(occurred_at), book_id, chapter_index, install_id, user_id, seconds)


async def apply_entries(db: AsyncSession, entries: Iterable[LedgerEntry]) -> int:
    """
    Add entries to the ledger, returning the seconds credited.

    Entries are summed per key before writing: Postgres refuses to let one
    statement update the same row twice, and a batch routinely carries several
    heartbeats for the same chapter on the same day.
    """
    totals: dict[tuple, LedgerEntry] = {}
    for entry in entries:
        key = (entry.listen_date, entry.book_id, entry.chapter_index, entry.install_id)
        existing = totals.get(key)
        if existing is None:
            totals[key] = LedgerEntry(
                entry.listen_date, entry.book_id, entry.chapter_index,
                entry.install_id, entry.user_id, entry.seconds,
            )
        else:
            existing.seconds += entry.seconds
            existing.user_id = existing.user_id or entry.user_id

    if not totals:
        return 0

    # A heartbeat naming a book that no longer exists would fail the whole
    # insert on its foreign key, taking the rest of the batch with it.
    book_ids = {entry.book_id for entry in totals.values()}
    known = set(
        (await db.execute(select(Book.id).where(Book.id.in_(book_ids)))).scalars().all()
    )

    rows = [
        {
            "id": uuid.uuid4(),
            "listen_date": entry.listen_date,
            "book_id": entry.book_id,
            "chapter_index": entry.chapter_index,
            "install_id": entry.install_id,
            "user_id": entry.user_id,
            "seconds_listened": entry.seconds,
        }
        for entry in totals.values()
        if entry.book_id in known
    ]
    if not rows:
        return 0

    stmt = pg_insert(BookListenDaily).values(rows)
    stmt = stmt.on_conflict_do_update(
        constraint="unique_listen_day_book_chapter_install",
        set_={
            # Accumulate: a day's listening arrives in many batches.
            "seconds_listened": BookListenDaily.seconds_listened + stmt.excluded.seconds_listened,
            # Never un-attribute a device that has since signed in.
            "user_id": func.coalesce(BookListenDaily.user_id, stmt.excluded.user_id),
            "updated_at": func.now(),
        },
    )
    await db.execute(stmt)
    return sum(row["seconds_listened"] for row in rows)


async def rebuild_ledger(
    db: AsyncSession,
    date_from: date,
    date_to: date,
) -> dict:
    """
    Recompute the ledger for a date range from the raw event stream.

    Idempotent: the range is cleared and rebuilt, so running it twice leaves
    the same numbers. Use it to backfill history, or to repair the ledger if
    live roll-up ever misses events.

    The range is given in payout-calendar dates; events are fetched with a
    day of slack on each side because the calendar is offset from UTC.
    """
    await db.execute(
        delete(BookListenDaily)
        .where(BookListenDaily.listen_date >= date_from)
        .where(BookListenDaily.listen_date <= date_to)
    )

    window_start = datetime.combine(date_from - timedelta(days=1), datetime.min.time(), tzinfo=ZoneInfo("UTC"))
    window_end = datetime.combine(date_to + timedelta(days=2), datetime.min.time(), tzinfo=ZoneInfo("UTC"))

    result = await db.execute(
        select(
            ActivityEvent.params,
            ActivityEvent.occurred_at,
            ActivitySession.install_id,
            func.coalesce(ActivityEvent.user_id, ActivitySession.user_id).label("user_id"),
        )
        .join(ActivitySession, ActivitySession.id == ActivityEvent.session_id)
        .where(ActivityEvent.event_name == HEARTBEAT_EVENT)
        .where(ActivityEvent.occurred_at >= window_start)
        .where(ActivityEvent.occurred_at < window_end)
    )

    entries = []
    events_read = 0
    for params, occurred_at, install_id, user_id in result.all():
        events_read += 1
        entry = entry_from_event(params, occurred_at, install_id, user_id)
        # Events just outside the payout range came along for the timezone
        # slack; drop them so the rebuilt range is exactly what was cleared.
        if entry and date_from <= entry.listen_date <= date_to:
            entries.append(entry)

    seconds = await apply_entries(db, entries)
    await db.commit()

    return {
        "date_from": date_from,
        "date_to": date_to,
        "events_read": events_read,
        "entries_written": len(entries),
        "seconds_credited": seconds,
    }
