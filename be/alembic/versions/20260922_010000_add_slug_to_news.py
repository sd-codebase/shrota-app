"""Add slug column to news

Revision ID: 0012_news_slug
Revises: 0011_news
Create Date: 2026-09-22 01:00:00.000000

"""
import re
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '0012_news_slug'
down_revision: Union[str, None] = '0011_news'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _slugify(text: str) -> str:
    slug = text.strip().lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")
    return slug or "news"


def upgrade() -> None:
    op.add_column('news', sa.Column('slug', sa.String(350), nullable=True))

    conn = op.get_bind()
    rows = conn.execute(sa.text("SELECT id, title FROM news")).fetchall()

    seen: set[str] = set()
    for row in rows:
        base = _slugify(row.title)
        candidate = base
        suffix = 2
        while candidate in seen:
            candidate = f"{base}-{suffix}"
            suffix += 1
        seen.add(candidate)
        conn.execute(
            sa.text("UPDATE news SET slug = :slug WHERE id = :id"),
            {"slug": candidate, "id": row.id},
        )

    op.alter_column('news', 'slug', nullable=False)
    op.create_unique_constraint('uq_news_slug', 'news', ['slug'])
    op.create_index('ix_news_slug', 'news', ['slug'])


def downgrade() -> None:
    op.drop_index('ix_news_slug', table_name='news')
    op.drop_constraint('uq_news_slug', 'news', type_='unique')
    op.drop_column('news', 'slug')
