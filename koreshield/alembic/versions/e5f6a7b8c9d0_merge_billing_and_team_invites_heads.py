"""merge billing and team invite heads

Revision ID: e5f6a7b8c9d0
Revises: ab12c3d4ef56, d1e2f3a4b5c6
Create Date: 2026-04-03 22:10:00.000000
"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, Sequence[str], None] = ("ab12c3d4ef56", "d1e2f3a4b5c6")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Merge migration branches without schema changes."""


def downgrade() -> None:
    """Split merged branches without schema changes."""
