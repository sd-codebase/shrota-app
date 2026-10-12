"""Add Google Play billing: subscription plans, store purchases, book purchases

Revision ID: 0022_google_play_billing
Revises: 0021_listening_ledger
Create Date: 2026-10-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0022_google_play_billing'
down_revision: Union[str, None] = '0021_listening_ledger'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('books', sa.Column('play_sync_status', sa.String(length=10), nullable=True))
    op.add_column('books', sa.Column('play_sync_error', sa.Text(), nullable=True))
    op.add_column('books', sa.Column('play_synced_at', sa.DateTime(timezone=True), nullable=True))

    op.create_table(
        'subscription_plans',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('price', sa.Integer(), nullable=False),
        sa.Column('billing_period', sa.String(length=8), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.Column('play_sync_status', sa.String(length=10), nullable=False),
        sa.Column('play_sync_error', sa.Text(), nullable=True),
        sa.Column('play_synced_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'store_purchases',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('store', sa.String(length=20), nullable=False),
        sa.Column('kind', sa.String(length=20), nullable=False),
        sa.Column('product_id', sa.String(length=150), nullable=False),
        sa.Column('book_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('plan_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('item_title', sa.String(length=300), nullable=False),
        sa.Column('list_price', sa.Integer(), nullable=True),
        sa.Column('purchase_token', sa.String(length=512), nullable=False),
        sa.Column('order_id', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('acknowledged', sa.Boolean(), nullable=False),
        sa.Column('is_test', sa.Boolean(), nullable=False),
        sa.Column('purchased_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('auto_renewing', sa.Boolean(), nullable=True),
        sa.Column('linked_purchase_token', sa.String(length=512), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['book_id'], ['books.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['plan_id'], ['subscription_plans.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('purchase_token'),
    )
    op.create_index('ix_store_purchases_user_id', 'store_purchases', ['user_id'])
    op.create_index('ix_store_purchases_order_id', 'store_purchases', ['order_id'])
    op.create_index('ix_store_purchases_status', 'store_purchases', ['status'])
    op.create_index('ix_store_purchases_user_kind', 'store_purchases', ['user_id', 'kind'])

    op.create_table(
        'book_purchases',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('book_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('store_purchase_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['book_id'], ['books.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['store_purchase_id'], ['store_purchases.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'book_id', name='unique_book_purchase_user_book'),
    )

    op.create_table(
        'processed_play_notifications',
        sa.Column('message_id', sa.String(length=100), nullable=False),
        sa.Column('received_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('message_id'),
    )


def downgrade() -> None:
    op.drop_table('processed_play_notifications')
    op.drop_table('book_purchases')
    op.drop_index('ix_store_purchases_user_kind', table_name='store_purchases')
    op.drop_index('ix_store_purchases_status', table_name='store_purchases')
    op.drop_index('ix_store_purchases_order_id', table_name='store_purchases')
    op.drop_index('ix_store_purchases_user_id', table_name='store_purchases')
    op.drop_table('store_purchases')
    op.drop_table('subscription_plans')
    op.drop_column('books', 'play_synced_at')
    op.drop_column('books', 'play_sync_error')
    op.drop_column('books', 'play_sync_status')
