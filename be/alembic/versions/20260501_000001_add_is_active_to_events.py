"""Add is_active column to events table

Revision ID: 0010_events_is_active
Revises: 0009_events
Create Date: 2026-05-01 00:01:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '0010_events_is_active'
down_revision: Union[str, None] = '0009_events'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'events',
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true')
    )
    op.create_index('ix_events_is_active', 'events', ['is_active'])


def downgrade() -> None:
    op.drop_index('ix_events_is_active', table_name='events')
    op.drop_column('events', 'is_active')
