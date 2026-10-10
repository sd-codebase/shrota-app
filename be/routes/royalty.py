"""
Royalty reporting over the listening ledger.

Everything here reads `book_listen_daily`, which records seconds of audio
actually played per day and never rewrites them — so a half-yearly report is
answerable long after the fact, which is what the Book Insights page cannot do.

Two views of the same data:

* `/royalty/report` — live, recomputed on every call. Use it to see where a
  period is heading.
* `/royalty/snapshots` — a period frozen at payout time. Late events and
  retitled books cannot move the numbers afterwards, so the statement sent to
  an author can always be reproduced exactly.

Full Admins only: this is the money view, and a publisher must not see other
publishers' earnings.
"""

from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, distinct
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from config import ROYALTY_TIMEZONE
from database import get_db
from models.admin import Admin
from models.author import Author
from models.book import Book, book_authors
from models.listening import BookListenDaily, RoyaltySnapshot, RoyaltySnapshotLine
from schemas.royalty import (
    LedgerRebuildResponse,
    RoyaltyAuthorLine,
    RoyaltyBookLine,
    RoyaltyReport,
    RoyaltySnapshotCreate,
    RoyaltySnapshotDetail,
    RoyaltySnapshotLineResponse,
    RoyaltySnapshotResponse,
)
from services.listening_ledger import rebuild_ledger
from utils.auth import require_full_admin

router = APIRouter(prefix="/royalty", tags=["Royalty"])


def _hours(seconds: int) -> float:
    return round(seconds / 3600, 2)


async def _book_totals(
    db: AsyncSession,
    date_from: date,
    date_to: date,
    include_guests: bool,
):
    """Per-book listening for a period, straight off the ledger."""
    query = (
        select(
            BookListenDaily.book_id,
            func.sum(BookListenDaily.seconds_listened).label("seconds"),
            func.count(distinct(BookListenDaily.user_id)).label("listeners"),
            func.count(distinct(BookListenDaily.install_id)).label("devices"),
        )
        .where(BookListenDaily.listen_date >= date_from)
        .where(BookListenDaily.listen_date <= date_to)
        .group_by(BookListenDaily.book_id)
    )
    if not include_guests:
        query = query.where(BookListenDaily.user_id.isnot(None))
    return (await db.execute(query)).all()


async def _books_by_id(db: AsyncSession, book_ids: list[UUID]) -> dict[UUID, Book]:
    if not book_ids:
        return {}
    books = (
        await db.execute(
            select(Book)
            .where(Book.id.in_(book_ids))
            .options(selectinload(Book.authors), selectinload(Book.publisher))
        )
    ).scalars().unique().all()
    return {book.id: book for book in books}


