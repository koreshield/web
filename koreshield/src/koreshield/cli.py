"""
Command-line interface for KoreShield.
"""

import argparse
import os
import sys

import structlog

from .logger import setup_logging
from .main import load_config, validate_config


def create_parser():
    """Create command-line argument parser."""
    parser = argparse.ArgumentParser(
        description="KoreShield - Protect your LLM integrations from prompt injection attacks",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Start KoreShield with default settings
  koreshield start

  # Start on custom port
  koreshield start --port 9000

  # Start with debug logging
  koreshield start --log-level DEBUG

  # Check configuration
  koreshield check-config

  # Show version
  koreshield version
        """,
    )

    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Start command
    start_parser = subparsers.add_parser("start", help="Start the KoreShield server")
    start_parser.add_argument(
        "--host", default=None, help="Host to bind to (default: from config or 0.0.0.0)"
    )
    start_parser.add_argument(
        "--port", type=int, default=None, help="Port to listen on (default: from config or 8000)"
    )
    start_parser.add_argument(
        "--config",
        default=os.getenv("CONFIG_FILE", "config/config.yaml"),
        help="Path to configuration file (default: from CONFIG_FILE env var or config/config.yaml)",
    )
    start_parser.add_argument(
        "--log-level",
        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
        default=None,
        help="Logging level (overrides config)",
    )
    start_parser.add_argument("--json-logs", action="store_true", help="Output logs in JSON format")
    start_parser.add_argument("--container-mode", action="store_true", help="Run in container mode (stdout logging only)")

    # Check config command
    check_parser = subparsers.add_parser("check-config", help="Validate configuration file")
    check_parser.add_argument(
        "--config", default="config/config.yaml", help="Path to configuration file to check"
    )

    # Version command
    subparsers.add_parser("version", help="Show version information")

    return parser


def check_config(config_path: str) -> bool:
    """Check if configuration is valid."""
    try:
        config = load_config(config_path)
        print(f"✓ Configuration file loaded: {config_path}")

        # Validate configuration using shared validator
        issues = validate_config(config)
        if issues:
            print("\nIssues found:")
            for issue in issues:
                print(f"   {issue}")
            return False
        else:
            print("\n✓ Configuration looks good!")
            return True

    except Exception as e:
        print(f"✗ Error loading configuration: {e}")
        return False


def run_start(args):
    """Run the start command."""
    # Load config
    config = load_config(args.config)

    # Override with CLI args
    if args.host:
        config.setdefault("server", {})["host"] = args.host
    if args.port:
        config.setdefault("server", {})["port"] = args.port
    if args.log_level:
        config.setdefault("logging", {})["level"] = args.log_level
    if args.json_logs:
        config.setdefault("logging", {})["json_logs"] = True
    if args.container_mode:
        config.setdefault("logging", {})["container_mode"] = True

    # Set up logging
    log_config = config.get("logging", {})
    setup_logging(
        log_level=log_config.get("level", "INFO"),
        json_logs=log_config.get("json_logs", False),
        container_mode=log_config.get("container_mode", False)
    )

    logger = structlog.get_logger(__name__)

    # Check API key
    if not os.getenv("OPENAI_API_KEY"):
        logger.warning("OPENAI_API_KEY not set - OpenAI provider will not work")

    # Start server
    logger.info("Starting KoreShield", version="0.1.0")
    from .main import main as run_main

    run_main(args.config)


def run_check_config(args):
    """Run the check-config command."""
    success = check_config(args.config)
    sys.exit(0 if success else 1)


def run_version():
    """Show version information."""
    try:
        from . import __version__

        version = __version__
    except ImportError:
        version = "0.1.0"
    print(f"KoreShield v{version}")
    print("A middleware proxy for protecting LLM integrations from prompt injection attacks")


def main_cli():
    """Main CLI entry point."""
    parser = create_parser()
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    if args.command == "start":
        run_start(args)
    elif args.command == "check-config":
        run_check_config(args)
    elif args.command == "version":
        run_version()
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main_cli()
