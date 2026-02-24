"""Add country_code column and partial unique index on whatsapp_number

Revision ID: 0008_country_code_wa_index
Revises: 0007_whatsapp_nullable
Create Date: 2026-02-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0008_country_code_wa_index'
down_revision: Union[str, None] = '0007_whatsapp_nullable'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add country_code column with default "91"
    op.add_column('users', sa.Column('country_code', sa.String(4), nullable=False, server_default='91'))

    # Convert empty strings to NULL
    op.execute("UPDATE users SET whatsapp_number = NULL WHERE whatsapp_number = ''")

    # Clear duplicate whatsapp_numbers before creating unique index.
    # For each duplicate number, keep the most recently updated row and
    # NULL out the rest so they don't block the unique constraint.
    op.execute("""
        UPDATE users
        SET whatsapp_number = NULL
        WHERE whatsapp_number IS NOT NULL
          AND id NOT IN (
            SELECT DISTINCT ON (whatsapp_number) id
            FROM users
            WHERE whatsapp_number IS NOT NULL
            ORDER BY whatsapp_number, updated_at DESC
          )
    """)

    # Add partial unique index on whatsapp_number (only for non-null values)
    op.create_index(
        'ix_users_whatsapp_number_unique',
        'users',
        ['whatsapp_number'],
        unique=True,
        postgresql_where=sa.text('whatsapp_number IS NOT NULL'),
    )


def downgrade() -> None:
    op.drop_index('ix_users_whatsapp_number_unique', table_name='users')
    op.drop_column('users', 'country_code')
