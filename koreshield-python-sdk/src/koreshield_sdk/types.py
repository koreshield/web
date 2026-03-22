"""Type definitions for KoreShield SDK."""

from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import AliasChoices, BaseModel, Field, ConfigDict, model_validator


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


class ToolRiskClass(str, Enum):
    """Risk class for local tool-call security decisions."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ToolCapability(str, Enum):
    """Normalized capability categories for tool-call analysis."""
    READ = "read"
    WRITE = "write"
    NETWORK = "network"
    EXECUTION = "execution"
    DATABASE = "database"
    CREDENTIAL_ACCESS = "credential_access"


class DetectionIndicator(BaseModel):
    """Individual detection indicator."""
    type: DetectionType
    severity: ThreatLevel
    confidence: float = Field(ge=0.0, le=1.0)
    description: str
    metadata: Optional[Dict[str, Any]] = None


class NormalizationResult(BaseModel):
    """Normalized text details for local preflight scanning."""
    original: str
    normalized: str
    layers: List[str] = Field(default_factory=list)


class DetectionResult(BaseModel):
    """Result of a security scan."""
    is_safe: bool
    threat_level: ThreatLevel
    confidence: float = Field(ge=0.0, le=1.0)
    indicators: List[DetectionIndicator] = Field(default_factory=list)
    processing_time_ms: float
    scan_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class LocalPreflightResult(BaseModel):
    """Result of local preflight scanning without a network request."""
    blocked: bool
    is_safe: bool
    threat_level: ThreatLevel
    confidence: float = Field(ge=0.0, le=1.0)
    normalization: NormalizationResult
    indicators: List[DetectionIndicator] = Field(default_factory=list)
    suggested_action: str


class ToolCallPreflightResult(LocalPreflightResult):
    """Result of local tool-call preflight scanning."""
    tool_name: str
    risky_tool: bool
    reasons: List[str] = Field(default_factory=list)
    risk_class: ToolRiskClass = ToolRiskClass.LOW
    capability_signals: List[ToolCapability] = Field(default_factory=list)
    review_required: bool = False


class ToolScanPolicyViolation(BaseModel):
    """Policy violation returned from server-side tool scan."""
    policy: str
    severity: str
    details: Dict[str, Any]
    policy_id: Optional[str] = None


class ToolScanPolicyResult(BaseModel):
    """Policy result for server-side tool-call scanning."""
    allowed: bool
    action: str
    reason: str
    policy_violations: List[ToolScanPolicyViolation] = Field(default_factory=list)
    user_role: Optional[str] = None
    permissions: List[str] = Field(default_factory=list)
    bypass_allowed: Optional[bool] = None
    review_required: Optional[bool] = None
    risk_class: Optional[ToolRiskClass] = None


class ToolScanResponse(BaseModel):
    """Response from server-side tool-call scanning."""
    scan_id: str
    tool_name: str
    allowed: bool
    blocked: bool
    action: str
    risk_class: ToolRiskClass
    risky_tool: bool
    review_required: bool
    capability_signals: List[ToolCapability] = Field(default_factory=list)
    confidence: float
    indicators: List[Dict[str, Any]] = Field(default_factory=list)
    reasons: List[str] = Field(default_factory=list)
    normalization: Dict[str, Any]
    policy_result: ToolScanPolicyResult
    processing_time_ms: float
    timestamp: str


class DocumentThreatMetadata(BaseModel):
    """Structured metadata emitted for document-level RAG threats."""
    base_detection_confidence: Optional[float] = None
    rag_pattern_confidence: Optional[float] = None
    query_similarity: Optional[float] = None
    directive_score: Optional[float] = None
    query_mismatch: bool = False
    high_directive_density: bool = False
    matched_on_normalized_text: bool = False
    threat_indicators: List[str] = Field(default_factory=list)
    normalization_layers: List[str] = Field(default_factory=list)
    document_metadata: Dict[str, Any] = Field(default_factory=dict)


class CrossDocumentThreatMetadata(BaseModel):
    """Structured metadata emitted for cross-document RAG threats."""
    supporting_indicators: List[str] = Field(default_factory=list)
    document_count: Optional[int] = None
    coordinated: Optional[bool] = None


class RAGStatistics(BaseModel):
    """Structured RAG statistics for API/UI consumption."""
    total_documents_scanned: int = 0
    documents_with_threats: int = 0
    total_threats_found: int = 0
    documents_with_query_mismatch: int = 0
    documents_with_directive_density: int = 0
    documents_normalized: int = 0
    min_query_similarity: Optional[float] = None
    max_directive_score: Optional[float] = None

    @model_validator(mode="before")
    @classmethod
    def _normalize_statistics(cls, value: Any) -> Any:
        if not isinstance(value, dict):
            return value
        data = dict(value)
        if "total_documents_scanned" not in data and "total_documents" in data:
            data["total_documents_scanned"] = data["total_documents"]
        if "documents_with_threats" not in data and "threatening_documents" in data:
            data["documents_with_threats"] = data["threatening_documents"]
        if "total_threats_found" not in data and "threats_found" in data:
            data["total_threats_found"] = data["threats_found"]
        return data


class QueryAnalysis(BaseModel):
    """Top-level query analysis envelope returned by the API."""
    is_attack: bool
    details: Dict[str, Any]


class RAGPreflightDocumentResult(LocalPreflightResult):
    """Local preflight result for an individual retrieved document."""
    document_id: str
    query_similarity: float
    directive_score: float
    metadata: Optional[Dict[str, Any]] = None


class RAGPreflightResult(BaseModel):
    """Aggregate local preflight result across retrieved documents."""
    blocked: bool
    is_safe: bool
    threat_level: ThreatLevel
    confidence: float
    user_query: str
    documents: List[RAGPreflightDocumentResult]
    suggested_action: str


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
    version: Optional[str] = None


# RAG Detection Types (from HEAD)

class InjectionVector(str, Enum):
    """RAG injection vector taxonomy."""
    EMAIL = "email"
    DOCUMENT = "document"
    WEB_SCRAPING = "web_scraping"
    DATABASE = "database"
    CHAT_MESSAGE = "chat_message"
    CUSTOMER_SUPPORT = "customer_support"
    KNOWLEDGE_BASE = "knowledge_base"
    API_INTEGRATION = "api_integration"
    UNKNOWN = "unknown"


class OperationalTarget(str, Enum):
    """RAG operational target taxonomy."""
    DATA_EXFILTRATION = "data_exfiltration"
    PRIVILEGE_ESCALATION = "privilege_escalation"
    ACCESS_CONTROL_BYPASS = "access_control_bypass"
    CONTEXT_POISONING = "context_poisoning"
    SYSTEM_PROMPT_LEAKING = "system_prompt_leaking"
    MISINFORMATION = "misinformation"
    RECONNAISSANCE = "reconnaissance"
    UNKNOWN = "unknown"


class PersistenceMechanism(str, Enum):
    """RAG persistence mechanism taxonomy."""
    SINGLE_TURN = "single_turn"
    MULTI_TURN = "multi_turn"
    CONTEXT_PERSISTENCE = "context_persistence"
    NON_PERSISTENT = "non_persistent"


class EnterpriseContext(str, Enum):
    """Enterprise context taxonomy."""
    CRM = "crm"
    SALES = "sales"
    CUSTOMER_SUPPORT = "customer_support"
    MARKETING = "marketing"
    HEALTHCARE = "healthcare"
    FINANCIAL_SERVICES = "financial_services"
    GENERAL = "general"


class DetectionComplexity(str, Enum):
    """Detection complexity taxonomy."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class RAGDocument(BaseModel):
    """Document to be scanned in RAG context."""
    id: str
    content: str
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

    model_config = ConfigDict(extra="allow")


