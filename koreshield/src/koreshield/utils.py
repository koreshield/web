"""
Shared utility functions for KoreShield.

Centralised here to avoid duplication across models and API modules.
"""

from datetime import datetime, timezone


def utcnow_naive() -> datetime:
    """Return UTC now as a naive datetime (no tzinfo) for DB schema compatibility."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def utcnow_aware() -> datetime:
    """Return UTC now as a timezone-aware datetime."""
    return datetime.now(timezone.utc)
