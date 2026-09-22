"""Add role to admins and owner_admin_id to books

Revision ID: 0015_admin_role_book_owner
Revises: 0014_book_access_type
Create Date: 2026-09-25 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0015_admin_role_book_owner'
down_revision: Union[str, None] = '0014_book_access_type'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'admins',
        sa.Column('role', sa.String(20), nullable=False, server_default='admin'),
    )
    op.add_column(
        'books',
        sa.Column('owner_admin_id', postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        'fk_books_owner_admin_id', 'books', 'admins', ['owner_admin_id'], ['id']
    )
    op.create_index('ix_books_owner_admin_id', 'books', ['owner_admin_id'])


def downgrade() -> None:
    op.drop_index('ix_books_owner_admin_id', table_name='books')
    op.drop_constraint('fk_books_owner_admin_id', 'books', type_='foreignkey')
    op.drop_column('books', 'owner_admin_id')
    op.drop_column('admins', 'role')
