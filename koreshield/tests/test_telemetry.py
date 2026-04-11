"""
Tests for KoreShield telemetry and audit logging.
"""

from datetime import datetime, timezone

from koreshield.services.telemetry import TelemetryService


class TestTelemetryService:
    """Test TelemetryService normalization behavior."""

    def test_normalize_log_data_converts_aware_timestamp_and_defaults(self):
        """DB-bound request logs should match the current naive UTC schema."""
        telemetry = TelemetryService(monitoring_system=None)

        aware_timestamp = datetime(2026, 4, 11, 0, 39, 14, tzinfo=timezone.utc)
        normalized = telemetry._normalize_log_data(
            {
                "request_id": "req-123",
                "timestamp": aware_timestamp,
                "provider": "tooling",
                "model": "web_search",
                "status_code": 403,
            }
        )

        assert normalized["timestamp"].tzinfo is None
        assert normalized["timestamp"] == aware_timestamp.replace(tzinfo=None)
        assert normalized["method"] == "POST"
        assert normalized["path"] == "/unknown"
        assert normalized["latency_ms"] == 0.0
        assert normalized["tokens_total"] == 0
        assert normalized["attack_details"] == {}
