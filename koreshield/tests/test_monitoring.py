"""
Tests for KoreShield monitoring and alerting system.
"""

import time
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from koreshield.config import AlertingConfig
from koreshield.monitoring import (
    Alert,
    AlertChannel,
    AlertManager,
    AlertRule,
    AlertSeverity,
    MetricsCollector,
    MonitoringSystem,
)


class TestMetricsCollector:
    """Test MetricsCollector singleton and metrics."""

    def test_singleton(self):
        """Test that MetricsCollector is a singleton."""
        collector1 = MetricsCollector()
        collector2 = MetricsCollector()
        assert collector1 is collector2

    def test_metrics_initialization(self):
        """Test that metrics are properly initialized."""
        collector = MetricsCollector()
        assert hasattr(collector, 'requests_total')
        assert hasattr(collector, 'requests_duration')
        assert hasattr(collector, 'attacks_detected')
        assert hasattr(collector, 'requests_blocked')
        assert hasattr(collector, 'provider_requests')
        assert hasattr(collector, 'provider_latency')
        assert hasattr(collector, 'active_connections')
        assert hasattr(collector, 'memory_usage')
        assert hasattr(collector, 'cpu_usage')

    def test_get_metrics(self):
        """Test getting metrics in Prometheus format."""
        collector = MetricsCollector()
        metrics = collector.get_metrics()
        assert isinstance(metrics, str)
        assert '# HELP' in metrics or '# TYPE' in metrics


