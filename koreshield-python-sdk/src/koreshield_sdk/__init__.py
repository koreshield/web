"""KoreShield Python SDK - LLM Security Platform SDK

A comprehensive Python SDK for integrating KoreShield's LLM security features
into your applications with ease.
"""

from .client import KoreShieldClient
from .async_client import AsyncKoreShieldClient
from .exceptions import (
    KoreShieldError,
    AuthenticationError,
    ValidationError,
    RateLimitError,
    ServerError,
    NetworkError,
    TimeoutError,
)
from .types import (
    DetectionResult,
    ScanRequest,
    ScanResponse,
    ThreatLevel,
    DetectionType,
    AuthConfig,
    SecurityPolicy,
    PerformanceMetrics,
    StreamingScanResponse,
    DetectionIndicator,
    BatchScanRequest,
    BatchScanResponse,
)
from .types import (
    RAGDocument,
    RAGScanRequest,
    RAGScanResponse,
    DocumentThreat,
    CrossDocumentThreat,
)

__version__ = "0.3.0"
__all__ = [
    "KoreShieldClient",
    "AsyncKoreShieldClient",
    "KoreShieldError",
    "AuthenticationError",
    "ValidationError",
    "RateLimitError",
    "ServerError",
    "NetworkError",
    "TimeoutError",
    "DetectionResult",
    "ScanRequest",
    "ScanResponse",
    "ThreatLevel",
    "DetectionType",
    "AuthConfig",
    "SecurityPolicy",
    "PerformanceMetrics",
    "StreamingScanResponse",
    "DetectionIndicator",
    "BatchScanRequest",
    "BatchScanResponse",
    "RAGDocument",
    "RAGScanRequest",
    "RAGScanResponse",
    "DocumentThreat",
    "CrossDocumentThreat",
]