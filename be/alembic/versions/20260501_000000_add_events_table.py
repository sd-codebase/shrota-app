"""Add events table

Revision ID: 0009_events
Revises: 0008_country_code_wa_index
Create Date: 2026-05-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0009_events'
down_revision: Union[str, None] = '0008_country_code_wa_index'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('title', sa.String(300), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('cover_image', sa.String(500), nullable=True),
        sa.Column('show_on_home', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_events_created_at', 'events', ['created_at'])
    op.create_index('ix_events_show_on_home', 'events', ['show_on_home'])


def downgrade() -> None:
    op.drop_index('ix_events_show_on_home', table_name='events')
    op.drop_index('ix_events_created_at', table_name='events')
    op.drop_table('events')
