"""Add users table for authentication

Revision ID: 002_add_users_table
Revises: 001_initial
Create Date: 2026-02-05

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_add_users_table'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('name', sa.String(255)),
        sa.Column('role', sa.String(50), nullable=False, server_default='user'),
        sa.Column('status', sa.String(50), nullable=False, server_default='active'),
        sa.Column('email_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('email_verification_token', sa.String(255)),
        sa.Column('email_verification_expires_at', sa.DateTime()),
        sa.Column('reset_password_token', sa.String(255)),
        sa.Column('reset_password_expires_at', sa.DateTime()),
        sa.Column('last_login_at', sa.DateTime()),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('metadata', postgresql.JSON(), server_default='{}'),
    )
    
    # Create indexes
    op.create_index('idx_users_email', 'users', ['email'])
    op.create_index('idx_users_status', 'users', ['status'])
    op.create_index('idx_users_role', 'users', ['role'])
    op.create_index('idx_users_email_verification_token', 'users', ['email_verification_token'])
    op.create_index('idx_users_reset_password_token', 'users', ['reset_password_token'])


def downgrade() -> None:
    op.drop_table('users')
