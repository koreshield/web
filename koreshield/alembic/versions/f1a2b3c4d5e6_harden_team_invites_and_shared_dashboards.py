"""harden team invites and shared dashboards

Revision ID: f1a2b3c4d5e6
Revises: e5f6a7b8c9d0
Create Date: 2026-04-03 23:45:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    team_invite_constraints = {
        constraint["name"]
        for constraint in inspector.get_unique_constraints("team_invites")
        if constraint.get("name")
    }
    shared_dashboard_constraints = {
        constraint["name"]
        for constraint in inspector.get_unique_constraints("shared_dashboards")
        if constraint.get("name")
    }

    op.execute(
        sa.text(
            """
            UPDATE shared_dashboards
            SET config = '{}'::json
            WHERE config IS NULL
            """
        )
    )
    op.alter_column("shared_dashboards", "config", existing_type=sa.JSON(), nullable=False)
    if "uq_team_invites_team_email_status" not in team_invite_constraints:
        op.create_unique_constraint(
            "uq_team_invites_team_email_status",
            "team_invites",
            ["team_id", "email", "status"],
        )
    if "uq_shared_dashboards_team_name" not in shared_dashboard_constraints:
        op.create_unique_constraint(
            "uq_shared_dashboards_team_name",
            "shared_dashboards",
            ["team_id", "name"],
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    team_invite_constraints = {
        constraint["name"]
        for constraint in inspector.get_unique_constraints("team_invites")
        if constraint.get("name")
    }
    shared_dashboard_constraints = {
        constraint["name"]
        for constraint in inspector.get_unique_constraints("shared_dashboards")
        if constraint.get("name")
    }

    if "uq_shared_dashboards_team_name" in shared_dashboard_constraints:
        op.drop_constraint("uq_shared_dashboards_team_name", "shared_dashboards", type_="unique")
    if "uq_team_invites_team_email_status" in team_invite_constraints:
        op.drop_constraint("uq_team_invites_team_email_status", "team_invites", type_="unique")
    op.alter_column("shared_dashboards", "config", existing_type=sa.JSON(), nullable=True)
