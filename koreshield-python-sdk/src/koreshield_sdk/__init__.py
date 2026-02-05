"""KoreShield Python SDK - LLM Security Platform SDK

A comprehensive Python SDK for integrating KoreShield's LLM security features
into your applications with ease.
"""

from .client import KoreShieldClient
from .async_client import AsyncKoreShieldClient
from .exceptions import KoreShieldError, AuthenticationError, ValidationError, RateLimitError
from .types import (
    DetectionResult,
    ScanRequest,
    ScanResponse,
    ThreatLevel,
    DetectionType,
    AuthConfig,
)
# RAG Imports
from .types import (
    RAGDocument,
    RAGScanRequest,
    RAGScanResponse,
    DocumentThreat,
    CrossDocumentThreat,
)

__version__ = "0.2.0"
__all__ = [
    "KoreShieldClient",
    "AsyncKoreShieldClient",
    "KoreShieldError",
    "AuthenticationError",
    "ValidationError",
    "RateLimitError",
    "DetectionResult",
    "ScanRequest",
    "ScanResponse",
    "ThreatLevel",
    "DetectionType",
    "AuthConfig",
    # RAG Types
    "RAGDocument",
    "RAGScanRequest",
    "RAGScanResponse",
    "DocumentThreat",
    "CrossDocumentThreat",
]