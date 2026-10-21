"""Add genre slugs and slug redirects

Revision ID: 0024_genre_slug_redirects
Revises: 0023_feature_flags
Create Date: 2026-10-21 00:00:00.000000

"""
import re
import unicodedata
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0024_genre_slug_redirects'
down_revision: Union[str, None] = '0023_feature_flags'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or "category"


def upgrade() -> None:
    op.create_table(
        'slug_redirects',
        sa.Column('kind', sa.String(length=10), nullable=False),
        sa.Column('old_slug', sa.String(length=350), nullable=False),
        sa.Column('target_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('kind', 'old_slug'),
    )
    op.create_index('ix_slug_redirects_target_id', 'slug_redirects', ['target_id'])

    op.add_column('genres', sa.Column('slug', sa.String(120), nullable=True))
    conn = op.get_bind()
    rows = conn.execute(sa.text("SELECT id, name FROM genres ORDER BY created_at, id")).fetchall()
    seen: set[str] = set()
    for row in rows:
        base = _slugify(row.name)
        candidate = base
        suffix = 2
        while candidate in seen:
            candidate = f"{base}-{suffix}"
            suffix += 1
        seen.add(candidate)
        conn.execute(
            sa.text("UPDATE genres SET slug = :slug WHERE id = :id"),
            {"slug": candidate, "id": row.id},
        )
    op.alter_column('genres', 'slug', nullable=False)
    op.create_unique_constraint('uq_genres_slug', 'genres', ['slug'])
    op.create_index('ix_genres_slug', 'genres', ['slug'])


def downgrade() -> None:
    op.drop_index('ix_genres_slug', table_name='genres')
    op.drop_constraint('uq_genres_slug', 'genres', type_='unique')
    op.drop_column('genres', 'slug')
    op.drop_index('ix_slug_redirects_target_id', table_name='slug_redirects')
    op.drop_table('slug_redirects')