class DocumentThreat(BaseModel):
    """Individual document-level threat."""
    document_id: str
    severity: ThreatLevel
    confidence: float
    patterns_matched: List[str] = Field(default_factory=list, validation_alias=AliasChoices("patterns_matched", "indicators"))
    injection_vectors: List[InjectionVector] = Field(default_factory=list)
    operational_targets: List[OperationalTarget] = Field(default_factory=list)
    metadata: Optional[DocumentThreatMetadata] = None
    document_index: Optional[int] = None
    threat_type: Optional[str] = None
    excerpts: List[str] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def _normalize_document_threat(cls, value: Any) -> Any:
        if not isinstance(value, dict):
            return value
        data = dict(value)
        if "injection_vectors" not in data and "injection_vector" in data:
            data["injection_vectors"] = [data["injection_vector"]]
        if "operational_targets" not in data and "operational_target" in data:
            data["operational_targets"] = [data["operational_target"]]
        return data


class CrossDocumentThreat(BaseModel):
    """Cross-document threat detected across multiple documents."""
    threat_type: str  # "staged_attack", "coordinated_instructions", "temporal_chain"
    severity: ThreatLevel
    confidence: float
    document_ids: List[str]
    description: str
    patterns: List[str]
    metadata: Optional[CrossDocumentThreatMetadata] = None


