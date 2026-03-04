"""
Tests for KoreShield monitoring and alerting system.
"""

import pytest
import asyncio
import time
from unittest.mock import AsyncMock, MagicMock, patch
from src.koreshield.monitoring import (
    MetricsCollector, AlertManager, AlertRule, Alert,
    AlertSeverity, AlertChannel, MonitoringSystem
)
from src.koreshield.config import AlertingConfig, MonitoringConfig


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
