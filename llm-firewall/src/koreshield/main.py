"""
Main entry point for the LLM Firewall application.
"""

import os
from pathlib import Path

import structlog
import uvicorn
import yaml

from .logger import setup_logging
from .proxy import KoreShieldProxy


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
            print(f"Warning: {config_path} not found. Using example config.")
            config_file = example_config
        else:
            print("Warning: No config file found. Using defaults.")
            return {}

    with open(config_file, "r") as f:
        return yaml.safe_load(f) or {}


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


def main(config_path: str = "config/config.yaml"):
    """
    Main entry point.

    Args:
        config_path: Path to configuration file
    """
    # Load configuration
    config = load_config(config_path)

    # Set up logging
    log_config = config.get("logging", {})
    setup_logging(
        log_level=log_config.get("level", "INFO"), json_logs=log_config.get("json_logs", False)
    )

    logger = structlog.get_logger(__name__)

    # Surface validation issues but do not prevent startup
    for issue in validate_config(config):
        logger.warning("config_issue", detail=issue)

    logger.info("Starting LLM Firewall Community", version="0.1.0")

    # Create proxy instance
    proxy = KoreShieldProxy(config)

    # Get server config
    host = config.get("server", {}).get("host", "0.0.0.0")
    port = config.get("server", {}).get("port", 8000)

    # Run the server
    uvicorn.run(proxy.app, host=host, port=port, log_config=None)  # We're using structlog


if __name__ == "__main__":
    main()
