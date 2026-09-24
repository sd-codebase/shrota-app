"""Drop splash_resources

The admin-managed splash resource was replaced by the app-open ad, which
covers the same "show something on launch" need with an image, an
optional link and user-controlled dismissal. The app keeps its own
built-in static splash screen, so nothing is left without a launch
visual.

Revision ID: 0020_drop_splash_resources
Revises: 0019_activity_logs
Create Date: 2026-10-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0020_drop_splash_resources'
down_revision: Union[str, None] = '0019_activity_logs'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index('ix_splash_resources_is_active', table_name='splash_resources')
    op.drop_index('ix_splash_resources_created_at', table_name='splash_resources')
    op.drop_table('splash_resources')


def downgrade() -> None:
    # Recreates the table shape only. The rows, and the uploaded files they
    # pointed at under uploads/splash/, are not restored.
    op.create_table(
        'splash_resources',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('resource_type', sa.String(length=10), nullable=False),
        sa.Column('file', sa.String(length=500), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_splash_resources_created_at', 'splash_resources', ['created_at'])
    op.create_index('ix_splash_resources_is_active', 'splash_resources', ['is_active'])
