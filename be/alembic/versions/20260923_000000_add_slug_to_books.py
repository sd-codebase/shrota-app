"""Add slug column to books

Revision ID: 0013_books_slug
Revises: 0012_news_slug
Create Date: 2026-09-23 00:00:00.000000

"""
import re
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '0013_books_slug'
down_revision: Union[str, None] = '0012_news_slug'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _slugify(text: str) -> str:
    slug = text.strip().lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")
    return slug or "book"


def upgrade() -> None:
    op.add_column('books', sa.Column('slug', sa.String(250), nullable=True))

    conn = op.get_bind()
    # Order deterministically so re-running against the same data is stable.
    rows = conn.execute(sa.text("SELECT id, title FROM books ORDER BY created_at, id")).fetchall()

    seen: set[str] = set()
    for row in rows:
        base = _slugify(row.title)
        candidate = base
        # Guarantee uniqueness even when multiple books share a title by
        # appending an incrementing, collision-checked suffix (-2, -3, ...).
        suffix = 2
        while candidate in seen:
            candidate = f"{base}-{suffix}"
            suffix += 1
        seen.add(candidate)
        conn.execute(
            sa.text("UPDATE books SET slug = :slug WHERE id = :id"),
            {"slug": candidate, "id": row.id},
        )

    op.alter_column('books', 'slug', nullable=False)
    op.create_unique_constraint('uq_books_slug', 'books', ['slug'])
    op.create_index('ix_books_slug', 'books', ['slug'])


def downgrade() -> None:
    op.drop_index('ix_books_slug', table_name='books')
    op.drop_constraint('uq_books_slug', 'books', type_='unique')
    op.drop_column('books', 'slug')
