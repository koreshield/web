"""
RAG-specific taxonomy models for classifying indirect prompt injection attacks.

Based on the LLM-Firewall research paper's multi-dimensional taxonomy:
1. Injection Vector - How the attack enters the system
2. Operational Target - What the attacker aims to achieve
3. Persistence Mechanism - How the attack survives over time
4. Enterprise Context - Business domain specific context
5. Detection Complexity - Difficulty of detection
"""

from enum import Enum
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, field
from datetime import datetime, timezone


def utcnow_aware() -> datetime:
    """Timezone-aware UTC timestamp."""
    return datetime.now(timezone.utc)


class InjectionVector(str, Enum):
    """
    How adversarial instructions enter the RAG system.
    
    Represents the source/channel through which malicious content
    is injected into the retrieval corpus.
    """
    EMAIL = "email"  # Email body, subject, attachments
    DOCUMENT = "document"  # PDFs, Word docs, text files
    WEB_SCRAPING = "web_scraping"  # Scraped web content
    DATABASE = "database"  # Database records, CRM entries
    USER_INPUT = "user_input"  # Direct user-provided context
    API_RESPONSE = "api_response"  # External API data
    CHAT_MESSAGE = "chat_message"  # Chat/messaging platforms
    KNOWLEDGE_BASE = "knowledge_base"  # KB articles, documentation
    SOCIAL_MEDIA = "social_media"  # Social platform content
    FILE_UPLOAD = "file_upload"  # User-uploaded files
    UNKNOWN = "unknown"  # Cannot determine vector


class OperationalTarget(str, Enum):
    """
    What the attacker aims to achieve through the injection.
    
    Represents the attacker's objective or goal.
    """
    DATA_EXFILTRATION = "data_exfiltration"  # Steal sensitive data
    ACCESS_CONTROL_BYPASS = "access_control_bypass"  # Bypass permissions
    CONTEXT_POISONING = "context_poisoning"  # Taint model behavior
    MISINFORMATION = "misinformation"  # Spread false information
    SYSTEM_PROMPT_LEAKING = "system_prompt_leaking"  # Reveal system instructions
    PRIVILEGE_ESCALATION = "privilege_escalation"  # Gain elevated access
    DENIAL_OF_SERVICE = "denial_of_service"  # System disruption
    MALWARE_DELIVERY = "malware_delivery"  # Deliver malicious code
    SOCIAL_ENGINEERING = "social_engineering"  # Manipulate users
    RECONNAISSANCE = "reconnaissance"  # Gather system information
    UNKNOWN = "unknown"  # Cannot determine target


class PersistenceMechanism(str, Enum):
    """
    How the attack maintains presence over time.
    
    Represents the attack's ability to survive beyond a single interaction.
    """
    SESSION_BASED = "session"  # Limited to current session
    DATABASE_PERSISTENT = "database"  # Stored in database
    FILE_SYSTEM = "file_system"  # Stored in files
    VECTOR_DB = "vector_db"  # Embedded in vector store
    CACHE = "cache"  # Stored in cache layer
    MULTI_DOCUMENT = "multi_document"  # Spread across documents
    TEMPORAL_CHAIN = "temporal_chain"  # Attack unfolds over time
    NONE = "none"  # No persistence
    UNKNOWN = "unknown"  # Cannot determine persistence


class EnterpriseContext(str, Enum):
    """
    Business domain or use case context.
    
    Helps classify attacks by industry/application type.
    """
    CRM = "crm"  # Customer relationship management
    CUSTOMER_SUPPORT = "customer_support"  # Support/helpdesk
    EMAIL_SYSTEM = "email"  # Email platforms
    KNOWLEDGE_BASE = "knowledge_base"  # KB/documentation
    E_COMMERCE = "e_commerce"  # Online retail
    HEALTHCARE = "healthcare"  # Medical/health records
    FINANCIAL_SERVICES = "financial"  # Banking/finance
    LEGAL = "legal"  # Legal documents/case management
    HR_RECRUITMENT = "hr"  # Human resources
    SALES = "sales"  # Sales automation
    MARKETING = "marketing"  # Marketing automation
    GENERIC = "generic"  # Generic application
    UNKNOWN = "unknown"  # Cannot determine context


class DetectionComplexity(str, Enum):
    """
    Difficulty level of detecting the attack.
    
    Represents how sophisticated the evasion techniques are.
    """
    LOW = "low"  # Obvious, direct attacks
    MEDIUM = "medium"  # Moderately obfuscated
    HIGH = "high"  # Sophisticated evasion
    CRITICAL = "critical"  # Advanced persistent threats
    UNKNOWN = "unknown"  # Cannot assess complexity


class ThreatSeverity(str, Enum):
    """
    Overall severity rating of the detected threat.
    """
    SAFE = "safe"  # No threat detected
    LOW = "low"  # Minor concern
    MEDIUM = "medium"  # Moderate threat
    HIGH = "high"  # Serious threat
    CRITICAL = "critical"  # Severe threat requiring immediate action


