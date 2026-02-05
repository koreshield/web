"""Initial migration with tenant models

Revision ID: 001_initial
Revises: 
Create Date: 2026-02-05

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create tenants table
    op.create_table(
        'tenants',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(100), nullable=False, unique=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='active'),
        sa.Column('tier', sa.String(50), nullable=False, server_default='free'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        
        # Database isolation
        sa.Column('schema_name', sa.String(100), unique=True),
        sa.Column('database_name', sa.String(100)),
        
        # Configuration
        sa.Column('config', postgresql.JSON(), server_default='{}'),
        sa.Column('metadata', postgresql.JSON(), server_default='{}'),
        
        # Contact info
        sa.Column('contact_email', sa.String(255)),
        sa.Column('contact_name', sa.String(255)),
        
        # Billing
        sa.Column('billing_email', sa.String(255)),
        sa.Column('subscription_expires_at', sa.DateTime()),
        
        # Security
        sa.Column('api_key_hash', sa.String(255)),
        sa.Column('allowed_ips', postgresql.ARRAY(sa.String())),
        sa.Column('webhook_url', sa.String(500)),
        sa.Column('webhook_secret', sa.String(255)),
    )
    
    # Create indexes
    op.create_index('idx_tenants_slug', 'tenants', ['slug'])
    op.create_index('idx_tenants_status', 'tenants', ['status'])
    op.create_index('idx_tenants_tier', 'tenants', ['tier'])
    
    # Create tenant_api_keys table
    op.create_table(
        'tenant_api_keys',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('key_hash', sa.String(255), nullable=False, unique=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('last_used_at', sa.DateTime()),
        sa.Column('expires_at', sa.DateTime()),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('scopes', postgresql.ARRAY(sa.String())),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
    )
    
    op.create_index('idx_tenant_api_keys_tenant_id', 'tenant_api_keys', ['tenant_id'])
    op.create_index('idx_tenant_api_keys_key_hash', 'tenant_api_keys', ['key_hash'])
    
    # Create tenant_usage table
    op.create_table(
        'tenant_usage',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('period_start', sa.DateTime(), nullable=False),
        sa.Column('period_end', sa.DateTime(), nullable=False),
        sa.Column('requests_total', sa.Integer(), server_default='0'),
        sa.Column('requests_blocked', sa.Integer(), server_default='0'),
        sa.Column('tokens_processed', sa.BigInteger(), server_default='0'),
        sa.Column('storage_bytes', sa.BigInteger(), server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
    )
    
    op.create_index('idx_tenant_usage_tenant_id', 'tenant_usage', ['tenant_id'])
    op.create_index('idx_tenant_usage_period', 'tenant_usage', ['period_start', 'period_end'])
    
    # Create tenant_quotas table
    op.create_table(
        'tenant_quotas',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('resource_type', sa.String(100), nullable=False),
        sa.Column('limit_value', sa.BigInteger(), nullable=False),
        sa.Column('current_value', sa.BigInteger(), server_default='0'),
        sa.Column('reset_period', sa.String(50)),
        sa.Column('last_reset_at', sa.DateTime()),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
    )
    
    op.create_index('idx_tenant_quotas_tenant_id', 'tenant_quotas', ['tenant_id'])
    op.create_index('idx_tenant_quotas_resource_type', 'tenant_quotas', ['resource_type'])


def downgrade() -> None:
    op.drop_table('tenant_quotas')
    op.drop_table('tenant_usage')
    op.drop_table('tenant_api_keys')
    op.drop_table('tenants')
