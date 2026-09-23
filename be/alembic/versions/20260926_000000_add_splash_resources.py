"""Add splash_resources table

Revision ID: 0016_splash_resources
Revises: 0015_admin_role_book_owner
Create Date: 2026-09-26 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0016_splash_resources'
down_revision: Union[str, None] = '0015_admin_role_book_owner'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'splash_resources',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('resource_type', sa.String(10), nullable=False),
        sa.Column('file', sa.String(500), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_splash_resources_created_at', 'splash_resources', ['created_at'])
    op.create_index('ix_splash_resources_is_active', 'splash_resources', ['is_active'])


def downgrade() -> None:
    op.drop_index('ix_splash_resources_is_active', table_name='splash_resources')
    op.drop_index('ix_splash_resources_created_at', table_name='splash_resources')
    op.drop_table('splash_resources')
