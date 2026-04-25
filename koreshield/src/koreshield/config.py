"""
Configuration management for KoreShield.
"""

import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml
from pydantic import BaseModel, Field, field_validator


class ServerConfig(BaseModel):
    """Server configuration."""
    host: str = "0.0.0.0"
    port: int = 8000


class LoggingConfig(BaseModel):
    """Logging configuration."""
    level: str = "INFO"
    json_logs: bool = False
    container_mode: bool = False
    file: Optional[str] = None


class SecurityConfig(BaseModel):
    """Security configuration."""
    sensitivity: str = "medium"
    default_action: str = "block"

    class Lists(BaseModel):
        class FeedSource(BaseModel):
            name: str
            source: str
            enabled: bool = True
            list_type: str = "blocklist"
            default_entry_type: str = "keyword"

        storage_path: Optional[str] = None
        feeds: List[FeedSource] = Field(default_factory=list)

    class Features(BaseModel):
        sanitization: bool = True
        detection: bool = True
        policy_enforcement: bool = True

    lists: Optional[Lists] = None
    features: Features = Features()

    @field_validator("lists", mode="before")
    def _default_lists(cls, value):  # noqa: N805 - Pydantic validator signature
        return value or {}


class ProviderConfig(BaseModel):
    """Provider configuration."""
    enabled: bool = False
    base_url: str = ""
    api_key: Optional[str] = None


class RedisConfig(BaseModel):
    """Redis configuration for distributed state."""
    enabled: bool = True
    url: str = "redis://localhost:6379/0"


class AlertRule(BaseModel):
    """Alert rule configuration."""
    name: str
    condition: str
    severity: str = "warning"
    cooldown: int = 300
    channels: List[str] = []


class EmailChannel(BaseModel):
    """Email alert channel configuration."""
    enabled: bool = False
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    username: str = ""
    password: str = ""
    from_address: str = ""
    to_addresses: List[str] = []


class SlackChannel(BaseModel):
    """Slack alert channel configuration."""
    enabled: bool = False
    webhook_url: str = ""


class TeamsChannel(BaseModel):
    """Microsoft Teams alert channel configuration."""
    enabled: bool = False
    webhook_url: str = ""


class TelegramChannel(BaseModel):
    """Telegram alert channel configuration."""
    enabled: bool = Field(
        default_factory=lambda: (
            (os.getenv("TELEGRAM_ALERTS_ENABLED", "").strip().lower() in {"1", "true", "yes", "on"})
            or bool(os.getenv("TELEGRAM_BOT_TOKEN", "").strip() and os.getenv("TELEGRAM_CHANNEL_ID", "").strip())
        )
    )
    bot_token: str = Field(default_factory=lambda: os.getenv("TELEGRAM_BOT_TOKEN", ""))
    channel_id: str = Field(default_factory=lambda: os.getenv("TELEGRAM_CHANNEL_ID", ""))
    message_thread_id: Optional[str] = Field(default_factory=lambda: os.getenv("TELEGRAM_MESSAGE_THREAD_ID", "") or None)
    health_digest_enabled: bool = Field(
        default_factory=lambda: os.getenv(
    "TELEGRAM_HEALTH_DIGEST_ENABLED",
    "true").strip().lower() in {
        "1",
        "true",
        "yes",
         "on"}
    )
    health_digest_interval_minutes: int = Field(
        default_factory=lambda: int(os.getenv("TELEGRAM_HEALTH_DIGEST_INTERVAL_MINUTES", "15") or "15")
    )
    minimum_interval_seconds: float = Field(
        default_factory=lambda: float(os.getenv("TELEGRAM_MINIMUM_INTERVAL_SECONDS", "1.0") or "1.0")
    )
    include_payload: bool = Field(
        default_factory=lambda: os.getenv(
    "TELEGRAM_INCLUDE_ALERT_PAYLOAD",
    "true").strip().lower() in {
        "1",
        "true",
        "yes",
         "on"}
    )


class PagerDutyChannel(BaseModel):
    """PagerDuty alert channel configuration."""
    enabled: bool = False
    api_key: str = ""
    integration_key: str = ""


class WebhookChannel(BaseModel):
    """Generic webhook alert channel configuration."""
    enabled: bool = False
    url: str = ""
    headers: Dict[str, str] = {}


class AlertChannels(BaseModel):
    """Alert channels configuration."""
    email: EmailChannel = EmailChannel()
    slack: SlackChannel = SlackChannel()
    teams: TeamsChannel = TeamsChannel()
    telegram: TelegramChannel = TelegramChannel()
    pagerduty: PagerDutyChannel = PagerDutyChannel()
    webhook: WebhookChannel = WebhookChannel()


