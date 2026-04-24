"""
Request audit helpers.

This module owns the small utilities that proxy request handlers call to
attach audit metadata before delegating to TelemetryService for storage.

## How request logging works end-to-end

1. A proxy endpoint (chat completion, scan, RAG scan, …) runs security
   checks and builds a ``log_data`` dict.
2. It calls ``TelemetryService.queue_request_log(log_data)`` which:
   a. Normalises field names/types for the DB schema.
   b. Appends an integrity-chained entry to the AuditIntegrityService ledger.
   c. Builds a dashboard-facing audit entry (``build_audit_entry``) and
      appends it to the in-memory ``audit_log_store`` deque.
   d. Fires an async task to persist ``RequestLog`` to the database.
3. The ``/v1/management/logs`` endpoint merges the in-memory store with
   DB-backed ``RequestLog`` rows.

## Helpers in this module

- ``principal_log_fields`` — extract the ownership fields
  (``user_id``, ``api_key_id``) from an authenticated principal dict so
  they can be spread into the ``log_data`` dict before calling TelemetryService.

- ``record_scan_result`` — store a prompt-scan result payload in the
  in-memory scan store/index so it is visible at ``/v1/scans``.
"""

from __future__ import annotations

from collections import deque
from typing import Any


def principal_log_fields(principal: dict | None) -> dict:
    """
    Extract request-log ownership fields from an authenticated principal.

    Usage::

        self.telemetry.queue_request_log({
            ...common fields...,
            **principal_log_fields(principal),
        })
    """
    if not principal:
        return {}
    return {
        "user_id": principal.get("user_id"),
        "api_key_id": principal.get("api_key_id"),
    }


def record_scan_result(
    payload: dict,
    scan_store: deque,
    scan_index: dict,
) -> None:
    """
    Store a prompt-scan response payload in the in-memory scan history.

    Stores both in the deque (for ordered list endpoints) and in the dict
    (for O(1) lookup by ``request_id``).

    Args:
        payload:     The full scan response dict (must contain ``request_id``).
        scan_store:  ``app.state.scan_store`` deque (maxlen controls retention).
        scan_index:  ``app.state.scan_index`` dict keyed by ``request_id``.
    """
    scan_id = payload.get("request_id")
    if not scan_id:
        return
    scan_index[scan_id] = payload
    scan_store.appendleft(payload)
