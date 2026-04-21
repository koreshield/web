import pytest

from koreshield.services.audit_integrity import AuditIntegrityService
from koreshield.services.operational_status import OperationalStatusService


def test_audit_integrity_service_builds_append_only_chain(tmp_path):
    service = AuditIntegrityService(str(tmp_path / "audit-ledger.jsonl"))

    first = service.append_entry(
        {
            "request_id": "req-1",
            "timestamp": "2026-04-21T10:00:00+00:00",
            "provider": "koreshield",
            "model": "prompt_scan",
            "method": "POST",
            "path": "/v1/scan",
            "status_code": 403,
            "is_blocked": True,
            "attack_detected": True,
            "attack_type": "prompt_injection",
            "user_id": "user-1",
        }
    )
    second = service.append_entry(
        {
            "request_id": "req-2",
            "timestamp": "2026-04-21T10:01:00+00:00",
            "provider": "koreshield",
            "model": "prompt_scan",
            "method": "POST",
            "path": "/v1/scan",
            "status_code": 200,
            "is_blocked": False,
            "attack_detected": False,
            "attack_type": None,
            "user_id": "user-1",
        }
    )

    assert first["sequence"] == 1
    assert second["sequence"] == 2
    assert second["previous_chain_hash"] == first["chain_hash"]

    verification = service.verify_request_ids(["req-1", "req-2"])
    assert verification["checked"] == 2
    assert verification["missing"] == []
    assert verification["verification_status"] == "verified"


@pytest.mark.asyncio
async def test_operational_status_service_records_snapshots_and_incidents(tmp_path):
    service = OperationalStatusService(str(tmp_path / "operational-state.json"))

    await service.record_snapshot(
        {
            "status": "healthy",
            "statistics": {"requests_total": 1, "requests_blocked": 0, "attacks_detected": 0, "errors": 0},
            "providers": {"openai": {"status": "healthy", "enabled": True, "initialized": True}},
            "components": {"provider_routing": {"status": "operational", "detail": "Healthy"}},
        }
    )
    await service.record_snapshot(
        {
            "status": "degraded",
            "statistics": {"requests_total": 2, "requests_blocked": 1, "attacks_detected": 1, "errors": 0},
            "providers": {"openai": {"status": "degraded", "enabled": True, "initialized": True}},
            "components": {"provider_routing": {"status": "degraded", "detail": "Provider unhealthy"}},
        }
    )
    await service.record_snapshot(
        {
            "status": "healthy",
            "statistics": {"requests_total": 3, "requests_blocked": 1, "attacks_detected": 1, "errors": 0},
            "providers": {"openai": {"status": "healthy", "enabled": True, "initialized": True}},
            "components": {"provider_routing": {"status": "operational", "detail": "Recovered"}},
        }
    )

    report = await service.get_public_status_report(
        {
            "status": "healthy",
            "statistics": {"requests_total": 3, "requests_blocked": 1, "attacks_detected": 1, "errors": 0},
            "providers": {"openai": {"status": "healthy", "enabled": True, "initialized": True}},
            "components": {"provider_routing": {"status": "operational", "detail": "Recovered"}},
        }
    )

    assert report["evidence"]["snapshot_count"] == 3
    assert len(report["incidents"]) >= 1
    assert report["incidents"][0]["status"] == "resolved"
    assert len(report["uptime_history"]) == 90
