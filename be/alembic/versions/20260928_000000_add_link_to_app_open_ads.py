"""Add link to app_open_ads

Revision ID: 0018_app_open_ad_link
Revises: 0017_app_open_ads
Create Date: 2026-09-28 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '0018_app_open_ad_link'
down_revision: Union[str, None] = '0017_app_open_ads'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('app_open_ads', sa.Column('link', sa.String(1000), nullable=True))


def downgrade() -> None:
    op.drop_column('app_open_ads', 'link')