class AlertingConfig(BaseModel):
    """Alerting configuration."""
    enabled: bool = True
    check_interval: int = 60
    rules: List[AlertRule] = []
    channels: AlertChannels = AlertChannels()


class MonitoringConfig(BaseModel):
    """Monitoring configuration."""
    enabled: bool = True
    metrics_port: int = 9090
    collect_interval: int = 30
    alerts: AlertingConfig = AlertingConfig()


class KoreShieldConfig(BaseModel):
    """Main configuration class."""
    server: ServerConfig = ServerConfig()
    logging: LoggingConfig = LoggingConfig()
    security: SecurityConfig = SecurityConfig()
    providers: Dict[str, ProviderConfig] = {}
    redis: RedisConfig = RedisConfig()
    monitoring: MonitoringConfig = MonitoringConfig()

    # Legacy fields for backward compatibility
    alerting: Optional[Dict[str, Any]] = None

    def load_from_dict(self, data: Dict[str, Any]) -> None:
        """Load configuration from dictionary."""
        # Handle providers separately as they're dynamic
        providers_data = data.pop('providers', {})
        legacy_alerting = data.pop('alerting', None)
        providers = {}
        for name, config in providers_data.items():
            # Get API key from environment if not specified
            api_key_env = f"{name.upper()}_API_KEY"
            if 'api_key' not in config and api_key_env in os.environ:
                config['api_key'] = os.environ[api_key_env]
            providers[name] = ProviderConfig(**config)

        monitoring_data = data.get("monitoring", {}) or {}
        if legacy_alerting:
            monitoring_data["alerts"] = {
                "enabled": legacy_alerting.get("enabled", True),
                "check_interval": monitoring_data.get("check_interval_seconds", 60),
                "rules": [
                    {
                        "name": rule.get("name"),
                        "condition": rule.get("condition"),
                        "severity": rule.get("severity", "warning"),
                        "cooldown": int(rule.get("cooldown_minutes", 5)) * 60,
                        "channels": rule.get("channels", []),
                    }
                    for rule in legacy_alerting.get("rules", [])
                ],
                "channels": {
                    "email": {
                        "enabled": legacy_alerting.get("email", {}).get("enabled", False),
                        "smtp_server": legacy_alerting.get("email", {}).get("smtp_server", "smtp.gmail.com"),
                        "smtp_port": legacy_alerting.get("email", {}).get("smtp_port", 587),
                        "username": legacy_alerting.get("email", {}).get("username", ""),
                        "password": legacy_alerting.get("email", {}).get("password", ""),
                        "from_address": legacy_alerting.get("email", {}).get("from_address", ""),
                        "to_addresses": legacy_alerting.get("email", {}).get("recipients", []),
                    },
                    "slack": legacy_alerting.get("slack", {}),
                    "teams": legacy_alerting.get("teams", {}),
                    "telegram": legacy_alerting.get("telegram", {}),
                    "pagerduty": {
                        "enabled": legacy_alerting.get("pagerduty", {}).get("enabled", False),
                        "integration_key": legacy_alerting.get("pagerduty", {}).get("routing_key", ""),
                    },
                    "webhook": legacy_alerting.get("webhook", {}),
                },
            }
        data["monitoring"] = monitoring_data

        # Create config object
        config_obj = self.__class__(**data)
        config_obj.providers = providers

        # Copy all attributes
        for key, value in config_obj.__dict__.items():
            setattr(self, key, value)


class Config:
    """Configuration manager singleton."""

    _instance: Optional['Config'] = None
    _config: Optional[KoreShieldConfig] = None

    def __new__(cls) -> 'Config':
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def load(self, config_path: str = "config/config.yaml") -> None:
        """Load configuration from file."""
        config_file = Path(config_path)

        if not config_file.exists():
            raise FileNotFoundError(f"Configuration file not found: {config_file}")

        with open(config_file, 'r') as f:
            content = f.read()
            # Support environment variable expansion in YAML: ${VAR_NAME}
            expanded_content = os.path.expandvars(content)
            data = yaml.safe_load(expanded_content) or {}

        self._config = KoreShieldConfig()
        self._config.load_from_dict(data)

    @property
    def config(self) -> KoreShieldConfig:
        """Get configuration object."""
        if self._config is None:
            self.load()
        assert self._config is not None  # Should be set by load()
        return self._config

    def __getattr__(self, name: str) -> Any:
        """Delegate attribute access to config object."""
        return getattr(self.config, name)
