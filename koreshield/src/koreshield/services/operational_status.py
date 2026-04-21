"""
Operational status persistence and incident workflow support.

Stores live status samples, incidents, maintenance windows, and breach records
in an append-safe JSON document so hosted environments can publish evidence-
backed uptime and incident history without requiring a new relational schema.
"""

from __future__ import annotations

import asyncio
import json
import os
import tempfile
import uuid
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt: datetime | None = None) -> str:
    return (dt or _utcnow()).astimezone(timezone.utc).isoformat()


class OperationalStatusService:
    """Persist operational status history and operator-managed incidents."""

    def __init__(self, state_path: str | None = None, retention_days: int = 90):
        default_path = os.getenv("KORESHIELD_OPERATIONAL_STATE_PATH", "data/operational_state.json")
        self.state_path = Path(state_path or default_path)
        self.retention_days = retention_days
        self._lock = asyncio.Lock()
        self._state = self._load_state()

    def _default_state(self) -> dict[str, Any]:
        return {
            "status_history": [],
            "incidents": [],
            "maintenance_windows": [],
            "breach_records": [],
        }

    def _load_state(self) -> dict[str, Any]:
        if not self.state_path.exists():
            return self._default_state()
        try:
            with self.state_path.open("r", encoding="utf-8") as handle:
                loaded = json.load(handle)
        except Exception:
            return self._default_state()

        state = self._default_state()
        if isinstance(loaded, dict):
            state.update({key: value for key, value in loaded.items() if key in state and isinstance(value, list)})
        return state

    def _persist_state(self) -> None:
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        fd, temp_path = tempfile.mkstemp(prefix="koreshield-operational-", suffix=".json", dir=str(self.state_path.parent))
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as handle:
                json.dump(self._state, handle, indent=2, sort_keys=True)
            os.replace(temp_path, self.state_path)
        finally:
            if os.path.exists(temp_path):
                try:
                    os.unlink(temp_path)
                except OSError:
                    pass

    @staticmethod
    def _normalize_status(status: str | None) -> str:
        normalized = (status or "").strip().lower()
        if normalized in {"healthy", "operational"}:
            return "operational"
        if normalized in {"degraded", "maintenance", "partial_outage", "major_outage", "down", "unhealthy"}:
            return normalized
        return "operational"

    def _derive_overall_status(self, snapshot: dict[str, Any]) -> str:
        component_statuses = [
            self._normalize_status(component.get("status"))
            for component in (snapshot.get("components") or {}).values()
            if isinstance(component, dict)
        ]
        provider_statuses = [
            self._normalize_status(provider.get("status"))
            for provider in (snapshot.get("providers") or {}).values()
            if isinstance(provider, dict)
        ]
        statuses = component_statuses + provider_statuses
        if any(status in {"major_outage", "down"} for status in statuses):
            return "major_outage"
        if any(status == "partial_outage" for status in statuses):
            return "partial_outage"
        if any(status in {"degraded", "unhealthy"} for status in statuses):
            return "degraded"
        if any(status == "maintenance" for status in statuses):
            return "maintenance"
        return self._normalize_status(snapshot.get("status")) or "operational"

    def _trim_history(self) -> None:
        cutoff = _utcnow() - timedelta(days=self.retention_days)
        self._state["status_history"] = [
            sample
            for sample in self._state["status_history"]
            if datetime.fromisoformat(sample["timestamp"]) >= cutoff
        ][-5000:]

    def _upsert_automatic_incidents(self, snapshot: dict[str, Any], recorded_at: str) -> None:
        degraded_components = [
            name
            for name, component in (snapshot.get("components") or {}).items()
            if self._normalize_status(component.get("status")) not in {"operational"}
        ]
        degraded_providers = [
            name
            for name, provider in (snapshot.get("providers") or {}).items()
            if self._normalize_status(provider.get("status")) not in {"operational", "disabled"}
        ]
        impacted = sorted(set(degraded_components + degraded_providers))
        active_auto = next(
            (
                incident
                for incident in self._state["incidents"]
                if incident.get("source") == "system" and incident.get("status") != "resolved"
            ),
            None,
        )

        if impacted:
            detail = f"Live monitoring detected degraded service on: {', '.join(impacted)}."
            if active_auto:
                active_auto["affected_components"] = impacted
                active_auto["updated_at"] = recorded_at
                active_auto["updates"].append(
                    {
                        "message": detail,
                        "timestamp": recorded_at,
                        "status": active_auto["status"],
                    }
                )
            else:
                severity = "major" if any(name in degraded_providers for name in impacted) else "minor"
                self._state["incidents"].insert(
                    0,
                    {
                        "id": f"inc_{uuid.uuid4().hex[:12]}",
                        "title": "Live service degradation detected",
                        "severity": severity,
                        "status": "investigating",
                        "source": "system",
                        "incident_type": "service_disruption",
                        "affected_components": impacted,
                        "created_at": recorded_at,
                        "updated_at": recorded_at,
                        "resolved_at": None,
                        "updates": [
                            {
                                "message": detail,
                                "timestamp": recorded_at,
                                "status": "investigating",
                            }
                        ],
                    },
                )
        elif active_auto:
            active_auto["status"] = "resolved"
            active_auto["updated_at"] = recorded_at
            active_auto["resolved_at"] = recorded_at
            active_auto["updates"].append(
                {
                    "message": "Live monitoring confirms affected components have recovered.",
                    "timestamp": recorded_at,
                    "status": "resolved",
                }
            )

    async def record_snapshot(self, snapshot: dict[str, Any]) -> dict[str, Any]:
        """Persist a live status sample and keep derived incident evidence up to date."""
        async with self._lock:
            recorded_at = _iso()
            overall_status = self._derive_overall_status(snapshot)
            statistics = snapshot.get("statistics") or {}
            sample = {
                "timestamp": recorded_at,
                "overall_status": overall_status,
                "components": deepcopy(snapshot.get("components") or {}),
                "providers": deepcopy(snapshot.get("providers") or {}),
                "statistics": {
                    "requests_total": int(statistics.get("requests_total", 0) or 0),
                    "requests_blocked": int(statistics.get("requests_blocked", 0) or 0),
                    "attacks_detected": int(statistics.get("attacks_detected", 0) or 0),
                    "errors": int(statistics.get("errors", 0) or 0),
                },
            }
            self._state["status_history"].append(sample)
            self._trim_history()
            self._upsert_automatic_incidents(snapshot, recorded_at)
            self._persist_state()
            return sample

    async def create_incident(
        self,
        *,
        title: str,
        severity: str,
        affected_components: list[str],
        message: str,
        incident_type: str = "service_disruption",
        source: str = "manual",
        status: str = "investigating",
    ) -> dict[str, Any]:
        async with self._lock:
            now = _iso()
            incident = {
                "id": f"inc_{uuid.uuid4().hex[:12]}",
                "title": title.strip(),
                "severity": severity,
                "status": status,
                "source": source,
                "incident_type": incident_type,
                "affected_components": affected_components,
                "created_at": now,
                "updated_at": now,
                "resolved_at": None,
                "updates": [
                    {
                        "message": message.strip(),
                        "timestamp": now,
                        "status": status,
                    }
                ],
            }
            self._state["incidents"].insert(0, incident)
            self._persist_state()
            return deepcopy(incident)

    async def add_incident_update(self, incident_id: str, *, message: str, status: str) -> dict[str, Any]:
        async with self._lock:
            incident = next((item for item in self._state["incidents"] if item["id"] == incident_id), None)
            if not incident:
                raise KeyError("Incident not found")
            now = _iso()
            incident["status"] = status
            incident["updated_at"] = now
            if status == "resolved":
                incident["resolved_at"] = now
            incident["updates"].append(
                {
                    "message": message.strip(),
                    "timestamp": now,
                    "status": status,
                }
            )
            self._persist_state()
            return deepcopy(incident)

    async def schedule_maintenance(
        self,
        *,
        title: str,
        description: str,
        scheduled_start: str,
        scheduled_end: str,
        affected_components: list[str],
        status: str = "scheduled",
    ) -> dict[str, Any]:
        async with self._lock:
            window = {
                "id": f"maint_{uuid.uuid4().hex[:12]}",
                "title": title.strip(),
                "description": description.strip(),
                "scheduled_start": scheduled_start,
                "scheduled_end": scheduled_end,
                "affected_components": affected_components,
                "status": status,
                "created_at": _iso(),
            }
            self._state["maintenance_windows"].insert(0, window)
            self._persist_state()
            return deepcopy(window)

    async def create_breach_record(
        self,
        *,
        title: str,
        severity: str,
        summary: str,
        status: str = "investigating",
        disclosure_required: bool = False,
        regulatory_due_at: str | None = None,
    ) -> dict[str, Any]:
        async with self._lock:
            now = _iso()
            record = {
                "id": f"breach_{uuid.uuid4().hex[:12]}",
                "title": title.strip(),
                "severity": severity,
                "status": status,
                "summary": summary.strip(),
                "disclosure_required": disclosure_required,
                "regulatory_due_at": regulatory_due_at,
                "created_at": now,
                "updated_at": now,
                "updates": [
                    {
                        "message": summary.strip(),
                        "timestamp": now,
                        "status": status,
                    }
                ],
            }
            self._state["breach_records"].insert(0, record)
            self._persist_state()
            return deepcopy(record)

    async def add_breach_update(self, breach_id: str, *, message: str, status: str) -> dict[str, Any]:
        async with self._lock:
            record = next((item for item in self._state["breach_records"] if item["id"] == breach_id), None)
            if not record:
                raise KeyError("Breach record not found")
            now = _iso()
            record["status"] = status
            record["updated_at"] = now
            record["updates"].append(
                {
                    "message": message.strip(),
                    "timestamp": now,
                    "status": status,
                }
            )
            self._persist_state()
            return deepcopy(record)

    def _build_uptime_history(self, days: int = 90) -> list[dict[str, Any]]:
        history = self._state["status_history"]
        incidents = self._state["incidents"]
        today = _utcnow().date()
        daily: list[dict[str, Any]] = []

        for offset in range(days - 1, -1, -1):
            day = today - timedelta(days=offset)
            day_samples = [
                sample
                for sample in history
                if datetime.fromisoformat(sample["timestamp"]).date() == day
            ]
            operational_samples = sum(
                1 for sample in day_samples if sample.get("overall_status") == "operational"
            )
            uptime_percentage = (
                (operational_samples / len(day_samples)) * 100 if day_samples else 100.0
            )
            incident_count = sum(
                1
                for incident in incidents
                if datetime.fromisoformat(incident["created_at"]).date() == day
            )
            daily.append(
                {
                    "date": day.isoformat(),
                    "uptime_percentage": round(uptime_percentage, 2),
                    "sample_count": len(day_samples),
                    "incidents": incident_count,
                }
            )
        return daily

    async def get_public_status_report(self, current_snapshot: dict[str, Any]) -> dict[str, Any]:
        async with self._lock:
            incidents = deepcopy(self._state["incidents"][:20])
            maintenance_windows = deepcopy(self._state["maintenance_windows"][:10])
            public_breaches = [
                deepcopy(record)
                for record in self._state["breach_records"]
                if record.get("disclosure_required")
            ][:10]
            history = self._build_uptime_history()
            recorded_history = self._state["status_history"]
            return {
                **deepcopy(current_snapshot),
                "incidents": incidents,
                "maintenance_windows": maintenance_windows,
                "breach_records": public_breaches,
                "uptime_history": history,
                "evidence": {
                    "snapshot_count": len(recorded_history),
                    "first_recorded_at": recorded_history[0]["timestamp"] if recorded_history else None,
                    "last_recorded_at": recorded_history[-1]["timestamp"] if recorded_history else None,
                    "incident_count": len(self._state["incidents"]),
                    "maintenance_count": len(self._state["maintenance_windows"]),
                    "breach_record_count": len(self._state["breach_records"]),
                    "retention_days": self.retention_days,
                },
            }

    async def get_admin_state(self) -> dict[str, Any]:
        async with self._lock:
            return deepcopy(self._state)
