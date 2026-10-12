"""Add feature flags (on for everyone, or for chosen users)

Revision ID: 0023_feature_flags
Revises: 0022_google_play_billing
Create Date: 2026-10-12 01:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0023_feature_flags'
down_revision: Union[str, None] = '0022_google_play_billing'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'feature_flags',
        sa.Column('key', sa.String(length=50), nullable=False),
        sa.Column('enabled_for_all', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(['updated_by'], ['admins.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('key'),
    )
    op.create_table(
        'feature_flag_users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('flag_key', sa.String(length=50), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['flag_key'], ['feature_flags.key'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('flag_key', 'user_id', name='unique_feature_flag_user'),
    )
    op.create_index('ix_feature_flag_users_flag_key', 'feature_flag_users', ['flag_key'])
    op.create_index('ix_feature_flag_users_user_id', 'feature_flag_users', ['user_id'])
    # In-app purchases start switched off: the paywall only applies to users
    # an admin turns it on for.
    op.execute("INSERT INTO feature_flags (key, enabled_for_all) VALUES ('payments', false)")


def downgrade() -> None:
    op.drop_index('ix_feature_flag_users_user_id', table_name='feature_flag_users')
    op.drop_index('ix_feature_flag_users_flag_key', table_name='feature_flag_users')
    op.drop_table('feature_flag_users')
    op.drop_table('feature_flags')
