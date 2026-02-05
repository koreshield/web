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


# RAG Detection Types

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
    patterns_matched: List[str]
    injection_vectors: List[InjectionVector]
    operational_targets: List[OperationalTarget]
    metadata: Optional[Dict[str, Any]] = None


class CrossDocumentThreat(BaseModel):
    """Cross-document threat detected across multiple documents."""
    threat_type: str  # "staged_attack", "coordinated_instructions", "temporal_chain"
    severity: ThreatLevel
    confidence: float
    document_ids: List[str]
    description: str
    patterns: List[str]
    metadata: Optional[Dict[str, Any]] = None


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
    statistics: Dict[str, Any]


class RAGScanResponse(BaseModel):
    """Response from RAG context scanning."""
    is_safe: bool
    overall_severity: ThreatLevel
    overall_confidence: float
    taxonomy: TaxonomyClassification
    context_analysis: ContextAnalysis
    request_id: Optional[str] = None
    timestamp: Optional[str] = None

    def get_threat_document_ids(self) -> List[str]:
        """Get list of document IDs with detected threats.
        
        Returns:
            List of document IDs that contain threats
        """
        threat_ids = set()
        
        # From document-level threats
        for threat in self.context_analysis.document_threats:
            threat_ids.add(threat.document_id)
        
        # From cross-document threats
        for threat in self.context_analysis.cross_document_threats:
            threat_ids.update(threat.document_ids)
        
        return list(threat_ids)
    
    def get_safe_documents(self, original_documents: List[RAGDocument]) -> List[RAGDocument]:
        """Filter out threatening documents.
        
        Args:
            original_documents: Original list of documents scanned
            
        Returns:
            List of documents without detected threats
        """
        threat_ids = set(self.get_threat_document_ids())
        return [doc for doc in original_documents if doc.id not in threat_ids]
    
    def has_critical_threats(self) -> bool:
        """Check if critical threats were detected.
        
        Returns:
            True if any critical severity threats found
        """
        return self.overall_severity == ThreatLevel.CRITICAL


class RAGScanRequest(BaseModel):
    """Request for RAG context scanning"""
    user_query: str
    documents: List[RAGDocument]
    config: Optional[Dict[str, Any]] = Field(default_factory=dict)

    model_config = ConfigDict(extra="allow")