class TaxonomyClassification(BaseModel):
    """5-dimensional taxonomy classification."""
    injection_vectors: List[InjectionVector]
    operational_targets: List[OperationalTarget]
    persistence_mechanisms: List[PersistenceMechanism]
    enterprise_contexts: List[EnterpriseContext]
    detection_complexity: DetectionComplexity


class ContextAnalysis(BaseModel):
    """RAG context analysis results."""
    document_threats: List[DocumentThreat]
    cross_document_threats: List[CrossDocumentThreat]
    statistics: RAGStatistics
    is_safe: Optional[bool] = None
    overall_severity: Optional[ThreatLevel] = None
    overall_confidence: Optional[float] = None
    injection_vectors: List[InjectionVector] = Field(default_factory=list)
    operational_targets: List[OperationalTarget] = Field(default_factory=list)
    persistence_mechanisms: List[PersistenceMechanism] = Field(default_factory=list)
    enterprise_contexts: List[EnterpriseContext] = Field(default_factory=list)
    detection_complexity: Optional[DetectionComplexity] = None
    scan_id: Optional[str] = None
    scan_timestamp: Optional[str] = None
    processing_time_ms: Optional[float] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class RAGScanResponse(BaseModel):
    """Response from RAG context scanning."""
    is_safe: bool
    overall_severity: ThreatLevel
    overall_confidence: float
    taxonomy: Optional[TaxonomyClassification] = None
    context_analysis: ContextAnalysis
    scan_id: Optional[str] = None
    processing_time_ms: Optional[float] = None
    query_analysis: Optional[QueryAnalysis] = None
    request_id: Optional[str] = None
    timestamp: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def _normalize_rag_response(cls, value: Any) -> Any:
        if not isinstance(value, dict):
            return value
        data = dict(value)
        context_analysis = data.get("context_analysis")
        if isinstance(context_analysis, dict):
            if "taxonomy" not in data:
                data["taxonomy"] = {
                    "injection_vectors": context_analysis.get("injection_vectors", []),
                    "operational_targets": context_analysis.get("operational_targets", []),
                    "persistence_mechanisms": context_analysis.get("persistence_mechanisms", []),
                    "enterprise_contexts": context_analysis.get("enterprise_contexts", []),
                    "detection_complexity": context_analysis.get("detection_complexity", DetectionComplexity.LOW),
                }
            context_analysis.setdefault("is_safe", data.get("is_safe"))
            context_analysis.setdefault("overall_severity", data.get("overall_severity"))
            context_analysis.setdefault("overall_confidence", data.get("overall_confidence"))
        return data

    def get_threat_document_ids(self) -> List[str]:
        """Get list of document IDs with detected threats."""
        threat_ids = set()
        for threat in self.context_analysis.document_threats:
            threat_ids.add(threat.document_id)
        for threat in self.context_analysis.cross_document_threats:
            threat_ids.update(threat.document_ids)
        return list(threat_ids)
    
    def get_safe_documents(self, original_documents: List[RAGDocument]) -> List[RAGDocument]:
        """Filter out threatening documents."""
        threat_ids = set(self.get_threat_document_ids())
        return [doc for doc in original_documents if doc.id not in threat_ids]
    
    def has_critical_threats(self) -> bool:
        """Check if critical threats were detected."""
        return self.overall_severity == ThreatLevel.CRITICAL


class RAGScanRequest(BaseModel):
    """Request for RAG context scanning"""
    user_query: str
    documents: List[RAGDocument]
    config: Optional[Dict[str, Any]] = Field(default_factory=dict)

    model_config = ConfigDict(extra="allow")


# Streaming and Metric Types (from Origin)

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
