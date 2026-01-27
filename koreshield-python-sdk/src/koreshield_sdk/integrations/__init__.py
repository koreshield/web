"""Integrations with popular frameworks and libraries."""

from .langchain import (
    KoreShieldCallbackHandler,
    AsyncKoreShieldCallbackHandler,
    create_koreshield_callback,
    create_async_koreshield_callback,
)
from .frameworks import (
    FastAPIIntegration,
    FlaskIntegration,
    DjangoIntegration,
    create_fastapi_middleware,
    create_flask_middleware,
    create_django_middleware,
)

__all__ = [
    "KoreShieldCallbackHandler",
    "AsyncKoreShieldCallbackHandler",
    "create_koreshield_callback",
    "create_async_koreshield_callback",
    "FastAPIIntegration",
    "FlaskIntegration",
    "DjangoIntegration",
    "create_fastapi_middleware",
    "create_flask_middleware",
    "create_django_middleware",
]