class TestAlertManager:
    """Test AlertManager functionality."""

    @pytest.fixture
    def alert_config(self):
        """Create a mock alerting config."""
        return AlertingConfig(enabled=True, rules=[])

    @pytest.fixture
    def alert_manager(self, alert_config):
        """Create AlertManager instance."""
        return AlertManager(alert_config)

    def test_initialization(self, alert_manager):
        """Test AlertManager initialization."""
        assert alert_manager.config is not None
        assert alert_manager.alert_rules == []
        assert alert_manager.active_alerts == []

    def test_load_alert_rules(self, alert_manager, alert_config):
        """Test loading alert rules from config."""
        # Mock rule config
        rule_config = MagicMock()
        rule_config.name = "test_rule"
        rule_config.condition = "requests_total > 100"
        rule_config.severity = "warning"
        rule_config.channels = ["email"]
        rule_config.cooldown = 300  # 5 minutes

        alert_config.rules = [rule_config]

        alert_manager._load_alert_rules()

        assert len(alert_manager.alert_rules) == 1
        rule = alert_manager.alert_rules[0]
        assert rule.name == "test_rule"
        assert rule.condition == "requests_total > 100"
        assert rule.severity == AlertSeverity.WARNING
        assert rule.channels == [AlertChannel.EMAIL]
        assert rule.cooldown_minutes == 5

    @pytest.mark.asyncio
    async def test_evaluate_rules_no_trigger(self, alert_manager):
        """Test evaluating rules when conditions are not met."""
        rule = AlertRule(
            name="test_rule",
            condition="requests_total > 100",
            severity=AlertSeverity.WARNING,
            channels=[AlertChannel.EMAIL]
        )
        alert_manager.alert_rules = [rule]

        metrics = {"requests_total": 50}
        alerts = await alert_manager.evaluate_rules(metrics)

        assert alerts == []

    @pytest.mark.asyncio
    async def test_evaluate_rules_trigger(self, alert_manager):
        """Test evaluating rules when conditions are met."""
        rule = AlertRule(
            name="test_rule",
            condition="requests_total > 100",
            severity=AlertSeverity.WARNING,
            channels=[AlertChannel.EMAIL]
        )
        alert_manager.alert_rules = [rule]

        metrics = {"requests_total": 150}
        alerts = await alert_manager.evaluate_rules(metrics)

        assert len(alerts) == 1
        alert = alerts[0]
        assert alert.rule_name == "test_rule"
        assert alert.severity == AlertSeverity.WARNING
        assert alert.message == "Alert triggered: test_rule"
        assert not alert.resolved

    @pytest.mark.asyncio
    async def test_evaluate_rules_cooldown(self, alert_manager):
        """Test that rules respect cooldown period."""
        rule = AlertRule(
            name="test_rule",
            condition="requests_total > 100",
            severity=AlertSeverity.WARNING,
            channels=[AlertChannel.EMAIL],
            cooldown_minutes=1
        )
        alert_manager.alert_rules = [rule]

        # First trigger
        metrics = {"requests_total": 150}
        alerts1 = await alert_manager.evaluate_rules(metrics)
        assert len(alerts1) == 1

        # Second trigger (should be blocked by cooldown)
        alerts2 = await alert_manager.evaluate_rules(metrics)
        assert len(alerts2) == 0

    @pytest.mark.asyncio
    async def test_send_alert_unknown_channel(self, alert_manager):
        """Test sending alert with unknown channel."""
        alert = Alert(
            rule_name="test",
            severity=AlertSeverity.INFO,
            message="test message",
            details={},
            timestamp=time.time()
        )

        # Mock unknown channel
        result = await alert_manager.send_alert(alert, "unknown")
        assert result is False

    @pytest.mark.asyncio
    async def test_send_email_alert_disabled(self, alert_manager):
        """Test sending email alert when disabled."""
        alert = Alert(
            rule_name="test",
            severity=AlertSeverity.INFO,
            message="test message",
            details={},
            timestamp=time.time()
        )

        alert_manager.config.channels.email.enabled = False

        result = await alert_manager.send_alert(alert, AlertChannel.EMAIL)
        assert result is False

    @pytest.mark.asyncio
    @patch('smtplib.SMTP')
    async def test_send_email_alert_success(self, mock_smtp, alert_manager):
        """Test successful email alert sending."""
        alert = Alert(
            rule_name="test",
            severity=AlertSeverity.INFO,
            message="test message",
            details={"key": "value"},
            timestamp=time.time()
        )

        alert_manager.config.channels.email.enabled = True
        alert_manager.config.channels.email.from_address = "test@example.com"
        alert_manager.config.channels.email.to_addresses = ["admin@example.com"]
        alert_manager.config.channels.email.smtp_server = "smtp.example.com"
        alert_manager.config.channels.email.smtp_port = 587
        alert_manager.config.channels.email.username = "user"
        alert_manager.config.channels.email.password = "pass"

        mock_server = MagicMock()
        mock_smtp.return_value = mock_server

        result = await alert_manager.send_alert(alert, AlertChannel.EMAIL)
        assert result is True

        # Verify SMTP calls
        mock_smtp.assert_called_once_with("smtp.example.com", 587)
        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_once_with("user", "pass")
        mock_server.send_message.assert_called_once()
        mock_server.quit.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_webhook_alert_success(self, alert_manager):
        """Test successful webhook alert sending."""
        alert = Alert(
            rule_name="test",
            severity=AlertSeverity.INFO,
            message="test message",
            details={},
            timestamp=time.time()
        )

        alert_manager.config.channels.webhook.enabled = True
        alert_manager.config.channels.webhook.url = "https://example.com/webhook"

        # Mock HTTP response
        mock_response = MagicMock()
        mock_response.status_code = 200
        alert_manager.client.post = AsyncMock(return_value=mock_response)

        result = await alert_manager.send_alert(alert, AlertChannel.WEBHOOK)
        assert result is True

        alert_manager.client.post.assert_called_once()
        call_args = alert_manager.client.post.call_args
        assert call_args[0][0] == "https://example.com/webhook"
        assert "alert_name" in call_args[1]["json"]

    @pytest.mark.asyncio
    async def test_send_slack_alert_success(self, alert_manager):
        """Test successful Slack alert sending."""
        alert = Alert(
            rule_name="test",
            severity=AlertSeverity.WARNING,
            message="test message",
            details={},
            timestamp=time.time()
        )

        alert_manager.config.channels.slack.enabled = True
        alert_manager.config.channels.slack.webhook_url = "https://hooks.slack.com/test"

        mock_response = MagicMock()
        mock_response.status_code = 200
        alert_manager.client.post = AsyncMock(return_value=mock_response)

        result = await alert_manager.send_alert(alert, AlertChannel.SLACK)
        assert result is True

        alert_manager.client.post.assert_called_once()
        call_args = alert_manager.client.post.call_args
        assert call_args[0][0] == "https://hooks.slack.com/test"
        payload = call_args[1]["json"]
        assert "WARNING" in payload["text"]

    @pytest.mark.asyncio
    async def test_send_teams_alert_success(self, alert_manager):
        """Test successful Teams alert sending."""
        alert = Alert(
            rule_name="test",
            severity=AlertSeverity.ERROR,
            message="test message",
            details={},
            timestamp=time.time()
        )

        alert_manager.config.channels.teams.enabled = True
        alert_manager.config.channels.teams.webhook_url = "https://outlook.office.com/test"

        mock_response = MagicMock()
        mock_response.status_code = 200
        alert_manager.client.post = AsyncMock(return_value=mock_response)

        result = await alert_manager.send_alert(alert, AlertChannel.TEAMS)
        assert result is True

        alert_manager.client.post.assert_called_once()
        call_args = alert_manager.client.post.call_args
        assert call_args[0][0] == "https://outlook.office.com/test"
        payload = call_args[1]["json"]
        assert payload["themeColor"] == "FF0000"  # Red for ERROR

    @pytest.mark.asyncio
    async def test_send_telegram_alert_success(self, alert_manager):
        """Test successful Telegram alert sending."""
        alert = Alert(
            rule_name="provider_status_gemini",
            severity=AlertSeverity.WARNING,
            message="Provider route changed state",
            details={"provider": "gemini", "old_status": "healthy", "new_status": "degraded"},
            timestamp=time.time()
        )

        alert_manager.config.channels.telegram.enabled = True
        alert_manager.config.channels.telegram.bot_token = "telegram-token"
        alert_manager.config.channels.telegram.channel_id = "-1001234567890"

        mock_response = MagicMock()
        mock_response.status_code = 200
        alert_manager.client.post = AsyncMock(return_value=mock_response)

        result = await alert_manager.send_alert(alert, AlertChannel.TELEGRAM)
        assert result is True

        alert_manager.client.post.assert_called_once()
        call_args = alert_manager.client.post.call_args
        assert call_args[0][0] == "https://api.telegram.org/bottelegram-token/sendMessage"
        payload = call_args[1]["json"]
        assert payload["chat_id"] == "-1001234567890"
        assert "provider_status_gemini" in payload["text"]
        assert "old_status" in payload["text"]

    @pytest.mark.asyncio
    async def test_send_telegram_alert_honors_retry_after(self, alert_manager):
        """Telegram 429 responses should open a retry window instead of spamming."""
        alert = Alert(
            rule_name="provider_status_openai",
            severity=AlertSeverity.ERROR,
            message="Provider route changed state",
            details={"provider": "openai", "old_status": "healthy", "new_status": "unhealthy"},
            timestamp=time.time()
        )

        alert_manager.config.channels.telegram.enabled = True
        alert_manager.config.channels.telegram.bot_token = "telegram-token"
        alert_manager.config.channels.telegram.channel_id = "-1001234567890"

        first_response = MagicMock()
        first_response.status_code = 429
        first_response.text = '{"ok":false}'
        first_response.json.return_value = {"parameters": {"retry_after": 5}}
        alert_manager.client.post = AsyncMock(return_value=first_response)

        first_result = await alert_manager.send_alert(alert, AlertChannel.TELEGRAM)
        second_result = await alert_manager.send_alert(alert, AlertChannel.TELEGRAM)

        assert first_result is False
        assert second_result is False
        assert alert_manager.client.post.await_count == 1

    @pytest.mark.asyncio
    async def test_send_telegram_alert_respects_minimum_interval(self, alert_manager):
        """Telegram sends should be throttled between successful messages."""
        alert = Alert(
            rule_name="component_status_monitoring",
            severity=AlertSeverity.INFO,
            message="Component changed state",
            details={"component": "monitoring", "old_status": "degraded", "new_status": "operational"},
            timestamp=time.time(),
        )

        alert_manager.config.channels.telegram.enabled = True
        alert_manager.config.channels.telegram.bot_token = "telegram-token"
        alert_manager.config.channels.telegram.channel_id = "-1001234567890"
        alert_manager.config.channels.telegram.minimum_interval_seconds = 60

        ok_response = MagicMock()
        ok_response.status_code = 200
        alert_manager.client.post = AsyncMock(return_value=ok_response)

        first_result = await alert_manager.send_alert(alert, AlertChannel.TELEGRAM)
        second_result = await alert_manager.send_alert(alert, AlertChannel.TELEGRAM)

        assert first_result is True
        assert second_result is False
        assert alert_manager.client.post.await_count == 1

    def test_build_telegram_message_respects_payload_toggle(self, alert_manager):
        """Telegram payload block can be disabled for cleaner operational alerts."""
        alert = Alert(
            rule_name="telegram_health_digest",
            severity=AlertSeverity.INFO,
            message="Live health digest",
            details={
                "requests_total": 120,
                "requests_blocked": 4,
                "attacks_detected": 4,
                "provider_count": 3,
                "healthy_provider_count": 3,
                "degraded_provider_count": 0,
            },
            timestamp=time.time(),
        )

        alert_manager.config.channels.telegram.include_payload = False
        message = alert_manager._build_telegram_message(alert)

        assert "Requests total" in message
        assert "Healthy providers" in message
        assert "<b>Payload:</b>" not in message

    @pytest.mark.asyncio
    async def test_notify_operational_event_dispatches_enabled_channels(self):
        """Operational events should dispatch immediately to enabled channels."""
        monitoring_config = MagicMock()
        monitoring_config.enabled = True
        monitoring_config.alerts = MagicMock()
        monitoring_system = MonitoringSystem(monitoring_config)
        monitoring_system.alert_manager.send_alert = AsyncMock(return_value=True)
        channels = MagicMock()
        channels.telegram.enabled = True
        channels.email.enabled = False
        channels.slack.enabled = False
        channels.teams.enabled = False
        channels.pagerduty.enabled = False
        channels.webhook.enabled = False
        monitoring_system.config.alerts.channels = channels

        await monitoring_system.notify_operational_event(
            event_name="prompt_scan_completed",
            severity="warning",
            message="Prompt scan completed with a threat",
            details={
                "endpoint": "/v1/scan",
                "request_id": "req-123",
                "blocked": True,
                "attack_type": "prompt_injection",
            },
            publish_event_type="scan_event",
        )

        monitoring_system.alert_manager.send_alert.assert_awaited_once()
        sent_alert = monitoring_system.alert_manager.send_alert.await_args.args[0]
        assert sent_alert.rule_name == "prompt_scan_completed"
        assert sent_alert.details["event_type"] == "scan_event"
        assert sent_alert.details["blocked"] is True

    @pytest.mark.asyncio
    async def test_send_pagerduty_alert_success(self, alert_manager):
        """Test successful PagerDuty alert sending."""
        alert = Alert(
            rule_name="test",
            severity=AlertSeverity.CRITICAL,
            message="test message",
            details={"custom": "data"},
            timestamp=time.time()
        )

        alert_manager.config.channels.pagerduty.enabled = True
        alert_manager.config.channels.pagerduty.integration_key = "test-key"

        mock_response = MagicMock()
        mock_response.status_code = 202
        alert_manager.client.post = AsyncMock(return_value=mock_response)

        result = await alert_manager.send_alert(alert, AlertChannel.PAGERDUTY)
        assert result is True

        alert_manager.client.post.assert_called_once()
        call_args = alert_manager.client.post.call_args
        assert call_args[0][0] == "https://events.pagerduty.com/v2/enqueue"
        payload = call_args[1]["json"]
        assert payload["routing_key"] == "test-key"
        assert payload["payload"]["severity"] == "critical"


