"""Add alert_rules, alert_channels, and custom_rules tables

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-04-24 00:00:00.000000

Persists alert rules, alert channels, and custom detection rules to the database
so that configuration created via the management API survives service restarts.
Previously these were stored in module-level in-memory dicts.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "c3d4e5f6a7b8"
down_revision = "b2c3d4e5f6a7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "alert_rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.String(1000), nullable=False),
        sa.Column("condition", sa.Text(), nullable=False),
        sa.Column("severity", sa.String(50), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("channels", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("cooldown_minutes", sa.Integer(), nullable=False, server_default=sa.text("30")),
        sa.Column("last_triggered", sa.DateTime(), nullable=True),
        sa.Column("trigger_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "alert_channels",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("config", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "custom_rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.String(1000), nullable=False),
        sa.Column("pattern", sa.Text(), nullable=False),
        sa.Column("pattern_type", sa.String(50), nullable=False),
        sa.Column("severity", sa.String(50), nullable=False),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("priority", sa.Integer(), nullable=False, server_default=sa.text("5")),
        sa.Column("tags", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("conditions", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("rule_actions", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("custom_rules")
    op.drop_table("alert_channels")
    op.drop_table("alert_rules")
