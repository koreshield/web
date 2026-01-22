"""Exceptions for KoreShield SDK."""


class KoreShieldError(Exception):
    """Base exception for KoreShield SDK errors."""

    def __init__(self, message: str, status_code: int = None, response_data: dict = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.response_data = response_data or {}


class AuthenticationError(KoreShieldError):
    """Raised when authentication fails."""
    pass


class ValidationError(KoreShieldError):
    """Raised when request validation fails."""
    pass


class RateLimitError(KoreShieldError):
    """Raised when rate limit is exceeded."""
    pass


class ServerError(KoreShieldError):
    """Raised when server returns an error."""
    pass


class NetworkError(KoreShieldError):
    """Raised when network communication fails."""
    pass


class TimeoutError(KoreShieldError):
    """Raised when request times out."""
    pass