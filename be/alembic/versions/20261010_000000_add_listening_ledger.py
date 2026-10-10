"""Add listening ledger and royalty snapshots

Revision ID: 0021_listening_ledger
Revises: 0020_drop_splash_resources
Create Date: 2026-10-10 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0021_listening_ledger'
down_revision: Union[str, None] = '0020_drop_splash_resources'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'book_listen_daily',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('listen_date', sa.Date(), nullable=False),
        sa.Column('book_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('chapter_index', sa.Integer(), nullable=False),
        sa.Column('install_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('seconds_listened', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['book_id'], ['books.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'listen_date', 'book_id', 'chapter_index', 'install_id',
            name='unique_listen_day_book_chapter_install',
        ),
    )
    op.create_index('ix_book_listen_daily_listen_date', 'book_listen_daily', ['listen_date'])
    op.create_index('ix_book_listen_daily_install_id', 'book_listen_daily', ['install_id'])
    op.create_index('ix_book_listen_daily_user_id', 'book_listen_daily', ['user_id'])
    op.create_index('ix_book_listen_daily_book_date', 'book_listen_daily', ['book_id', 'listen_date'])

    op.create_table(
        'royalty_snapshots',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('label', sa.String(length=120), nullable=False),
        sa.Column('period_start', sa.Date(), nullable=False),
        sa.Column('period_end', sa.Date(), nullable=False),
        sa.Column('include_guests', sa.Boolean(), nullable=False),
        sa.Column('total_seconds', sa.BigInteger(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('generated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('generated_by_admin_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('generated_by_name', sa.String(length=200), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['generated_by_admin_id'], ['admins.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_royalty_snapshots_period', 'royalty_snapshots', ['period_start', 'period_end'])

    op.create_table(
        'royalty_snapshot_lines',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('snapshot_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('book_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('book_title', sa.String(length=300), nullable=False),
        sa.Column('author_names', sa.String(length=500), nullable=False),
        sa.Column('publisher_name', sa.String(length=300), nullable=True),
        sa.Column('seconds_listened', sa.BigInteger(), nullable=False),
        sa.Column('unique_listeners', sa.Integer(), nullable=False),
        sa.Column('unique_devices', sa.Integer(), nullable=False),
        sa.Column('share_percentage', sa.Numeric(precision=7, scale=4), nullable=False),
        sa.ForeignKeyConstraint(['snapshot_id'], ['royalty_snapshots.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['book_id'], ['books.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_royalty_snapshot_lines_snapshot_id', 'royalty_snapshot_lines', ['snapshot_id'])


def downgrade() -> None:
    op.drop_index('ix_royalty_snapshot_lines_snapshot_id', table_name='royalty_snapshot_lines')
    op.drop_table('royalty_snapshot_lines')
    op.drop_index('ix_royalty_snapshots_period', table_name='royalty_snapshots')
    op.drop_table('royalty_snapshots')
    op.drop_index('ix_book_listen_daily_book_date', table_name='book_listen_daily')
    op.drop_index('ix_book_listen_daily_user_id', table_name='book_listen_daily')
    op.drop_index('ix_book_listen_daily_install_id', table_name='book_listen_daily')
    op.drop_index('ix_book_listen_daily_listen_date', table_name='book_listen_daily')
    op.drop_table('book_listen_daily')
