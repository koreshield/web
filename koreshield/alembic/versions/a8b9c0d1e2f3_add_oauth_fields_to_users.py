"""add oauth fields to users

Revision ID: a8b9c0d1e2f3
Revises: f1a2b3c4d5e6
Create Date: 2026-04-14 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = "a8b9c0d1e2f3"
down_revision = "f1a2b3c4d5e6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("github_id", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("google_id", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("oauth_provider", sa.String(50), nullable=True))

    # Unique indexes — checked first so re-runs are idempotent
    from sqlalchemy.engine.reflection import Inspector
    from alembic import op as _op
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    indexes = {idx["name"] for idx in inspector.get_indexes("users")}

    if "ix_users_github_id" not in indexes:
        op.create_index("ix_users_github_id", "users", ["github_id"], unique=True)
    if "ix_users_google_id" not in indexes:
        op.create_index("ix_users_google_id", "users", ["google_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_google_id", table_name="users")
    op.drop_index("ix_users_github_id", table_name="users")
    op.drop_column("users", "oauth_provider")
    op.drop_column("users", "google_id")
    op.drop_column("users", "github_id")