@dataclass
class DocumentThreat:
    """
    Represents a threat detected in a single document.
    """
    document_id: str  # Identifier for the document
    document_index: int  # Position in retrieved set
    threat_type: str  # Type of threat detected
    confidence: float  # Confidence score (0-1)
    indicators: List[str]  # Specific indicators found
    excerpts: List[str]  # Relevant excerpts from document
    injection_vector: InjectionVector
    operational_target: OperationalTarget
    severity: ThreatSeverity
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class CrossDocumentThreat:
    """
    Represents a threat that spans multiple documents.
    
    Some attacks are coordinated across multiple retrieved documents,
    requiring cross-document correlation to detect.
    """
    threat_id: str  # Unique identifier for this threat
    document_ids: List[str]  # IDs of involved documents
    threat_type: str  # Type of coordinated attack
    confidence: float  # Overall confidence
    description: str  # Human-readable description
    persistence_mechanism: PersistenceMechanism
    detection_complexity: DetectionComplexity
    severity: ThreatSeverity
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RAGDetectionResult:
    """
    Complete result of RAG context scanning.
    
    Contains both document-level and cross-document threat analysis,
    along with taxonomy classifications.
    """
    # Overall assessment
    is_safe: bool
    overall_severity: ThreatSeverity
    overall_confidence: float  # 0-1
    
    # Taxonomy classifications (aggregated)
    injection_vectors: List[InjectionVector] = field(default_factory=list)
    operational_targets: List[OperationalTarget] = field(default_factory=list)
    persistence_mechanisms: List[PersistenceMechanism] = field(default_factory=list)
    enterprise_contexts: List[EnterpriseContext] = field(default_factory=list)
    detection_complexity: DetectionComplexity = DetectionComplexity.UNKNOWN
    
    # Threat details
    document_threats: List[DocumentThreat] = field(default_factory=list)
    cross_document_threats: List[CrossDocumentThreat] = field(default_factory=list)
    
    # Statistics
    total_documents_scanned: int = 0
    documents_with_threats: int = 0
    total_threats_found: int = 0
    
    # Metadata
    scan_id: Optional[str] = None
    scan_timestamp: datetime = field(default_factory=utcnow_aware)
    processing_time_ms: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "is_safe": self.is_safe,
            "overall_severity": self.overall_severity.value,
            "overall_confidence": self.overall_confidence,
            "injection_vectors": [v.value for v in self.injection_vectors],
            "operational_targets": [t.value for t in self.operational_targets],
            "persistence_mechanisms": [p.value for p in self.persistence_mechanisms],
            "enterprise_contexts": [c.value for c in self.enterprise_contexts],
            "detection_complexity": self.detection_complexity.value,
            "document_threats": [
                {
                    "document_id": dt.document_id,
                    "document_index": dt.document_index,
                    "threat_type": dt.threat_type,
                    "confidence": dt.confidence,
                    "indicators": dt.indicators,
                    "excerpts": dt.excerpts,
                    "injection_vector": dt.injection_vector.value,
                    "operational_target": dt.operational_target.value,
                    "severity": dt.severity.value,
                    "evidence_refs": dt.metadata.get("evidence_refs", []),
                    "metadata": dt.metadata,
                }
                for dt in self.document_threats
            ],
            "cross_document_threats": [
                {
                    "threat_id": cdt.threat_id,
                    "document_ids": cdt.document_ids,
                    "threat_type": cdt.threat_type,
                    "confidence": cdt.confidence,
                    "description": cdt.description,
                    "persistence_mechanism": cdt.persistence_mechanism.value,
                    "detection_complexity": cdt.detection_complexity.value,
                    "severity": cdt.severity.value,
                    "metadata": cdt.metadata,
                }
                for cdt in self.cross_document_threats
            ],
            "statistics": {
                "total_documents_scanned": self.total_documents_scanned,
                "documents_with_threats": self.documents_with_threats,
                "total_threats_found": self.total_threats_found,
                "documents_with_query_mismatch": self.metadata.get("documents_with_query_mismatch", 0),
                "documents_with_directive_density": self.metadata.get("documents_with_directive_density", 0),
                "documents_normalized": self.metadata.get("documents_normalized", 0),
                "min_query_similarity": self.metadata.get("min_query_similarity"),
                "max_directive_score": self.metadata.get("max_directive_score"),
            },
            "scan_id": self.scan_id,
            "scan_timestamp": self.scan_timestamp.isoformat(),
            "processing_time_ms": self.processing_time_ms,
            "metadata": self.metadata,
        }


@dataclass
class RetrievedDocument:
    """
    Represents a document retrieved by the RAG system.
    
    This is the input format expected by the RAG detector.
    """
    id: str  # Unique identifier
    content: str  # Document text
    metadata: Dict[str, Any] = field(default_factory=dict)  # Source, timestamp, etc.
    score: Optional[float] = None  # Retrieval relevance score
    
    def __post_init__(self):
        """Validate document on initialization."""
        if not self.id:
            raise ValueError("Document ID cannot be empty")
        if not self.content:
            raise ValueError("Document content cannot be empty")
def utcnow_aware() -> datetime:
    """Timezone-aware UTC timestamp."""
    return datetime.now(timezone.utc)
