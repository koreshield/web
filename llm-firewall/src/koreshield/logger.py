"""
Structured logging system for KoreShield.
"""

from typing import Any, Dict

import structlog



import logging
import os
from logging.handlers import RotatingFileHandler
import sys

def setup_logging(log_level: str = "INFO", json_logs: bool = True, container_mode: bool = False):
    """
    Set up structured logging for the application.

    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_logs: Whether to output JSON logs (default True for easier parsing)
        container_mode: Whether to run in container mode (stdout only, no file logging)
    """
    # Clear existing handlers
    root_logger.handlers = []

    # File Handler (JSONL) - only if not in container mode
    if not container_mode:
        # Create logs directory if it doesn't exist
        log_dir = "logs"
        os.makedirs(log_dir, exist_ok=True)
        log_file = os.path.join(log_dir, "koreshield.log")

        file_handler = RotatingFileHandler(
            log_file, maxBytes=10 * 1024 * 1024, backupCount=5, encoding="utf-8"
        )
        root_logger.addHandler(file_handler)

    # Stream Handler (Stdout) - always present
    stream_handler = logging.StreamHandler(sys.stdout)
    root_logger.addHandler(stream_handler)

    processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if json_logs:
        processors.append(structlog.processors.JSONRenderer())
    else:
        processors.append(structlog.dev.ConsoleRenderer())

    # Configure structlog to wrap standard logging
    structlog.configure(
        processors=processors,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )



class FirewallLogger:
    """
    Logger for KoreShield-specific events.
    """

    def __init__(self):
        self.logger = structlog.get_logger(__name__)

    def log_request(self, request_id: str, method: str, path: str, **kwargs):
        """Log an incoming request."""
        self.logger.info(
            "request_received", request_id=request_id, method=method, path=path, **kwargs
        )

    def log_attack(self, request_id: str, attack_type: str, details: Dict[str, Any]):
        """Log a detected attack attempt."""
        self.logger.warning(
            "attack_detected", request_id=request_id, attack_type=attack_type, **details
        )

    def log_blocked(self, request_id: str, reason: str):
        """Log a blocked request."""
        self.logger.warning("request_blocked", request_id=request_id, reason=reason)

    def log_allowed(self, request_id: str):
        """Log an allowed request."""
        self.logger.info("request_allowed", request_id=request_id)