class TestMonitoringSystem:
    """Test MonitoringSystem functionality."""

    @pytest.fixture
    def monitoring_config(self):
        """Create a mock monitoring config."""
        config = MagicMock()
        config.enabled = True
        config.alerts = MagicMock()
        config.get.return_value = 60  # check_interval_seconds
        return config

    @pytest.fixture
    def monitoring_system(self, monitoring_config):
        """Create MonitoringSystem instance."""
        return MonitoringSystem(monitoring_config)

    def test_initialization(self, monitoring_system):
        """Test MonitoringSystem initialization."""
        assert monitoring_system.config is not None
        assert isinstance(monitoring_system.metrics, MetricsCollector)
        assert isinstance(monitoring_system.alert_manager, AlertManager)
        assert monitoring_system.monitoring_enabled is True
        assert monitoring_system.monitoring_task is None

    def test_collect_current_metrics_with_stats(self, monitoring_system):
        """Test collecting metrics with stats getter."""
        stats = {
            "requests_total": 100,
            "requests_allowed": 90,
            "requests_blocked": 10,
            "attacks_detected": 5,
            "errors": 2
        }
        monitoring_system.stats_getter = lambda: stats

        metrics = monitoring_system._collect_current_metrics()

        assert metrics["requests_total"] == 100
        assert metrics["requests_allowed"] == 90
        assert metrics["requests_blocked"] == 10
        assert metrics["attacks_detected"] == 5
        assert metrics["errors"] == 2
        assert "timestamp" in metrics

    def test_collect_current_metrics_without_stats(self, monitoring_system):
        """Test collecting metrics without stats getter."""
        monitoring_system.stats_getter = None

        metrics = monitoring_system._collect_current_metrics()

        assert metrics["requests_total"] == 0
        assert metrics["requests_allowed"] == 0
        assert metrics["requests_blocked"] == 0
        assert metrics["attacks_detected"] == 0
        assert metrics["errors"] == 0
        assert "timestamp" in metrics

    def test_get_metrics_text(self, monitoring_system):
        """Test getting metrics text."""
        metrics_text = monitoring_system.get_metrics_text()
        assert isinstance(metrics_text, str)
        # Should contain Prometheus format
        assert any(keyword in metrics_text for keyword in ["# HELP", "# TYPE", "koreshield_"])

    @pytest.mark.asyncio
    async def test_evaluate_status_snapshot_emits_alerts_on_change(self, monitoring_system):
        """Test status snapshot alerts only fire on transitions."""
        snapshots = [
            {
                "providers": {"gemini": {"status": "healthy", "base_url": "https://example.com", "error": None}},
                "components": {"provider_routing": {"status": "operational", "detail": "All healthy"}},
            },
            {
                "providers": {"gemini": {"status": "unhealthy", "base_url": "https://example.com", "error": "timeout"}},
                "components": {"provider_routing": {"status": "degraded", "detail": "Provider routing degraded"}},
            },
        ]

        async def status_getter():
            return snapshots.pop(0)

        monitoring_system.status_getter = status_getter

        first_pass = await monitoring_system._evaluate_status_snapshot()
        assert first_pass == []

        second_pass = await monitoring_system._evaluate_status_snapshot()
        assert len(second_pass) == 2
        assert any("Provider route 'gemini' changed" in alert.message for alert in second_pass)
        assert any("Component 'provider_routing' changed" in alert.message for alert in second_pass)

    @pytest.mark.asyncio
    async def test_health_digest_dispatches_periodically(self, monitoring_system):
        """Health digests should send to Telegram on schedule with live stats."""
        monitoring_system.notify_operational_event = AsyncMock(return_value=None)
        monitoring_system.config.alerts.channels.telegram.enabled = True
        monitoring_system.config.alerts.channels.telegram.health_digest_enabled = True
        monitoring_system.config.alerts.channels.telegram.health_digest_interval_minutes = 15

        snapshot = {
            "providers": {
                "gemini": {"status": "healthy"},
                "deepseek": {"status": "healthy"},
            },
            "components": {
                "provider_routing": {"status": "operational"},
            },
            "statistics": {
                "requests_total": 320,
                "requests_blocked": 12,
                "attacks_detected": 12,
                "errors": 0,
            },
        }

        await monitoring_system._maybe_send_telegram_health_digest(snapshot)

        monitoring_system.notify_operational_event.assert_awaited_once()
        kwargs = monitoring_system.notify_operational_event.await_args.kwargs
        assert kwargs["event_name"] == "telegram_health_digest"
        assert kwargs["details"]["requests_total"] == 320
        assert kwargs["details"]["healthy_provider_count"] == 2

    @pytest.mark.asyncio
    async def test_health_digest_skips_until_interval_elapsed(self, monitoring_system):
        """Health digests should not spam every monitoring loop."""
        monitoring_system.notify_operational_event = AsyncMock(return_value=None)
        monitoring_system.config.alerts.channels.telegram.enabled = True
        monitoring_system.config.alerts.channels.telegram.health_digest_enabled = True
        monitoring_system.config.alerts.channels.telegram.health_digest_interval_minutes = 15
        monitoring_system._last_telegram_digest_at = time.time()

        snapshot = {"providers": {}, "components": {}, "statistics": {}}
        await monitoring_system._maybe_send_telegram_health_digest(snapshot)

        monitoring_system.notify_operational_event.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_start_stop_monitoring(self, monitoring_system):
        """Test starting and stopping monitoring."""
        # Start monitoring
        await monitoring_system.start_monitoring()
        assert monitoring_system.monitoring_task is not None
        assert not monitoring_system.monitoring_task.done()

        # Stop monitoring
        await monitoring_system.stop_monitoring()
        assert monitoring_system.monitoring_task.done()

    @pytest.mark.asyncio
    async def test_monitoring_disabled(self, monitoring_system):
        """Test monitoring when disabled."""
        monitoring_system.monitoring_enabled = False

        await monitoring_system.start_monitoring()
        assert monitoring_system.monitoring_task is None
