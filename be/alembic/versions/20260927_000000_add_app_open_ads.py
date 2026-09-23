"""Add app_open_ads table

Revision ID: 0017_app_open_ads
Revises: 0016_splash_resources
Create Date: 2026-09-27 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0017_app_open_ads'
down_revision: Union[str, None] = '0016_splash_resources'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'app_open_ads',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('file', sa.String(500), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_app_open_ads_created_at', 'app_open_ads', ['created_at'])
    op.create_index('ix_app_open_ads_is_active', 'app_open_ads', ['is_active'])


def downgrade() -> None:
    op.drop_index('ix_app_open_ads_is_active', table_name='app_open_ads')
    op.drop_index('ix_app_open_ads_created_at', table_name='app_open_ads')
    op.drop_table('app_open_ads')
