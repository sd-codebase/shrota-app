"""
Admin-side listening insights.

Answers, per audiobook: how many people listened, how many liked it, how
far they got, and where the unfinished ones stopped.

Two independent sources are reported side by side, because neither alone
tells the whole story:

* `user_book_progress` — one row per signed-in user per book, holding
  their furthest position. Accurate about *who* and *how far*, but only
  for signed-in users (the app syncs progress only when a token exists)
  and it keeps no history: the row is overwritten, so a date filter on it
  means "last played in this window", not "listened this much in it".
* `activity_events` — the timestamped event stream, which includes
  guests (attributed by device install id). Honest about reach and about
  *when*, but counts devices rather than people.

Deliberately read-only and derived: no new tables, no writes. Royalty
reporting needs an append-only listening ledger before these numbers can
carry money — see the Phase 2 note in the admin UI.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, distinct, and_, literal_column
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models.activity import ActivityEvent, ActivitySession
from models.admin import Admin
from models.book import Book, Chapter, book_authors, book_genres
from models.user import User
from models.user_activity import UserBookProgress, UserLikedBook
from schemas.insights import (
    BookInsight,
    BookInsightDetail,
    BookInsightListResponse,
    BookListenerRow,
    ChapterInsight,
    InsightsSummary,
)
from utils.auth import get_current_admin

router = APIRouter(prefix="/insights", tags=["Book Insights"])

SORT_FIELDS = {
    "listeners",
    "likes",
    "completion_rate",
    "listened_seconds",
    "avg_progress_percentage",
    "unique_players",
    "last_played_at",
    "title",
}

# A book counts as "started" for drop-off purposes only past this much, so
# a user who opened the player for a few seconds isn't reported as having
# abandoned the book at chapter 1.
MIN_STARTED_PERCENTAGE = 1.0


def _visible_books_query(admin: Admin):
    """Books the caller may see: publishers are limited to their own."""
    query = select(Book).where(Book.is_deleted == False)  # noqa: E712
    if admin.role == "publisher":
        query = query.where(Book.owner_admin_id == admin.id)
    return query


def _ids_csv(value: Optional[str]) -> list[UUID]:
    if not value:
        return []
    out = []
    for raw in value.split(","):
        raw = raw.strip()
        if not raw:
            continue
        try:
            out.append(UUID(raw))
        except ValueError:
            continue  # Invalid ids are ignored, matching routes/books.py
    return out


def _book_event_counts(
    event_name: str,
    book_ids: list[UUID],
    date_from: Optional[datetime],
    date_to: Optional[datetime],
):
    """
    Distinct devices that logged `event_name` for each book.

    Devices, not users: the activity stream starts logging before anyone
    signs in, so this is the only place guest listening is visible.
    """
    book_id_param = ActivityEvent.params["book_id"].astext
    query = (
        select(
            book_id_param.label("book_id"),
            func.count(distinct(ActivitySession.install_id)).label("devices"),
            func.count(ActivityEvent.id).label("events"),
        )
        .join(ActivitySession, ActivitySession.id == ActivityEvent.session_id)
        .where(ActivityEvent.event_name == event_name)
        .where(book_id_param.in_([str(b) for b in book_ids]))
        # Ordinal: `GROUP BY params ->> $n` would not match the select
        # list, whose key is a separate bind parameter.
        .group_by(literal_column("1"))
    )
    if date_from:
        query = query.where(ActivityEvent.occurred_at >= date_from)
    if date_to:
        query = query.where(ActivityEvent.occurred_at <= date_to)
    return query


@router.get("/summary", response_model=InsightsSummary)
async def get_insights_summary(
    date_from: Optional[datetime] = Query(None, description="Lower bound on last_played_at / liked_at / occurred_at"),
    date_to: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """Top-line listening numbers for the books the caller can see."""
    visible = _visible_books_query(admin).with_only_columns(Book.id).subquery()
    visible_ids = select(visible.c.id)

    books_total = await db.scalar(select(func.count()).select_from(visible)) or 0
    books_published = await db.scalar(
        select(func.count()).select_from(
            _visible_books_query(admin).where(Book.is_published == True).subquery()  # noqa: E712
        )
    ) or 0

    progress_filters = [UserBookProgress.book_id.in_(visible_ids)]
    if date_from:
        progress_filters.append(UserBookProgress.last_played_at >= date_from)
    if date_to:
        progress_filters.append(UserBookProgress.last_played_at <= date_to)

    listeners_total = await db.scalar(
        select(func.count(distinct(UserBookProgress.user_id))).where(and_(*progress_filters))
    ) or 0
    listened_seconds = await db.scalar(
        select(func.coalesce(func.sum(UserBookProgress.total_listened_seconds), 0)).where(and_(*progress_filters))
    ) or 0
    books_completed = await db.scalar(
        select(func.count()).where(and_(*progress_filters, UserBookProgress.is_completed == True))  # noqa: E712
    ) or 0

    like_filters = [UserLikedBook.book_id.in_(visible_ids)]
    if date_from:
        like_filters.append(UserLikedBook.liked_at >= date_from)
    if date_to:
        like_filters.append(UserLikedBook.liked_at <= date_to)
    likes_total = await db.scalar(select(func.count()).where(and_(*like_filters))) or 0

    device_filters = []
    if date_from:
        device_filters.append(ActivitySession.started_at >= date_from)
    if date_to:
        device_filters.append(ActivitySession.started_at <= date_to)
    unique_devices_query = select(func.count(distinct(ActivitySession.install_id)))
    if device_filters:
        unique_devices_query = unique_devices_query.where(and_(*device_filters))
    # Device reach is app-wide, so it is only meaningful for a full Admin.
    unique_devices = 0 if admin.role == "publisher" else (await db.scalar(unique_devices_query) or 0)

    return InsightsSummary(
        books_total=books_total,
        books_published=books_published,
        listeners_total=listeners_total,
        likes_total=likes_total,
        listened_hours=round(listened_seconds / 3600, 1),
        books_completed=books_completed,
        unique_devices=unique_devices,
    )


async def _build_insights(
    db: AsyncSession,
    books: list[Book],
    date_from: Optional[datetime],
    date_to: Optional[datetime],
) -> dict[UUID, BookInsight]:
    """Assemble per-book metrics for an already-fetched, already-scoped set."""
    book_ids = [b.id for b in books]
    if not book_ids:
        return {}

    progress_filters = [UserBookProgress.book_id.in_(book_ids)]
    if date_from:
        progress_filters.append(UserBookProgress.last_played_at >= date_from)
    if date_to:
        progress_filters.append(UserBookProgress.last_played_at <= date_to)

    progress_rows = (
        await db.execute(
            select(
                UserBookProgress.book_id,
                func.count(distinct(UserBookProgress.user_id)).label("listeners"),
                func.count(UserBookProgress.id).filter(UserBookProgress.is_completed == True).label("completed"),  # noqa: E712
                func.coalesce(func.avg(UserBookProgress.progress_percentage), 0).label("avg_progress"),
                func.coalesce(func.avg(UserBookProgress.current_chapter_index), 0).label("avg_chapter"),
                func.coalesce(func.sum(UserBookProgress.total_listened_seconds), 0).label("listened_seconds"),
                func.max(UserBookProgress.last_played_at).label("last_played_at"),
            )
            .where(and_(*progress_filters))
            .group_by(UserBookProgress.book_id)
        )
    ).all()
    progress_by_book = {row.book_id: row for row in progress_rows}

    # Drop-off: among listeners who started but never finished, which
    # chapter holds the most of them.
    dropoff_rows = (
        await db.execute(
            select(
                UserBookProgress.book_id,
                UserBookProgress.current_chapter_index,
                func.count(UserBookProgress.id).label("stuck"),
            )
            .where(and_(*progress_filters))
            .where(UserBookProgress.is_completed == False)  # noqa: E712
            .where(UserBookProgress.progress_percentage >= MIN_STARTED_PERCENTAGE)
            .group_by(UserBookProgress.book_id, UserBookProgress.current_chapter_index)
        )
    ).all()
    dropoff_by_book: dict[UUID, tuple[int, int]] = {}
    for row in dropoff_rows:
        current = dropoff_by_book.get(row.book_id)
        # Ties go to the earlier chapter — the earliest place that many
        # listeners stop is the more actionable one.
        if current is None or row.stuck > current[1] or (row.stuck == current[1] and row.current_chapter_index < current[0]):
            dropoff_by_book[row.book_id] = (row.current_chapter_index, row.stuck)

    like_filters = [UserLikedBook.book_id.in_(book_ids)]
    if date_from:
        like_filters.append(UserLikedBook.liked_at >= date_from)
    if date_to:
        like_filters.append(UserLikedBook.liked_at <= date_to)
    like_rows = (
        await db.execute(
            select(UserLikedBook.book_id, func.count(UserLikedBook.id).label("likes"))
            .where(and_(*like_filters))
            .group_by(UserLikedBook.book_id)
        )
    ).all()
    likes_by_book = {row.book_id: row.likes for row in like_rows}

    viewer_rows = (await db.execute(_book_event_counts("book_viewed", book_ids, date_from, date_to))).all()
    viewers_by_book = {row.book_id: row.devices for row in viewer_rows}
    player_rows = (await db.execute(_book_event_counts("playback_started", book_ids, date_from, date_to))).all()
    players_by_book = {row.book_id: row.devices for row in player_rows}

    insights: dict[UUID, BookInsight] = {}
    for book in books:
        progress = progress_by_book.get(book.id)
        listeners = int(progress.listeners) if progress else 0
        completed = int(progress.completed) if progress else 0
        dropoff = dropoff_by_book.get(book.id)
        unique_viewers = int(viewers_by_book.get(str(book.id), 0))
        unique_players = int(players_by_book.get(str(book.id), 0))

        insights[book.id] = BookInsight(
            book_id=str(book.id),
            title=book.title,
            thumbnail=book.thumbnail,
            is_published=book.is_published,
            access_type=book.access_type,
            language=book.language.name if book.language else None,
            authors=[a.name for a in book.authors],
            genres=[g.name for g in book.genres],
            chapters_total=len([c for c in book.chapters if not c.is_deleted]),
            total_duration=book.total_duration,
            listeners=listeners,
            completed_listeners=completed,
            completion_rate=round(completed / listeners * 100, 1) if listeners else 0.0,
            avg_progress_percentage=round(float(progress.avg_progress), 1) if progress else 0.0,
            # Stored 0-based; reported as "chapters reached" so 1 means the
            # first chapter.
            avg_chapter_reached=round(float(progress.avg_chapter) + 1, 1) if progress else 0.0,
            listened_seconds=int(progress.listened_seconds) if progress else 0,
            last_played_at=progress.last_played_at if progress else None,
            dropoff_chapter_index=dropoff[0] if dropoff else None,
            dropoff_listeners=dropoff[1] if dropoff else 0,
            likes=int(likes_by_book.get(book.id, 0)),
            unique_viewers=unique_viewers,
            unique_players=unique_players,
            view_to_play_rate=round(unique_players / unique_viewers * 100, 1) if unique_viewers else 0.0,
        )
    return insights


@router.get("/books", response_model=BookInsightListResponse)
async def get_book_insights(
    search: Optional[str] = Query(None, description="Search books by title"),
    language_ids: Optional[str] = Query(None, description="Comma-separated language IDs"),
    genre_ids: Optional[str] = Query(None, description="Comma-separated genre IDs"),
    author_ids: Optional[str] = Query(None, description="Comma-separated author IDs"),
    is_published: Optional[bool] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    sort_by: str = Query("listeners"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    limit: int = Query(25, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """
    Per-book listening metrics, one row per book.

    Metrics are computed over every matching book and then sorted and
    paged, so the ordering is across the whole filtered catalogue rather
    than within a page.
    """
    if sort_by not in SORT_FIELDS:
        raise HTTPException(status_code=400, detail=f"sort_by must be one of: {', '.join(sorted(SORT_FIELDS))}")

    query = _visible_books_query(admin).options(
        selectinload(Book.authors),
        selectinload(Book.genres),
        selectinload(Book.chapters),
        selectinload(Book.language),
    )

    if search:
        query = query.where(Book.title.ilike(f"%{search}%"))
    if is_published is not None:
        query = query.where(Book.is_published == is_published)

    language_uuids = _ids_csv(language_ids)
    if language_uuids:
        query = query.where(Book.language_id.in_(language_uuids))

    genre_uuids = _ids_csv(genre_ids)
    if genre_uuids:
        query = query.where(
            Book.id.in_(select(book_genres.c.book_id).where(book_genres.c.genre_id.in_(genre_uuids)))
        )

    author_uuids = _ids_csv(author_ids)
    if author_uuids:
        query = query.where(
            Book.id.in_(select(book_authors.c.book_id).where(book_authors.c.author_id.in_(author_uuids)))
        )

    books = (await db.execute(query)).scalars().unique().all()
    insights = await _build_insights(db, list(books), date_from, date_to)

    rows = list(insights.values())
    reverse = order == "desc"
    if sort_by == "last_played_at":
        # Books nobody has played carry no date; they go to the end in
        # both directions instead of crowding out the ascending page.
        played = [r for r in rows if r.last_played_at is not None]
        never_played = [r for r in rows if r.last_played_at is None]
        played.sort(key=lambda r: r.last_played_at, reverse=reverse)
        rows = played + never_played
    elif sort_by == "title":
        rows.sort(key=lambda r: r.title.lower(), reverse=reverse)
    else:
        rows.sort(key=lambda r: getattr(r, sort_by), reverse=reverse)

    return BookInsightListResponse(
        books=rows[offset : offset + limit],
        total=len(rows),
        limit=limit,
        offset=offset,
    )


@router.get("/books/{book_id}", response_model=BookInsightDetail)
async def get_book_insight_detail(
    book_id: str,
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    listeners_limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """Chapter-by-chapter drop-off and the most recent listeners for one book."""
    try:
        book_uuid = UUID(book_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid book ID")

    book = (
        await db.execute(
            _visible_books_query(admin)
            .where(Book.id == book_uuid)
            .options(
                selectinload(Book.authors),
                selectinload(Book.genres),
                selectinload(Book.chapters),
                selectinload(Book.language),
            )
        )
    ).scalars().unique().one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    insights = await _build_insights(db, [book], date_from, date_to)
    base = insights[book.id]

    progress_filters = [UserBookProgress.book_id == book_uuid]
    if date_from:
        progress_filters.append(UserBookProgress.last_played_at >= date_from)
    if date_to:
        progress_filters.append(UserBookProgress.last_played_at <= date_to)

    # How many listeners got at least as far as each chapter — the shape of
    # this list is the drop-off curve.
    reached_rows = (
        await db.execute(
            select(
                UserBookProgress.current_chapter_index,
                func.count(UserBookProgress.id).label("listeners"),
            )
            .where(and_(*progress_filters))
            .group_by(UserBookProgress.current_chapter_index)
        )
    ).all()
    reached_at_or_past = {int(r.current_chapter_index): int(r.listeners) for r in reached_rows}

    chapter_completion_query = (
        select(
            ActivityEvent.params["chapter_index"].astext.label("chapter_index"),
            func.count(ActivityEvent.id).label("completions"),
        )
        .where(ActivityEvent.event_name == "chapter_completed")
        .where(ActivityEvent.params["book_id"].astext == str(book_uuid))
        .group_by(literal_column("1"))
    )
    if date_from:
        chapter_completion_query = chapter_completion_query.where(ActivityEvent.occurred_at >= date_from)
    if date_to:
        chapter_completion_query = chapter_completion_query.where(ActivityEvent.occurred_at <= date_to)
    completions_by_index: dict[int, int] = {}
    for row in (await db.execute(chapter_completion_query)).all():
        try:
            completions_by_index[int(row.chapter_index)] = int(row.completions)
        except (TypeError, ValueError):
            continue  # Event logged without a usable chapter_index

    chapters: list[ChapterInsight] = []
    live_chapters = sorted(
        [c for c in book.chapters if not c.is_deleted], key=lambda c: c.order
    )
    for position, chapter in enumerate(live_chapters):
        chapters.append(
            ChapterInsight(
                chapter_id=str(chapter.id),
                order=chapter.order,
                title=chapter.title,
                duration=chapter.duration,
                listeners_reached=sum(
                    count for index, count in reached_at_or_past.items() if index >= position
                ),
                completions=completions_by_index.get(position, 0),
            )
        )

    listener_rows = (
        await db.execute(
            select(UserBookProgress, User)
            .join(User, User.id == UserBookProgress.user_id)
            .where(and_(*progress_filters))
            .order_by(UserBookProgress.last_played_at.desc())
            .limit(listeners_limit)
        )
    ).all()
    recent_listeners = [
        BookListenerRow(
            user_id=str(progress.user_id),
            name=user.name,
            whatsapp_number=user.whatsapp_number,
            current_chapter_index=progress.current_chapter_index,
            progress_percentage=round(progress.progress_percentage, 1),
            total_listened_seconds=progress.total_listened_seconds,
            is_completed=progress.is_completed,
            last_played_at=progress.last_played_at,
        )
        for progress, user in listener_rows
    ]

    source_query = (
        select(
            ActivityEvent.params["source"].astext.label("source"),
            func.count(ActivityEvent.id).label("views"),
        )
        .where(ActivityEvent.event_name == "book_viewed")
        .where(ActivityEvent.params["book_id"].astext == str(book_uuid))
        .group_by(literal_column("1"))
    )
    if date_from:
        source_query = source_query.where(ActivityEvent.occurred_at >= date_from)
    if date_to:
        source_query = source_query.where(ActivityEvent.occurred_at <= date_to)
    view_sources = {
        (row.source or "unknown"): int(row.views) for row in (await db.execute(source_query)).all()
    }

    return BookInsightDetail(
        **base.model_dump(),
        chapters=chapters,
        recent_listeners=recent_listeners,
        view_sources=view_sources,
    )
