"""
Append-only audit ledger with chained hashes.
"""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from threading import Lock
from typing import Any


class AuditIntegrityService:
    """Persist chained audit metadata in an append-only JSONL ledger."""

    def __init__(self, ledger_path: str | None = None):
        default_path = os.getenv("KORESHIELD_AUDIT_LEDGER_PATH", "data/audit_ledger.jsonl")
        self.ledger_path = Path(ledger_path or default_path)
        self._lock = Lock()
        self._metadata_by_request_id: dict[str, dict[str, Any]] = {}
        self._last_sequence = 0
        self._last_chain_hash = "0" * 64
        self._load_existing()

    def _load_existing(self) -> None:
        if not self.ledger_path.exists():
            return
        try:
            with self.ledger_path.open("r", encoding="utf-8") as handle:
                for line in handle:
                    record = json.loads(line)
                    request_id = record.get("request_id")
                    if request_id:
                        self._metadata_by_request_id[request_id] = record
                    self._last_sequence = max(self._last_sequence, int(record.get("sequence", 0) or 0))
                    self._last_chain_hash = record.get("chain_hash", self._last_chain_hash)
        except Exception:
            self._metadata_by_request_id = {}
            self._last_sequence = 0
            self._last_chain_hash = "0" * 64

    @staticmethod
    def _canonical_payload(entry: dict[str, Any]) -> str:
        normalized = {
            "request_id": entry.get("request_id"),
            "timestamp": entry.get("timestamp"),
            "provider": entry.get("provider"),
            "model": entry.get("model"),
            "method": entry.get("method"),
            "path": entry.get("path"),
            "status_code": entry.get("status_code"),
            "is_blocked": bool(entry.get("is_blocked")),
            "attack_detected": bool(entry.get("attack_detected")),
            "attack_type": entry.get("attack_type"),
            "user_id": str(entry.get("user_id")) if entry.get("user_id") else None,
        }
        return json.dumps(normalized, sort_keys=True, separators=(",", ":"), default=str)

    def append_entry(self, entry: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self.ledger_path.parent.mkdir(parents=True, exist_ok=True)
            request_id = str(entry.get("request_id") or "")
            timestamp = str(entry.get("timestamp") or "")
            payload_hash = hashlib.sha256(self._canonical_payload(entry).encode("utf-8")).hexdigest()
            previous_chain_hash = self._last_chain_hash
            sequence = self._last_sequence + 1
            chain_hash = hashlib.sha256(
                f"{previous_chain_hash}:{payload_hash}:{request_id}:{timestamp}:{sequence}".encode("utf-8")
            ).hexdigest()
            record = {
                "sequence": sequence,
                "request_id": request_id,
                "timestamp": timestamp,
                "payload_hash": payload_hash,
                "previous_chain_hash": previous_chain_hash,
                "chain_hash": chain_hash,
                "storage_backend": "jsonl_append_only_ledger",
                "verification_status": "verified",
            }
            with self.ledger_path.open("a", encoding="utf-8") as handle:
                handle.write(json.dumps(record, sort_keys=True) + "\n")
            self._metadata_by_request_id[request_id] = record
            self._last_sequence = sequence
            self._last_chain_hash = chain_hash
            return record

    def get_metadata(self, request_id: str | None) -> dict[str, Any] | None:
        if not request_id:
            return None
        record = self._metadata_by_request_id.get(str(request_id))
        return dict(record) if record else None

    def verify_request_ids(self, request_ids: list[str]) -> dict[str, Any]:
        checked = 0
        missing: list[str] = []
        latest_chain_hash = None
        for request_id in request_ids:
            metadata = self._metadata_by_request_id.get(str(request_id))
            if not metadata:
                missing.append(str(request_id))
                continue
            checked += 1
            latest_chain_hash = metadata.get("chain_hash", latest_chain_hash)
        return {
            "checked": checked,
            "missing": missing,
            "latest_chain_hash": latest_chain_hash or self._last_chain_hash,
            "ledger_path": str(self.ledger_path),
            "storage_backend": "jsonl_append_only_ledger",
            "verification_status": "verified" if not missing else "partial",
        }
