"""Add whatsapp verification columns to users table

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
    # Add whatsapp_number column (safe for prod where it may already exist)
    op.execute("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20) NOT NULL DEFAULT ''
    """)

    # Add is_whatsapp_verified column
    op.execute("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS is_whatsapp_verified BOOLEAN NOT NULL DEFAULT false
    """)

    # Add whatsapp_otp column for persistent OTP storage
    op.execute("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS whatsapp_otp VARCHAR(6)
    """)

    # Make email NOT NULL (if not already)
    op.alter_column('users', 'email',
                    existing_type=sa.VARCHAR(length=255),
                    nullable=False)

    # Handle prod where whatsapp_number may be nullable: set default for existing rows, then set NOT NULL
    op.execute("UPDATE users SET whatsapp_number = '' WHERE whatsapp_number IS NULL")
    op.execute("""
        ALTER TABLE users ALTER COLUMN whatsapp_number SET NOT NULL
    """)
    op.execute("""
        ALTER TABLE users ALTER COLUMN whatsapp_number SET DEFAULT ''
    """)


def downgrade() -> None:
    op.drop_column('users', 'whatsapp_otp')
    op.drop_column('users', 'is_whatsapp_verified')
    op.drop_column('users', 'whatsapp_number')
