"""add rag scans

Revision ID: 4a9a3d3f7f12
Revises: c7d485155c51
Create Date: 2026-03-13 01:15:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4a9a3d3f7f12'
down_revision = 'c7d485155c51'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'rag_scans',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('scan_id', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('api_key_id', sa.UUID(), nullable=True),
        sa.Column('user_query', sa.String(), nullable=True),
        sa.Column('documents', sa.JSON(), nullable=False),
        sa.Column('response', sa.JSON(), nullable=False),
        sa.Column('is_safe', sa.Boolean(), nullable=True),
        sa.Column('total_threats_found', sa.Integer(), nullable=True),
        sa.Column('processing_time_ms', sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(['api_key_id'], ['api_keys.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('scan_id')
    )
    op.create_index(op.f('ix_rag_scans_api_key_id'), 'rag_scans', ['api_key_id'], unique=False)
    op.create_index(op.f('ix_rag_scans_created_at'), 'rag_scans', ['created_at'], unique=False)
    op.create_index(op.f('ix_rag_scans_scan_id'), 'rag_scans', ['scan_id'], unique=True)
    op.create_index(op.f('ix_rag_scans_user_id'), 'rag_scans', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_rag_scans_user_id'), table_name='rag_scans')
    op.drop_index(op.f('ix_rag_scans_scan_id'), table_name='rag_scans')
    op.drop_index(op.f('ix_rag_scans_created_at'), table_name='rag_scans')
    op.drop_index(op.f('ix_rag_scans_api_key_id'), table_name='rag_scans')
    op.drop_table('rag_scans')
