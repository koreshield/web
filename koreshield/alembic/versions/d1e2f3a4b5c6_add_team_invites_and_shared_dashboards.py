"""add team_invites and shared_dashboards tables

Revision ID: d1e2f3a4b5c6
Revises: c7d485155c51
Branch Labels: None
Depends On: None
"""
from alembic import op
import sqlalchemy as sa

revision = 'd1e2f3a4b5c6'
down_revision = 'c7d485155c51'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'team_invites',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('team_id', sa.UUID(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False, server_default='member'),
        sa.Column('token', sa.String(length=255), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='pending'),
        sa.Column('created_by', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token'),
    )
    op.create_index('ix_team_invites_team_id', 'team_invites', ['team_id'])
    op.create_index('ix_team_invites_email', 'team_invites', ['email'])

    op.create_table(
        'shared_dashboards',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('team_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('dashboard_type', sa.String(length=50), nullable=False, server_default='security'),
        sa.Column('config', sa.JSON(), nullable=True),
        sa.Column('created_by', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_shared_dashboards_team_id', 'shared_dashboards', ['team_id'])


def downgrade() -> None:
    op.drop_index('ix_shared_dashboards_team_id', table_name='shared_dashboards')
    op.drop_table('shared_dashboards')
    op.drop_index('ix_team_invites_email', table_name='team_invites')
    op.drop_index('ix_team_invites_team_id', table_name='team_invites')
    op.drop_table('team_invites')
