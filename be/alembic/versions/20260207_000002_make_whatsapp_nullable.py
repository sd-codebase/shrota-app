"""Make whatsapp_number column nullable

Revision ID: 0007_whatsapp_nullable
Revises: 0006_add_whatsapp_otp
Create Date: 2026-02-07 00:00:02.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0007_whatsapp_nullable'
down_revision: Union[str, None] = '0006_add_whatsapp_otp'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('users', 'whatsapp_number',
                    existing_type=sa.VARCHAR(length=20),
                    nullable=True)


def downgrade() -> None:
    op.execute("UPDATE users SET whatsapp_number = '' WHERE whatsapp_number IS NULL")
    op.alter_column('users', 'whatsapp_number',
                    existing_type=sa.VARCHAR(length=20),
                    nullable=False)
