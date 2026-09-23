"""Add activity sessions and events

Revision ID: 0019_activity_logs
Revises: 0018_app_open_ad_link
Create Date: 2026-09-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0019_activity_logs'
down_revision: Union[str, None] = '0018_app_open_ad_link'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'activity_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('install_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('platform', sa.String(length=20), nullable=True),
        sa.Column('os_version', sa.String(length=50), nullable=True),
        sa.Column('device_model', sa.String(length=120), nullable=True),
        sa.Column('app_version', sa.String(length=30), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_activity_sessions_install_id', 'activity_sessions', ['install_id'])
    op.create_index('ix_activity_sessions_user_id', 'activity_sessions', ['user_id'])
    op.create_index('ix_activity_sessions_started_at', 'activity_sessions', ['started_at'])

    op.create_table(
        'activity_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('event_name', sa.String(length=60), nullable=False),
        sa.Column('params', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('occurred_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('received_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['activity_sessions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_activity_events_session_id', 'activity_events', ['session_id'])
    op.create_index('ix_activity_events_user_id', 'activity_events', ['user_id'])
    op.create_index('ix_activity_events_event_name', 'activity_events', ['event_name'])
    op.create_index('ix_activity_events_session_occurred', 'activity_events', ['session_id', 'occurred_at'])
    op.create_index('ix_activity_events_name_occurred', 'activity_events', ['event_name', 'occurred_at'])


def downgrade() -> None:
    op.drop_index('ix_activity_events_name_occurred', table_name='activity_events')
    op.drop_index('ix_activity_events_session_occurred', table_name='activity_events')
    op.drop_index('ix_activity_events_event_name', table_name='activity_events')
    op.drop_index('ix_activity_events_user_id', table_name='activity_events')
    op.drop_index('ix_activity_events_session_id', table_name='activity_events')
    op.drop_table('activity_events')

    op.drop_index('ix_activity_sessions_started_at', table_name='activity_sessions')
    op.drop_index('ix_activity_sessions_user_id', table_name='activity_sessions')
    op.drop_index('ix_activity_sessions_install_id', table_name='activity_sessions')
    op.drop_table('activity_sessions')
