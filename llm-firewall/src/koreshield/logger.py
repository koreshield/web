"""
Structured logging system for KoreShield.
"""

from typing import Any, Dict

import structlog


def setup_logging(log_level: str = "INFO", json_logs: bool = False):
    """
    Set up structured logging for the application.

    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_logs: Whether to output JSON logs (useful for production)
    """
    processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
    ]

    if json_logs:
        processors.append(structlog.processors.JSONRenderer())
    else:
        processors.extend([structlog.dev.ConsoleRenderer()])

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(structlog.processors, log_level.upper())
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
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
