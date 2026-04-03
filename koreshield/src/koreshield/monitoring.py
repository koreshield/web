"""
Monitoring and alerting system for KoreShield.
"""

import asyncio
import ast
import json
import smtplib
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, List, Optional, Any, Callable, Awaitable
from dataclasses import dataclass
from enum import Enum

import httpx
from prometheus_client import Counter, Gauge, Histogram, generate_latest, CONTENT_TYPE_LATEST
import structlog

from .config import AlertingConfig, MonitoringConfig

logger = structlog.get_logger(__name__)


def evaluate_alert_condition(condition: str, metrics_data: Dict[str, Any]) -> bool:
    """
    Safely evaluate alert-condition DSL using a restricted AST.

    Supported:
    - boolean logic: and/or/not
    - comparisons: == != > >= < <= in not in
    - arithmetic: + - * / %
    - literals and metric variables by name
    - simple subscripts: requests["failed"]
    """
    try:
        tree = ast.parse(condition, mode="eval")
    except SyntaxError as exc:
        raise ValueError(f"Invalid condition syntax: {exc}") from exc

    def _eval(node):
        if isinstance(node, ast.Expression):
            return _eval(node.body)

        if isinstance(node, ast.BoolOp):
            values = [_eval(v) for v in node.values]
            if isinstance(node.op, ast.And):
                return all(values)
            if isinstance(node.op, ast.Or):
                return any(values)
            raise ValueError("Unsupported boolean operator")

        if isinstance(node, ast.UnaryOp):
            if isinstance(node.op, ast.Not):
                return not _eval(node.operand)
            if isinstance(node.op, ast.USub):
                return -_eval(node.operand)
            raise ValueError("Unsupported unary operator")

        if isinstance(node, ast.BinOp):
            left = _eval(node.left)
            right = _eval(node.right)
            if isinstance(node.op, ast.Add):
                return left + right
            if isinstance(node.op, ast.Sub):
                return left - right
            if isinstance(node.op, ast.Mult):
                return left * right
            if isinstance(node.op, ast.Div):
                return left / right
            if isinstance(node.op, ast.Mod):
                return left % right
            raise ValueError("Unsupported arithmetic operator")

        if isinstance(node, ast.Compare):
            left = _eval(node.left)
            for op, comparator in zip(node.ops, node.comparators):
                right = _eval(comparator)
                if isinstance(op, ast.Eq):
                    is_ok = left == right
                elif isinstance(op, ast.NotEq):
                    is_ok = left != right
                elif isinstance(op, ast.Gt):
                    is_ok = left > right
                elif isinstance(op, ast.GtE):
                    is_ok = left >= right
                elif isinstance(op, ast.Lt):
                    is_ok = left < right
                elif isinstance(op, ast.LtE):
                    is_ok = left <= right
                elif isinstance(op, ast.In):
                    is_ok = left in right
                elif isinstance(op, ast.NotIn):
                    is_ok = left not in right
                else:
                    raise ValueError("Unsupported comparison operator")

                if not is_ok:
                    return False
                left = right
            return True

        if isinstance(node, ast.Name):
            if node.id not in metrics_data:
                raise ValueError(f"Unknown metric '{node.id}'")
            return metrics_data[node.id]

        if isinstance(node, ast.Constant):
            return node.value

        if isinstance(node, ast.Subscript):
            value = _eval(node.value)
            key = _eval(node.slice)
            if isinstance(value, (dict, list, tuple)):
                return value[key]
            raise ValueError("Subscript target is not indexable")

        raise ValueError(f"Unsupported expression element: {type(node).__name__}")

    result = _eval(tree)
    if not isinstance(result, bool):
        raise ValueError("Condition must evaluate to a boolean")
    return result


class AlertSeverity(Enum):
    """Alert severity levels."""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class AlertChannel(Enum):
    """Alert delivery channels."""
    EMAIL = "email"
    WEBHOOK = "webhook"
    SLACK = "slack"
    TEAMS = "teams"
    TELEGRAM = "telegram"
    PAGERDUTY = "pagerduty"


