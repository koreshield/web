"""Integrations with popular frameworks and libraries."""

# Optional imports for langchain integration
try:
    from .langchain import (
        KoreShieldCallbackHandler,
        AsyncKoreShieldCallbackHandler,
        create_koreshield_callback,
        create_async_koreshield_callback,
    )
    _langchain_available = True
except ImportError:
    _langchain_available = False

from .frameworks import (
    FastAPIIntegration,
    FlaskIntegration,
    DjangoIntegration,
    create_fastapi_middleware,
    create_flask_middleware,
    create_django_middleware,
)

__all__ = [
    "FastAPIIntegration",
    "FlaskIntegration",
    "DjangoIntegration",
    "create_fastapi_middleware",
    "create_flask_middleware",
    "create_django_middleware",
]

if _langchain_available:
    __all__.extend([
        "KoreShieldCallbackHandler",
        "AsyncKoreShieldCallbackHandler",
        "create_koreshield_callback",
        "create_async_koreshield_callback",
    ])