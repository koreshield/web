"""
Main entry point for the LLM Firewall application.
"""

import os
import re
from pathlib import Path
import yaml
import structlog
import uvicorn
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from .logger import setup_logging  # noqa: E402
from .proxy import KoreShieldProxy  # noqa: E402

logger = structlog.get_logger(__name__)


def expand_env_vars(config: dict) -> dict:
    """
    Recursively expand environment variables in configuration values.
    Supports ${VAR_NAME} and $VAR_NAME syntax.
    """
    if isinstance(config, dict):
        return {key: expand_env_vars(value) for key, value in config.items()}
    elif isinstance(config, list):
        return [expand_env_vars(item) for item in config]
    elif isinstance(config, str):
        # Expand ${VAR} and $VAR syntax
        def replace_var(match):
            var_name = match.group(1) or match.group(2)
            return os.getenv(var_name, match.group(0))  # Return original if not found

        # Pattern matches both ${VAR} and $VAR
        pattern = re.compile(r'\$\{([^}]+)\}|\$([A-Z_][A-Z0-9_]*)')
        return pattern.sub(replace_var, config)
    else:
        return config


def load_config(config_path: str = "config/config.yaml") -> dict:
    """
    Load configuration from YAML file.

    Args:
        config_path: Path to configuration file

    Returns:
        Configuration dictionary
    """
    config_file = Path(config_path)

    if not config_file.exists():
        # Try example config
        example_config = Path("config/config.example.yaml")
        if example_config.exists():
            logger.warning(f"{config_path} not found. Using example config.")
            config_file = example_config
        else:
            logger.warning("No config file found. Using defaults.")
            return {}

    with open(config_file, "r") as f:
        config = yaml.safe_load(f) or {}

    # Expand environment variables in the configuration
    return expand_env_vars(config)


def validate_config(config: dict) -> list[str]:
    """
    Validate loaded configuration and return human-readable issues.
    """
    issues: list[str] = []
    security = config.get("security", {})
    sensitivity = security.get("sensitivity")
    if sensitivity and sensitivity not in {"low", "medium", "high"}:
        issues.append("security.sensitivity must be one of: low, medium, high")

    server = config.get("server", {})
    port = server.get("port")
    if port is not None and not isinstance(port, int):
        issues.append("server.port must be an integer")

    providers = config.get("providers", {})
    openai_cfg = providers.get("openai", {})
    if openai_cfg.get("enabled", True) and not os.getenv("OPENAI_API_KEY"):
        issues.append("OPENAI_API_KEY not set - OpenAI provider will not work")

    return issues


# Expose app for uvicorn
# Load config relative to project root or default
try:
    config = load_config()
    # Set up logging early
    log_config = config.get("logging", {})
    setup_logging(
        log_level=log_config.get("level", "INFO"),
        json_logs=log_config.get("json_logs", False),
        container_mode=log_config.get("container_mode", False)
    )

    proxy = KoreShieldProxy(config)
    app = proxy.app
except Exception as e:
    logger.error("Failed to initialize app", error=str(e))
    # Fallback/dummy app to prevent import error crashing uvicorn immediately if config fails
    # But usually we want it to fail specific to config
    raise e


def main(config_path: str = "config/config.yaml"):
    """
    Main entry point for script execution.
    """
    # ... existing main logic if needed, or just run uvicorn on the global app ...
    # Get server config
    host = config.get("server", {}).get("host", "0.0.0.0")
    port = config.get("server", {}).get("port", 8000)
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    main()
