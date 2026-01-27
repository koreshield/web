"""Type definitions for KoreShield SDK."""

from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, ConfigDict


class ThreatLevel(str, Enum):
    """Threat level enumeration."""
    SAFE = "safe"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class DetectionType(str, Enum):
    """Detection type enumeration."""
    KEYWORD = "keyword"
    PATTERN = "pattern"
    RULE = "rule"
    ML = "ml"
    BLOCKLIST = "blocklist"
    ALLOWLIST = "allowlist"


class DetectionIndicator(BaseModel):
    """Individual detection indicator."""
    type: DetectionType
    severity: ThreatLevel
    confidence: float = Field(ge=0.0, le=1.0)
    description: str
    metadata: Optional[Dict[str, Any]] = None


class DetectionResult(BaseModel):
    """Result of a security scan."""
    is_safe: bool
    threat_level: ThreatLevel
    confidence: float = Field(ge=0.0, le=1.0)
    indicators: List[DetectionIndicator] = Field(default_factory=list)
    processing_time_ms: float
    scan_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class ScanRequest(BaseModel):
    """Request for security scanning."""
    prompt: str
    context: Optional[Dict[str, Any]] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(extra="allow")  # Allow extra fields


class ScanResponse(BaseModel):
    """Response from security scanning."""
    result: DetectionResult
    request_id: str
    timestamp: str
    version: str


class AuthConfig(BaseModel):
    """Authentication configuration."""
    api_key: str
    base_url: str = "https://api.koreshield.com"
    timeout: float = 30.0
    retry_attempts: int = 3
    retry_delay: float = 1.0


class BatchScanRequest(BaseModel):
    """Request for batch security scanning."""
    requests: List[ScanRequest]
    parallel: bool = True
    max_concurrent: int = 10


class BatchScanResponse(BaseModel):
    """Response from batch security scanning."""
    results: List[ScanResponse]
    total_processed: int
    total_safe: int
    total_unsafe: int
    processing_time_ms: float
    request_id: str
    timestamp: str
    version: str


class StreamingScanRequest(BaseModel):
    """Request for streaming security scanning."""
    content: str
    chunk_size: int = 1000
    overlap: int = 100
    context: Optional[Dict[str, Any]] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(extra="allow")


class StreamingScanResponse(BaseModel):
    """Response from streaming security scanning."""
    chunk_results: List[DetectionResult]
    overall_result: DetectionResult
    total_chunks: int
    processing_time_ms: float
    request_id: str
    timestamp: str
    version: str


class SecurityPolicy(BaseModel):
    """Custom security policy configuration."""
    name: str
    description: Optional[str] = None
    threat_threshold: ThreatLevel = ThreatLevel.MEDIUM
    blocked_detection_types: List[DetectionType] = Field(default_factory=list)
    custom_rules: List[Dict[str, Any]] = Field(default_factory=list)
    allowlist_patterns: List[str] = Field(default_factory=list)
    blocklist_patterns: List[str] = Field(default_factory=list)
    metadata: Optional[Dict[str, Any]] = None


class PerformanceMetrics(BaseModel):
    """SDK performance and usage metrics."""
    total_requests: int = 0
    total_processing_time_ms: float = 0.0
    average_response_time_ms: float = 0.0
    requests_per_second: float = 0.0
    error_count: int = 0
    cache_hit_rate: float = 0.0
    batch_efficiency: float = 0.0
    streaming_chunks_processed: int = 0
    uptime_seconds: float = 0.0
    memory_usage_mb: Optional[float] = None
    custom_metrics: Dict[str, Any] = Field(default_factory=dict)