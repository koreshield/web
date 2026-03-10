"""
Configuration management for KoreShield.
"""

import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml
from pydantic import BaseModel, Field


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
        storage_path: Optional[str] = None

    class Features(BaseModel):
        sanitization: bool = True
        detection: bool = True
        policy_enforcement: bool = True

    lists: Lists = Lists()
    features: Features = Features()


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
        providers = {}
        for name, config in providers_data.items():
            # Get API key from environment if not specified
            api_key_env = f"{name.upper()}_API_KEY"
            if 'api_key' not in config and api_key_env in os.environ:
                config['api_key'] = os.environ[api_key_env]
            providers[name] = ProviderConfig(**config)

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
