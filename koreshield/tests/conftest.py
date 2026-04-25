"""
KoreShield Test Suite — Session Configuration
==============================================

This conftest.py runs before any test module is collected, which means its
module-level code executes before any `from koreshield.proxy import create_app`
call in any test file.

That ordering is critical because `koreshield/database.py` reads DATABASE_URL
at import time and creates the SQLAlchemy engine then — not lazily.  If
DATABASE_URL is not set before the first import of the koreshield package,
engine will be None and every DB-dependent endpoint will return 500.

Strategy:
  - Set DATABASE_URL (and JWT/auth vars) at module level here so they are
    present before any test module imports the package.
  - Provide a session-scoped autouse fixture that creates all SQLAlchemy tables
    in the test SQLite database before any test runs.
  - Drop all tables after the session to leave a clean state.
"""

import asyncio
import os

import pytest

# ── Must be set before koreshield is imported by any test module ──────────────

os.environ.pop("JWT_PUBLIC_KEY", None)
os.environ.pop("JWT_PRIVATE_KEY", None)
# Issuer/audience must match config/config.yaml values — config takes priority over env in init_jwt_config().
os.environ.setdefault("JWT_ISSUER", "koreshield-auth")
os.environ.setdefault("JWT_AUDIENCE", "koreshield-api")
os.environ.setdefault("JWT_SECRET", "test-secret-contract-tests-min-32-chars!!")
os.environ.setdefault("KORESHIELD_EAGER_APP_INIT", "false")
os.environ.setdefault("SECRET_KEY", "ci-internal-secret-for-tests")

# SQLite via aiosqlite — works with all models including postgresql-dialect UUID columns.
# A shared file-based DB (not :memory:) lets the durability tests instantiate
# two independent TestClient apps that both connect to the same data, simulating
# a server restart.
os.environ.setdefault(
    "DATABASE_URL",
    "sqlite+aiosqlite:////tmp/koreshield_test_suite.db",
)


# ── Session fixture: create tables once, drop after session ──────────────────


@pytest.fixture(scope="session", autouse=True)
def create_test_tables():
    """
    Create every SQLAlchemy table in the test SQLite database before any test
    runs.  All model modules must be imported here so their Table objects are
    registered with Base.metadata before create_all is called.
    """
    from koreshield.models.base import Base  # noqa: F401 — registers declarative base

    # Import every model module so its table is registered with Base.metadata.
    import koreshield.models.alert_channel  # noqa: F401
    import koreshield.models.alert_rule  # noqa: F401
    import koreshield.models.api_key  # noqa: F401
    import koreshield.models.billing  # noqa: F401
    import koreshield.models.custom_rule  # noqa: F401
    import koreshield.models.rag_scan  # noqa: F401
    import koreshield.models.report  # noqa: F401
    import koreshield.models.request_log  # noqa: F401
    import koreshield.models.team  # noqa: F401
    import koreshield.models.user  # noqa: F401

    from koreshield.database import engine

    if engine is None:
        pytest.skip("DATABASE_URL not configured — skipping DB-dependent tests")
        return

    async def _create_all():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    asyncio.run(_create_all())

    yield  # all tests run here

    async def _drop_all():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await engine.dispose()

    asyncio.run(_drop_all())