@dataclass
class AlertRule:
    """Alert rule configuration."""
    name: str
    condition: str  # Python expression to evaluate
    severity: AlertSeverity
    channels: List[AlertChannel]
    cooldown_minutes: int = 5
    description: str = ""
    enabled: bool = True

    # Runtime state
    last_triggered: float = 0
    trigger_count: int = 0


@dataclass
class Alert:
    """Alert instance."""
    rule_name: str
    severity: AlertSeverity
    message: str
    details: Dict[str, Any]
    timestamp: float
    resolved: bool = False
    resolved_at: Optional[float] = None


class MetricsCollector:
    """Prometheus metrics collector for KoreShield."""
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if hasattr(self, '_initialized'):
            return
        self._initialized = True

        # Request metrics
        self.requests_total = Counter(
            'koreshield_requests_total',
            'Total number of requests processed',
            ['method', 'endpoint', 'status']
        )

        self.requests_duration = Histogram(
            'koreshield_requests_duration_seconds',
            'Request duration in seconds',
            ['method', 'endpoint'],
            buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0]
        )

        # Security metrics
        self.attacks_detected = Counter(
            'koreshield_attacks_detected_total',
            'Total number of attacks detected',
            ['attack_type', 'severity']
        )

        self.requests_blocked = Counter(
            'koreshield_requests_blocked_total',
            'Total number of requests blocked',
            ['reason']
        )

        # Provider metrics
        self.provider_requests = Counter(
            'koreshield_provider_requests_total',
            'Requests sent to each provider',
            ['provider', 'status']
        )

        self.provider_latency = Histogram(
            'koreshield_provider_latency_seconds',
            'Provider response latency',
            ['provider'],
            buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0]
        )

        # System metrics
        self.active_connections = Gauge(
            'koreshield_active_connections',
            'Number of active connections'
        )

        self.memory_usage = Gauge(
            'koreshield_memory_usage_bytes',
            'Memory usage in bytes'
        )

        self.cpu_usage = Gauge(
            'koreshield_cpu_usage_percent',
            'CPU usage percentage'
        )

    def get_metrics(self) -> str:
        """Get all metrics in Prometheus format."""
        return generate_latest().decode('utf-8')


