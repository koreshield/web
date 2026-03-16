"""Add billing tables

Revision ID: ab12c3d4ef56
Revises: 96bbad2830a7
Create Date: 2026-03-16 12:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ab12c3d4ef56'
down_revision = '6f7b3a0a3e2d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'billing_accounts',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('owner_user_id', sa.UUID(), nullable=False),
        sa.Column('team_id', sa.UUID(), nullable=True),
        sa.Column('provider', sa.String(length=50), nullable=False),
        sa.Column('external_customer_id', sa.String(length=255), nullable=False),
        sa.Column('polar_customer_id', sa.String(length=255), nullable=True),
        sa.Column('polar_customer_state', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('plan_slug', sa.String(length=100), nullable=False),
        sa.Column('plan_name', sa.String(length=255), nullable=True),
        sa.Column('subscription_status', sa.String(length=100), nullable=True),
        sa.Column('subscription_id', sa.String(length=255), nullable=True),
        sa.Column('product_id', sa.String(length=255), nullable=True),
        sa.Column('currency', sa.String(length=10), nullable=True),
        sa.Column('cancel_at_period_end', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('current_period_end', sa.DateTime(), nullable=True),
        sa.Column('billing_email', sa.String(length=255), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['owner_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('team_id'),
        sa.UniqueConstraint('polar_customer_id'),
    )
    op.create_index(op.f('ix_billing_accounts_external_customer_id'), 'billing_accounts', ['external_customer_id'], unique=True)
    op.create_index(op.f('ix_billing_accounts_owner_user_id'), 'billing_accounts', ['owner_user_id'], unique=False)
    op.create_index(op.f('ix_billing_accounts_provider_status'), 'billing_accounts', ['provider', 'status'], unique=False)

    op.create_table(
        'billing_webhook_events',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('billing_account_id', sa.UUID(), nullable=True),
        sa.Column('provider', sa.String(length=50), nullable=False),
        sa.Column('event_type', sa.String(length=100), nullable=False),
        sa.Column('event_id', sa.String(length=255), nullable=True),
        sa.Column('payload', sa.JSON(), nullable=False),
        sa.Column('processed', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('processing_error', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('processed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['billing_account_id'], ['billing_accounts.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('event_id'),
    )
    op.create_index(op.f('ix_billing_webhook_events_billing_account_id'), 'billing_webhook_events', ['billing_account_id'], unique=False)
    op.create_index(op.f('ix_billing_webhook_events_event_id'), 'billing_webhook_events', ['event_id'], unique=True)
    op.create_index(op.f('ix_billing_webhook_events_event_type'), 'billing_webhook_events', ['event_type'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_billing_webhook_events_event_type'), table_name='billing_webhook_events')
    op.drop_index(op.f('ix_billing_webhook_events_event_id'), table_name='billing_webhook_events')
    op.drop_index(op.f('ix_billing_webhook_events_billing_account_id'), table_name='billing_webhook_events')
    op.drop_table('billing_webhook_events')

    op.drop_index(op.f('ix_billing_accounts_provider_status'), table_name='billing_accounts')
    op.drop_index(op.f('ix_billing_accounts_owner_user_id'), table_name='billing_accounts')
    op.drop_index(op.f('ix_billing_accounts_external_customer_id'), table_name='billing_accounts')
    op.drop_table('billing_accounts')
