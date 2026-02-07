"""Add whatsapp_otp column to users table

Revision ID: 0006_add_whatsapp_otp
Revises: 0005_fix_users_table
Create Date: 2026-02-07 00:00:01.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0006_add_whatsapp_otp'
down_revision: Union[str, None] = '0005_fix_users_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS whatsapp_otp VARCHAR(6)
    """)


def downgrade() -> None:
    op.drop_column('users', 'whatsapp_otp')