class AlertManager:
    """Alert management system."""

    def __init__(self, config: AlertingConfig):
        self.config = config
        self.alert_rules: List[AlertRule] = []
        self.active_alerts: List[Alert] = []
        self.client = httpx.AsyncClient(timeout=10.0)

        # Load alert rules from config
        self._load_alert_rules()

    def _load_alert_rules(self):
        """Load alert rules from configuration."""
        rules_config = self.config.rules

        for rule_config in rules_config:
            rule = AlertRule(
                name=rule_config.name,
                condition=rule_config.condition,
                severity=AlertSeverity(rule_config.severity),
                channels=[AlertChannel(ch) for ch in rule_config.channels],
                cooldown_minutes=rule_config.cooldown // 60,  # Convert seconds to minutes
                description=f"Alert rule: {rule_config.name}",
                enabled=True
            )
            self.alert_rules.append(rule)

        logger.info(f"Loaded {len(self.alert_rules)} alert rules")

    async def evaluate_rules(self, metrics_data: Dict[str, Any]) -> List[Alert]:
        """Evaluate all alert rules against current metrics."""
        new_alerts = []

        for rule in self.alert_rules:
            if not rule.enabled:
                continue

            # Check cooldown
            if time.time() - rule.last_triggered < rule.cooldown_minutes * 60:
                continue

            try:
                if evaluate_alert_condition(rule.condition, metrics_data):
                    alert = Alert(
                        rule_name=rule.name,
                        severity=rule.severity,
                        message=f"Alert triggered: {rule.name}",
                        details={
                            'rule': rule.name,
                            'condition': rule.condition,
                            'metrics': metrics_data
                        },
                        timestamp=time.time()
                    )

                    new_alerts.append(alert)
                    rule.last_triggered = time.time()
                    rule.trigger_count += 1

                    logger.warning(f"Alert triggered: {rule.name}")

            except Exception as e:
                logger.error(f"Error evaluating alert rule {rule.name}: {e}")

        return new_alerts

    async def send_alert(self, alert: Alert, channel: AlertChannel) -> bool:
        """Send alert via specified channel."""
        try:
            if channel == AlertChannel.EMAIL:
                return await self._send_email_alert(alert)
            elif channel == AlertChannel.WEBHOOK:
                return await self._send_webhook_alert(alert)
            elif channel == AlertChannel.SLACK:
                return await self._send_slack_alert(alert)
            elif channel == AlertChannel.TEAMS:
                return await self._send_teams_alert(alert)
            elif channel == AlertChannel.TELEGRAM:
                return await self._send_telegram_alert(alert)
            elif channel == AlertChannel.PAGERDUTY:
                return await self._send_pagerduty_alert(alert)
            else:
                logger.error(f"Unknown alert channel: {channel}")
                return False
        except Exception as e:
            logger.error(f"Failed to send alert via {channel.value}: {e}")
            return False

    async def _send_email_alert(self, alert: Alert) -> bool:
        """Send alert via email."""
        email_config = self.config.channels.email
        if not email_config.enabled:
            return False

        try:
            msg = MIMEMultipart()
            msg['From'] = email_config.from_address
            msg['To'] = ', '.join(email_config.to_addresses)
            msg['Subject'] = f"KoreShield Alert: {alert.rule_name}"

            body = f"""
KoreShield Alert

Rule: {alert.rule_name}
Severity: {alert.severity.value.upper()}
Time: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(alert.timestamp))}

Message: {alert.message}

Details:
{json.dumps(alert.details, indent=2)}
            """

            msg.attach(MIMEText(body, 'plain'))

            server = smtplib.SMTP(email_config.smtp_server, email_config.smtp_port)
            server.starttls()  # Always use TLS
            if email_config.username:
                server.login(email_config.username, email_config.password)

            server.send_message(msg)
            server.quit()

            return True
        except Exception as e:
            logger.error(f"Email alert failed: {e}")
            return False

    async def _send_webhook_alert(self, alert: Alert) -> bool:
        """Send alert via webhook."""
        webhook_config = self.config.channels.webhook
        if not webhook_config.enabled:
            return False

        payload = {
            'alert_name': alert.rule_name,
            'severity': alert.severity.value,
            'message': alert.message,
            'timestamp': alert.timestamp,
            'details': alert.details
        }

        response = await self.client.post(
            webhook_config.url,
            json=payload,
            headers={**webhook_config.headers, 'Content-Type': 'application/json'}
        )

        return response.status_code == 200

    async def _send_slack_alert(self, alert: Alert) -> bool:
        """Send alert via Slack."""
        slack_config = self.config.channels.slack
        if not slack_config.enabled:
            return False

        emoji = {
            AlertSeverity.INFO: 'INFO',
            AlertSeverity.WARNING: 'WARNING',
            AlertSeverity.ERROR: 'ERROR',
            AlertSeverity.CRITICAL: 'CRITICAL'
        }

        payload = {
            'text': f"{emoji[alert.severity]} KoreShield Alert",
            'blocks': [
                {
                    'type': 'header',
                    'text': {
                        'type': 'plain_text',
                        'text': f'{emoji[alert.severity]} {alert.rule_name}'
                    }
                },
                {
                    'type': 'section',
                    'text': {
                        'type': 'mrkdwn',
                        'text': f'*Severity:* {alert.severity.value.upper()}\n*Message:* {alert.message}'
                    }
                },
                {
                    'type': 'section',
                    'text': {
                        'type': 'mrkdwn',
                        'text': f'*Time:* {time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(alert.timestamp))}'
                    }
                }
            ]
        }

        response = await self.client.post(
            slack_config.webhook_url,
            json=payload,
            headers={'Content-Type': 'application/json'}
        )

        return response.status_code == 200

    async def _send_teams_alert(self, alert: Alert) -> bool:
        """Send alert via Microsoft Teams."""
        teams_config = self.config.channels.teams
        if not teams_config.enabled:
            return False

        color = {
            AlertSeverity.INFO: '0078D4',
            AlertSeverity.WARNING: 'FF8C00',
            AlertSeverity.ERROR: 'FF0000',
            AlertSeverity.CRITICAL: '8B0000'
        }

        payload = {
            '@type': 'MessageCard',
            '@context': 'http://schema.org/extensions',
            'themeColor': color[alert.severity],
            'title': f'KoreShield Alert: {alert.rule_name}',
            'text': f'**Severity:** {alert.severity.value.upper()}\n\n**Message:** {alert.message}\n\n**Time:** {time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(alert.timestamp))}',
            'sections': [
                {
                    'text': f'Details: {json.dumps(alert.details, indent=2)}'
                }
            ]
        }

        response = await self.client.post(
            teams_config.webhook_url,
            json=payload,
            headers={'Content-Type': 'application/json'}
        )

        return response.status_code == 200

    async def _send_telegram_alert(self, alert: Alert) -> bool:
        """Send alert via Telegram bot."""
        telegram_config = getattr(self.config.channels, "telegram", None)
        if not telegram_config or not telegram_config.enabled:
            return False
        if not telegram_config.bot_token or not telegram_config.channel_id:
            logger.error("Telegram alert failed: missing bot token or channel id")
            return False

        icon = {
            AlertSeverity.INFO: "INFO",
            AlertSeverity.WARNING: "WARNING",
            AlertSeverity.ERROR: "ERROR",
            AlertSeverity.CRITICAL: "CRITICAL",
        }
        details_text = json.dumps(alert.details, indent=2, default=str)
        message = (
            f"<b>{icon[alert.severity]} KoreShield Alert</b>\n"
            f"<b>Rule:</b> {alert.rule_name}\n"
            f"<b>Severity:</b> {alert.severity.value.upper()}\n"
            f"<b>Message:</b> {alert.message}\n"
            f"<b>Time:</b> {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(alert.timestamp))}\n"
            f"<b>Details:</b>\n<pre>{details_text}</pre>"
        )

        payload = {
            "chat_id": telegram_config.channel_id,
            "text": message,
            "parse_mode": "HTML",
            "disable_web_page_preview": True,
        }
        if telegram_config.message_thread_id:
            payload["message_thread_id"] = telegram_config.message_thread_id

        response = await self.client.post(
            f"https://api.telegram.org/bot{telegram_config.bot_token}/sendMessage",
            json=payload,
            headers={"Content-Type": "application/json"},
        )
        return response.status_code == 200

    async def _send_pagerduty_alert(self, alert: Alert) -> bool:
        """Send alert via PagerDuty."""
        pd_config = self.config.channels.pagerduty
        if not pd_config.enabled:
            return False

        severity = {
            AlertSeverity.INFO: 'info',
            AlertSeverity.WARNING: 'warning',
            AlertSeverity.ERROR: 'error',
            AlertSeverity.CRITICAL: 'critical'
        }

        payload = {
            'routing_key': pd_config.integration_key,
            'event_action': 'trigger',
            'payload': {
                'summary': f'KoreShield: {alert.message}',
                'severity': severity[alert.severity],
                'source': 'koreshield-proxy',
                'component': 'alerting',
                'group': 'koreshield',
                'class': 'alert',
                'custom_details': alert.details
            }
        }

        response = await self.client.post(
            'https://events.pagerduty.com/v2/enqueue',
            json=payload,
            headers={'Content-Type': 'application/json'}
        )

        return response.status_code == 202

    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()


