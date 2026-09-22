"""Add access_type and prime_price to books

Revision ID: 0014_book_access_type
Revises: 0013_books_slug
Create Date: 2026-09-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '0014_book_access_type'
down_revision: Union[str, None] = '0013_books_slug'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'books',
        sa.Column('access_type', sa.String(20), nullable=False, server_default='free'),
    )
    op.add_column('books', sa.Column('prime_price', sa.Integer(), nullable=True))
    op.create_index('ix_books_access_type', 'books', ['access_type'])


def downgrade() -> None:
    op.drop_index('ix_books_access_type', table_name='books')
    op.drop_column('books', 'prime_price')
    op.drop_column('books', 'access_type')
