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