class MonitoringSystem:
    """Main monitoring and alerting system."""

    def __init__(
        self,
        config: MonitoringConfig,
        stats_getter: Optional[Callable[[], Dict[str, int]]] = None,
        event_publisher: Optional[Callable[[str, Dict[str, Any]], Awaitable[None]]] = None,
        status_getter: Optional[Callable[[], Awaitable[Dict[str, Any]]]] = None,
    ):
        self.config = config
        self.metrics = MetricsCollector()
        self.alert_manager = AlertManager(config.alerts)
        self.monitoring_enabled = config.enabled
        self.stats_getter = stats_getter
        self.event_publisher = event_publisher
        self.status_getter = status_getter
        self._last_status_snapshot: Dict[str, Any] | None = None

        # Background monitoring task
        self.monitoring_task: Optional[asyncio.Task] = None

    async def start_monitoring(self):
        """Start the monitoring system."""
        if not self.monitoring_enabled:
            logger.info("Monitoring system disabled")
            return

        logger.info("Starting monitoring system")
        self.monitoring_task = asyncio.create_task(self._monitoring_loop())

    async def stop_monitoring(self):
        """Stop the monitoring system."""
        if self.monitoring_task:
            self.monitoring_task.cancel()
            try:
                await self.monitoring_task
            except asyncio.CancelledError:
                pass

        await self.alert_manager.close()

    async def _monitoring_loop(self):
        """Main monitoring loop."""
        interval = getattr(self.config.alerts, "check_interval", 60)

        while True:
            try:
                # Collect current metrics/state
                metrics_data = self._collect_current_metrics()

                # Evaluate alert rules
                alerts = await self.alert_manager.evaluate_rules(metrics_data)

                # Send alerts
                for alert in alerts:
                    for channel in alert.details.get('channels', []):
                        await self.alert_manager.send_alert(alert, channel)

                # Update active alerts
                self.alert_manager.active_alerts.extend(alerts)

                status_alerts = await self._evaluate_status_snapshot()
                for alert in status_alerts:
                    await self._dispatch_operational_alert(alert)
                self.alert_manager.active_alerts.extend(status_alerts)

                # Publish cost threshold alerts (if configured)
                if self.event_publisher and alerts:
                    for alert in alerts:
                        rule_name = (alert.rule_name or "").lower()
                        if "cost" in rule_name or "budget" in rule_name:
                            try:
                                await self.event_publisher(
                                    "cost_threshold_alert",
                                    {
                                        "rule_name": alert.rule_name,
                                        "severity": alert.severity.value,
                                        "message": alert.message,
                                        "timestamp": alert.timestamp,
                                        "details": alert.details,
                                    },
                                )
                            except Exception as e:
                                logger.error("event_publish_failed", event_type="cost_threshold_alert", error=str(e))

            except Exception as e:
                logger.error(f"Monitoring loop error: {e}")

            await asyncio.sleep(interval)

    def _get_enabled_channels(self) -> List[AlertChannel]:
        """Return enabled alert delivery channels."""
        enabled_channels: List[AlertChannel] = []
        channels_config = getattr(self.config.alerts, "channels", None)
        if not channels_config:
            return enabled_channels

        for channel in AlertChannel:
            channel_config = getattr(channels_config, channel.value, None)
            if channel_config and getattr(channel_config, "enabled", False):
                enabled_channels.append(channel)
        return enabled_channels

    async def _dispatch_operational_alert(self, alert: Alert) -> None:
        """Send an alert across all enabled channels."""
        enabled_channels = self._get_enabled_channels()
        if not enabled_channels:
            return

        for channel in enabled_channels:
            await self.alert_manager.send_alert(alert, channel)

        if self.event_publisher:
            try:
                await self.event_publisher(
                    "status_change_alert",
                    {
                        "rule_name": alert.rule_name,
                        "severity": alert.severity.value,
                        "message": alert.message,
                        "timestamp": alert.timestamp,
                        "details": alert.details,
                    },
                )
            except Exception as e:
                logger.error("event_publish_failed", event_type="status_change_alert", error=str(e))

    async def notify_status_change(
        self,
        *,
        subject_type: str,
        subject_name: str,
        old_status: str | None,
        new_status: str | None,
        detail: str | None = None,
        extra: Dict[str, Any] | None = None,
    ) -> None:
        """Dispatch a single operational status change alert immediately."""
        alert = Alert(
            rule_name=f"{subject_type}_status_{subject_name}",
            severity=self._severity_from_status(new_status or "unknown"),
            message=f"{subject_type.replace('_', ' ').title()} '{subject_name}' changed from {old_status or 'unknown'} to {new_status or 'unknown'}",
            details={
                subject_type: subject_name,
                "old_status": old_status,
                "new_status": new_status,
                "detail": detail,
                **(extra or {}),
            },
            timestamp=time.time(),
        )
        await self._dispatch_operational_alert(alert)

    def _severity_from_status(self, status: str) -> AlertSeverity:
        """Map component status to alert severity."""
        normalized = (status or "").lower()
        if normalized in {"major_outage", "partial_outage", "unhealthy"}:
            return AlertSeverity.ERROR
        if normalized in {"degraded", "maintenance"}:
            return AlertSeverity.WARNING
        return AlertSeverity.INFO

    async def _evaluate_status_snapshot(self) -> List[Alert]:
        """Detect operational status changes between monitoring intervals."""
        if not self.status_getter:
            return []

        snapshot = await self.status_getter()
        if not self._last_status_snapshot:
            self._last_status_snapshot = snapshot
            return []

        alerts: List[Alert] = []
        previous = self._last_status_snapshot

        for provider_name, provider_state in snapshot.get("providers", {}).items():
            old_state = previous.get("providers", {}).get(provider_name, {})
            old_status = old_state.get("status")
            new_status = provider_state.get("status")
            if old_status == new_status:
                continue

            alerts.append(
                Alert(
                    rule_name=f"provider_status_{provider_name}",
                    severity=self._severity_from_status(new_status),
                    message=f"Provider route '{provider_name}' changed from {old_status or 'unknown'} to {new_status or 'unknown'}",
                    details={
                        "provider": provider_name,
                        "old_status": old_status,
                        "new_status": new_status,
                        "base_url": provider_state.get("base_url"),
                        "error": provider_state.get("error"),
                    },
                    timestamp=time.time(),
                )
            )

        for component_name, component_state in snapshot.get("components", {}).items():
            old_state = previous.get("components", {}).get(component_name, {})
            old_status = old_state.get("status")
            new_status = component_state.get("status")
            if old_status == new_status:
                continue

            alerts.append(
                Alert(
                    rule_name=f"component_status_{component_name}",
                    severity=self._severity_from_status(new_status),
                    message=f"Component '{component_name}' changed from {old_status or 'unknown'} to {new_status or 'unknown'}",
                    details={
                        "component": component_name,
                        "old_status": old_status,
                        "new_status": new_status,
                        "detail": component_state.get("detail"),
                    },
                    timestamp=time.time(),
                )
            )

        self._last_status_snapshot = snapshot
        return alerts

    def _collect_current_metrics(self) -> Dict[str, Any]:
        """Collect current system metrics."""
        if self.stats_getter:
            stats = self.stats_getter()
            return {
                'timestamp': time.time(),
                'requests_total': stats.get('requests_total', 0),
                'requests_allowed': stats.get('requests_allowed', 0),
                'requests_blocked': stats.get('requests_blocked', 0),
                'attacks_detected': stats.get('attacks_detected', 0),
                'errors': stats.get('errors', 0),
                'active_connections': 0,  # TODO: implement connection tracking
            }
        else:
            # Fallback to basic structure
            return {
                'timestamp': time.time(),
                'requests_total': 0,
                'requests_allowed': 0,
                'requests_blocked': 0,
                'attacks_detected': 0,
                'errors': 0,
                'active_connections': 0,
            }

    def get_metrics_text(self) -> str:
        """Get metrics in Prometheus format."""
        return self.metrics.get_metrics()
