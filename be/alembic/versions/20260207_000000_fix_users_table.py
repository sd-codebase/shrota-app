"""Fix users table: drop whatsapp columns, make email not null

Revision ID: 0005_fix_users_table
Revises: 0004_notification_book_id
Create Date: 2026-02-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0005_fix_users_table'
down_revision: Union[str, None] = '0004_notification_book_id'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop whatsapp columns that were missed by a previous stamped migration
    op.drop_column('users', 'is_whatsapp_verified')
    op.drop_column('users', 'whatsapp_number')

    # Make email not null (matches model definition)
    op.alter_column('users', 'email',
                    existing_type=sa.VARCHAR(length=255),
                    nullable=False)


def downgrade() -> None:
    op.alter_column('users', 'email',
                    existing_type=sa.VARCHAR(length=255),
                    nullable=True)

    op.add_column('users', sa.Column('whatsapp_number', sa.VARCHAR(length=20), nullable=True))
    op.add_column('users', sa.Column('is_whatsapp_verified', sa.BOOLEAN(), nullable=True, server_default='false'))
    op.execute("UPDATE users SET is_whatsapp_verified = false WHERE is_whatsapp_verified IS NULL")
    op.alter_column('users', 'is_whatsapp_verified', nullable=False)