@router.get("/report", response_model=RoyaltyReport)
async def get_royalty_report(
    date_from: date = Query(..., description="First day of the period, in the payout calendar"),
    date_to: date = Query(..., description="Last day of the period, inclusive"),
    include_guests: bool = Query(True, description="Count listening from devices that never signed in"),
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    """
    Listening for a period, by book and by author.

    A book's seconds are split equally between its authors — with no agreed
    split per contract, an equal share is the only defensible default, and
    double-counting a co-authored book would inflate the payout pool.
    """
    if date_to < date_from:
        raise HTTPException(status_code=400, detail="date_to must not be before date_from")

    totals = await _book_totals(db, date_from, date_to, include_guests)
    books = await _books_by_id(db, [row.book_id for row in totals])

    total_seconds = sum(int(row.seconds or 0) for row in totals)

    book_lines: list[RoyaltyBookLine] = []
    author_totals: dict[Optional[str], dict] = {}

    for row in totals:
        seconds = int(row.seconds or 0)
        book = books.get(row.book_id)
        author_names = [a.name for a in book.authors] if book else []

        book_lines.append(
            RoyaltyBookLine(
                book_id=str(row.book_id),
                # A ledger row can outlive its book only if the book was
                # hard-deleted; soft-deleted books still resolve.
                book_title=book.title if book else "(deleted book)",
                author_names=author_names,
                publisher_name=book.publisher.name if book and book.publisher else None,
                seconds_listened=seconds,
                hours_listened=_hours(seconds),
                unique_listeners=int(row.listeners or 0),
                unique_devices=int(row.devices or 0),
                share_percentage=round(seconds / total_seconds * 100, 4) if total_seconds else 0.0,
            )
        )

        if book and book.authors:
            share = seconds / len(book.authors)
            for author in book.authors:
                bucket = author_totals.setdefault(
                    str(author.id),
                    {"name": author.name, "seconds": 0.0, "books": set(), "listeners": 0},
                )
                bucket["seconds"] += share
                bucket["books"].add(row.book_id)
                bucket["listeners"] += int(row.listeners or 0)
        else:
            bucket = author_totals.setdefault(
                None, {"name": "(no author on record)", "seconds": 0.0, "books": set(), "listeners": 0}
            )
            bucket["seconds"] += seconds
            bucket["books"].add(row.book_id)
            bucket["listeners"] += int(row.listeners or 0)

    author_lines = [
        RoyaltyAuthorLine(
            author_id=author_id,
            author_name=bucket["name"],
            books=len(bucket["books"]),
            seconds_listened=int(round(bucket["seconds"])),
            hours_listened=_hours(bucket["seconds"]),
            # Listener counts are per book, so an author's figure double-counts
            # anyone who heard two of their books. Treated as reach, not a
            # headcount — the payable number is the share.
            unique_listeners=bucket["listeners"],
            share_percentage=round(bucket["seconds"] / total_seconds * 100, 4) if total_seconds else 0.0,
        )
        for author_id, bucket in author_totals.items()
    ]

    book_lines.sort(key=lambda line: line.seconds_listened, reverse=True)
    author_lines.sort(key=lambda line: line.seconds_listened, reverse=True)

    period_query = (
        select(
            func.count(distinct(BookListenDaily.user_id)),
            func.count(distinct(BookListenDaily.install_id)),
        )
        .where(BookListenDaily.listen_date >= date_from)
        .where(BookListenDaily.listen_date <= date_to)
    )
    if not include_guests:
        period_query = period_query.where(BookListenDaily.user_id.isnot(None))
    total_listeners, total_devices = (await db.execute(period_query)).one()

    return RoyaltyReport(
        date_from=date_from,
        date_to=date_to,
        include_guests=include_guests,
        timezone=ROYALTY_TIMEZONE,
        total_seconds=total_seconds,
        total_hours=_hours(total_seconds),
        total_listeners=int(total_listeners or 0),
        total_devices=int(total_devices or 0),
        books=book_lines,
        authors=author_lines,
    )


def _snapshot_response(snapshot: RoyaltySnapshot, line_count: int) -> RoyaltySnapshotResponse:
    return RoyaltySnapshotResponse(
        id=str(snapshot.id),
        label=snapshot.label,
        period_start=snapshot.period_start,
        period_end=snapshot.period_end,
        include_guests=snapshot.include_guests,
        total_seconds=snapshot.total_seconds,
        total_hours=_hours(snapshot.total_seconds),
        notes=snapshot.notes,
        generated_at=snapshot.generated_at,
        generated_by_name=snapshot.generated_by_name,
        line_count=line_count,
    )


@router.post("/snapshots", response_model=RoyaltySnapshotDetail, status_code=201)
async def create_royalty_snapshot(
    payload: RoyaltySnapshotCreate,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    """Freeze a payout period: the figures are copied in and never recomputed."""
    totals = await _book_totals(db, payload.period_start, payload.period_end, payload.include_guests)
    books = await _books_by_id(db, [row.book_id for row in totals])
    total_seconds = sum(int(row.seconds or 0) for row in totals)

    snapshot = RoyaltySnapshot(
        label=payload.label,
        period_start=payload.period_start,
        period_end=payload.period_end,
        include_guests=payload.include_guests,
        total_seconds=total_seconds,
        notes=payload.notes,
        generated_by_admin_id=admin.id,
        # Copied, so the statement still names its author after the account
        # is renamed or removed.
        generated_by_name=admin.name,
    )
    db.add(snapshot)
    await db.flush()

    for row in totals:
        seconds = int(row.seconds or 0)
        book = books.get(row.book_id)
        db.add(
            RoyaltySnapshotLine(
                snapshot_id=snapshot.id,
                book_id=row.book_id,
                book_title=book.title if book else "(deleted book)",
                author_names=", ".join(a.name for a in book.authors) if book and book.authors else "",
                publisher_name=book.publisher.name if book and book.publisher else None,
                seconds_listened=seconds,
                unique_listeners=int(row.listeners or 0),
                unique_devices=int(row.devices or 0),
                share_percentage=Decimal(str(round(seconds / total_seconds * 100, 4))) if total_seconds else Decimal("0"),
            )
        )

    await db.commit()
    return await get_royalty_snapshot(str(snapshot.id), db, admin)


@router.get("/snapshots", response_model=list[RoyaltySnapshotResponse])
async def list_royalty_snapshots(
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    """Every frozen period, newest first."""
    rows = (
        await db.execute(
            select(RoyaltySnapshot, func.count(RoyaltySnapshotLine.id))
            .outerjoin(RoyaltySnapshotLine, RoyaltySnapshotLine.snapshot_id == RoyaltySnapshot.id)
            .group_by(RoyaltySnapshot.id)
            .order_by(RoyaltySnapshot.period_start.desc(), RoyaltySnapshot.generated_at.desc())
        )
    ).all()
    return [_snapshot_response(snapshot, count) for snapshot, count in rows]


@router.get("/snapshots/{snapshot_id}", response_model=RoyaltySnapshotDetail)
async def get_royalty_snapshot(
    snapshot_id: str,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    """One frozen period, with its per-book lines."""
    try:
        snapshot_uuid = UUID(snapshot_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid snapshot ID")

    snapshot = (
        await db.execute(
            select(RoyaltySnapshot)
            .where(RoyaltySnapshot.id == snapshot_uuid)
            .options(selectinload(RoyaltySnapshot.lines))
        )
    ).scalars().one_or_none()
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")

    base = _snapshot_response(snapshot, len(snapshot.lines))
    return RoyaltySnapshotDetail(
        **base.model_dump(),
        lines=[
            RoyaltySnapshotLineResponse(
                book_id=str(line.book_id) if line.book_id else None,
                book_title=line.book_title,
                author_names=line.author_names,
                publisher_name=line.publisher_name,
                seconds_listened=line.seconds_listened,
                hours_listened=_hours(line.seconds_listened),
                unique_listeners=line.unique_listeners,
                unique_devices=line.unique_devices,
                share_percentage=float(line.share_percentage),
            )
            for line in snapshot.lines
        ],
    )


@router.delete("/snapshots/{snapshot_id}", status_code=204)
async def delete_royalty_snapshot(
    snapshot_id: str,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    """Discard a frozen period — for a snapshot taken by mistake."""
    try:
        snapshot_uuid = UUID(snapshot_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid snapshot ID")

    snapshot = await db.get(RoyaltySnapshot, snapshot_uuid)
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")

    await db.delete(snapshot)
    await db.commit()


@router.post("/ledger/rebuild", response_model=LedgerRebuildResponse)
async def rebuild_listening_ledger(
    date_from: date = Query(...),
    date_to: date = Query(...),
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(require_full_admin),
):
    """
    Recompute the ledger for a date range from the raw event stream.

    Idempotent, and the reason the ledger can be trusted: it is derived data,
    so a missed roll-up is repairable. Frozen snapshots are untouched — that is
    the point of freezing them — so re-freeze a period if its numbers change.
    """
    if date_to < date_from:
        raise HTTPException(status_code=400, detail="date_to must not be before date_from")

    result = await rebuild_ledger(db, date_from, date_to)
    return LedgerRebuildResponse(**result)
