"""Enable PostgreSQL Row-Level Security on tenant-scoped tables

Revision ID: a1b2c3d4e5f6
Revises: f1a2b3c4d5e6
Create Date: 2026-04-11 00:00:00.000000

Adds database-layer tenant isolation via PostgreSQL RLS.  Every table that
carries a `tenant_id` column gets:

  1. ROW LEVEL SECURITY enabled (and FORCED so the table-owner app role cannot
     accidentally bypass it).
  2. A SELECT / INSERT / UPDATE / DELETE policy that restricts rows to the
     current tenant, identified by the session-local variable `app.tenant_id`.
  3. A separate BYPASS policy for the `koreshield_service` role (the
     privileged maintenance / migration role) so admin operations still work.

Tables covered
--------------
- tenant_api_keys
- tenant_usage
- tenant_quotas
- tenant_audit_logs
- tenant_configurations
- tenant_resource_usage

Session variable contract
-------------------------
Application code MUST set `app.tenant_id` before any DML on these tables:

    SET LOCAL app.tenant_id = '<uuid>';

The helper `current_setting('app.tenant_id', true)` returns NULL when the
variable is not set (the `true` flag enables the "missing-ok" behaviour), which
causes the policy to reject all rows — a safe default.

Rollback
--------
The downgrade() function drops every policy and disables RLS in one pass.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Tables to protect and their tenant column name (all use 'tenant_id').
_RLS_TABLES = [
    "tenant_api_keys",
    "tenant_usage",
    "tenant_quotas",
    "tenant_audit_logs",
    "tenant_configurations",
    "tenant_resource_usage",
]

# Privileged role that is allowed to bypass RLS (migrations, background jobs).
# Adjust to match the actual superuser / service role name in your cluster.
_SERVICE_ROLE = "koreshield_service"


def _table_exists(conn, table_name: str) -> bool:
    return bool(
        conn.execute(
            sa.text(
                """
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = current_schema()
                  AND table_name = :table_name
                """
            ),
            {"table_name": table_name},
        ).scalar()
    )


def upgrade() -> None:
    conn = op.get_bind()
    role_exists = bool(
        conn.execute(
            sa.text("SELECT 1 FROM pg_roles WHERE rolname = :role"),
            {"role": _SERVICE_ROLE},
        ).scalar()
    )

    for table in _RLS_TABLES:
        if not _table_exists(conn, table):
            continue

        # 1. Enable RLS and force it even for the table owner.
        conn.execute(
            sa.text(
                f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY"
            )
        )
        conn.execute(
            sa.text(
                f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY"
            )
        )

        # 2. Tenant-scoped policy — all DML operations.
        #    current_setting(..., true) returns NULL when unset → safe deny.
        conn.execute(
            sa.text(f"""
                CREATE POLICY tenant_isolation ON {table}
                    USING (
                        tenant_id = current_setting('app.tenant_id', true)::uuid
                    )
                    WITH CHECK (
                        tenant_id = current_setting('app.tenant_id', true)::uuid
                    )
            """)
        )

        # 3. Service-role bypass — lets migrations and background workers read/write freely.
        if role_exists:
            conn.execute(
                sa.text(f"""
                    CREATE POLICY service_bypass ON {table}
                        TO {_SERVICE_ROLE}
                        USING (true)
                        WITH CHECK (true)
                """)
            )


def downgrade() -> None:
    conn = op.get_bind()

    for table in _RLS_TABLES:
        if not _table_exists(conn, table):
            continue

        conn.execute(sa.text(f"DROP POLICY IF EXISTS tenant_isolation ON {table}"))
        conn.execute(sa.text(f"DROP POLICY IF EXISTS service_bypass ON {table}"))
        conn.execute(sa.text(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY"))
        conn.execute(sa.text(f"ALTER TABLE {table} NO FORCE ROW LEVEL SECURITY"))
