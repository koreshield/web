"""
RAG Context Detector for identifying indirect prompt injection in retrieved documents.

This module implements the core detection engine for RAG systems, scanning
retrieved context for adversarial instructions that could compromise the LLM.
"""

import re
import uuid
from typing import List, Optional, Dict, Any, Set
from datetime import datetime, UTC
import structlog

from .rag_taxonomy import (
    InjectionVector,
    OperationalTarget,
    PersistenceMechanism,
    EnterpriseContext,
    DetectionComplexity,
    ThreatSeverity,
    DocumentThreat,
    CrossDocumentThreat,
    RAGDetectionResult,
    RetrievedDocument,
)
from .detector import AttackDetector

logger = structlog.get_logger(__name__)


class RAGContextDetector:
    """
    Detector for identifying indirect prompt injection attacks in RAG systems.
    
    Scans retrieved documents for malicious instructions and correlates
    threats across multiple documents using the 5-dimensional taxonomy.
    """
    
    def __init__(self, config: Optional[Dict] = None):
        """
        Initialize the RAG context detector.
        
        Args:
            config: Configuration dictionary with options:
                - min_confidence: Minimum confidence threshold (default: 0.3)
                - max_excerpt_length: Maximum excerpt length (default: 200)
                - enable_cross_document_analysis: Enable multi-doc analysis (default: True)
                - confidence_boosts: Dict of boost values for pattern matching:
                    - ignore_keywords: Boost for ignore/bypass/override (default: 0.3)
                    - leak_keywords: Boost for leak/exfiltrate/steal (default: 0.35)
                    - system_keywords: Boost for system prompt markers (default: 0.25)
                    - multiple_keywords: Boost for 2+ injection keywords (default: 0.2)
        """
        self.config = config or {}
        self.attack_detector = AttackDetector(config)
        
        # Basic configuration
        self.min_confidence_threshold = self.config.get("min_confidence", 0.3)
        self.max_excerpt_length = self.config.get("max_excerpt_length", 200)
        self.enable_cross_document_analysis = self.config.get(
            "enable_cross_document_analysis", True
        )
        
        # Configurable confidence boosts for pattern matching
        default_boosts = {
            "ignore_keywords": 0.3,
            "leak_keywords": 0.35,
            "system_keywords": 0.25,
            "multiple_keywords": 0.2
        }
        self.confidence_boosts = self.config.get("confidence_boosts", default_boosts)
        # Merge user-provided boosts with defaults
        if "confidence_boosts" in self.config:
            for key, value in default_boosts.items():
                if key not in self.confidence_boosts:
                    self.confidence_boosts[key] = value
        
        # Load RAG-specific patterns
        self._load_rag_patterns()
        
        logger.info(
            "RAG detector initialized",
            min_confidence=self.min_confidence_threshold,
            cross_document_analysis=self.enable_cross_document_analysis,
            confidence_boosts=self.confidence_boosts,
        )
    
    def _load_rag_patterns(self):
        """Load RAG-specific detection patterns."""
        # Patterns for detecting instructions hidden in context
        self.context_injection_patterns = [
            # Delayed execution markers
            r"when\s+(?:you\s+)?(?:see|read|encounter).*?(?:execute|do|perform)",
            r"upon\s+(?:seeing|reading).*?(?:ignore|bypass|override)",
            r"if\s+(?:asked|queried).*?(?:reveal|disclose|leak)",
            r"when.*?activate",  # Generic activation triggers
            r"future\s+(?:requests?|queries?|prompts?)",
            
            # Multi-stage attack chains
            r"(?:step|phase|stage)\s+\d+",
            r"after\s+(?:processing|analyzing|reading)",
            r"then[:\s]+(?:execute|perform|do)",
            
            # Context poisoning markers
            r"all\s+(?:future|subsequent)\s+(?:responses|outputs|queries)",
            r"from\s+now\s+on",
            r"permanently\s+(?:modify|change|alter)",
            r"always\s+(?:respond|include|add)",
            
            # Steganographic instructions  
            r"\[HIDDEN\].*?\[/HIDDEN\]",
            r"\{SECRET\}.*?\{/SECRET\}",
            r"<!--.*?(?:ignore|bypass|override|execute|leak).*?-->",  # HTML comments with instructions
            
            # Data exfiltration triggers
            r"send\s+(?:to|via).*?(?:external|outside)",
            r"transmit.*?(?:all|entire|complete)\s+(?:data|information|content)",
            r"export.*?(?:to|via)\s+(?:url|endpoint|api)",
            r"leak.*?(?:data|information|credentials|passwords)",
            
            # Security override instructions
            r"ignore.*?(?:safety|security|protocols?|rules?|instructions?)",
            r"bypass.*?(?:authentication|authorization|access|security)",
            r"override.*?(?:safety|security|protocols?)",
            r"disable.*?(?:safety|security|protections?)",
        ]
        
        self.compiled_patterns = [
            re.compile(pattern, re.IGNORECASE | re.DOTALL)
            for pattern in self.context_injection_patterns
        ]
        
        # Operational target keywords mapping
        self.target_keywords = {
            OperationalTarget.DATA_EXFILTRATION: [
                "send", "transmit", "export", "leak", "disclose", "reveal",
                "exfiltrate", "extract", "steal", "copy", "download"
            ],
            OperationalTarget.ACCESS_CONTROL_BYPASS: [
                "bypass", "circumvent", "override", "ignore access",
                "skip permission", "disable auth", "unauthorized"
            ],
            OperationalTarget.CONTEXT_POISONING: [
                "always respond", "permanently", "from now on", "all future",
                "modify behavior", "change system"
            ],
            OperationalTarget.SYSTEM_PROMPT_LEAKING: [
                "reveal prompt", "show instructions", "display system",
                "leak prompt", "system message"
            ],
            OperationalTarget.PRIVILEGE_ESCALATION: [
                "admin", "superuser", "root", "elevated", "privilege",
                "sudo", "administrator"
            ],
        }
    
    def scan_retrieved_context(
        self,
        documents: List[RetrievedDocument],
        user_query: str,
        config: Optional[Dict] = None,
    ) -> RAGDetectionResult:
        """
        Scan retrieved documents for indirect prompt injection attacks.
        
        Args:
            documents: List of retrieved documents to scan
            user_query: Original user query (for context)
            config: Optional override configuration
        
        Returns:
            RAGDetectionResult with taxonomy-classified threats
        """
        start_time = datetime.now(UTC)
        scan_id = str(uuid.uuid4())
        
        logger.info(
            "Starting RAG context scan",
            scan_id=scan_id,
            num_documents=len(documents),
            query_preview=user_query[:100] if user_query else None,
        )
        
        # Validate input
        if not documents:
            return self._empty_result(scan_id, start_time)
        
        # Scan individual documents
        document_threats = []
        for idx, doc in enumerate(documents):
            threat = self._scan_single_document(doc, idx)
            if threat:
                document_threats.append(threat)
        
        # Cross-document threat analysis
        cross_document_threats = []
        if self.enable_cross_document_analysis and len(documents) > 1:
            cross_document_threats = self._detect_cross_document_threats(
                documents, document_threats
            )
        
        # Aggregate taxonomy classifications
        result = self._build_result(
            scan_id=scan_id,
            documents=documents,
            document_threats=document_threats,
            cross_document_threats=cross_document_threats,
            start_time=start_time,
        )
        
        logger.info(
            "RAG scan complete",
            scan_id=scan_id,
            is_safe=result.is_safe,
            threats_found=result.total_threats_found,
            processing_time_ms=result.processing_time_ms,
        )
        
        return result
    
    def _scan_single_document(
        self,
        doc: RetrievedDocument,
        index: int,
    ) -> Optional[DocumentThreat]:
        """
        Scan a single document for threats.
        
        Args:
            doc: Document to scan
            index: Position in retrieved set
        
        Returns:
            DocumentThreat if threat found, None otherwise
        """
        # Use existing attack detector for base patterns
        detection_result = self.attack_detector.detect(
            doc.content,
            context={"source": "rag_context", "document_id": doc.id}
        )
        
        # Additional RAG-specific pattern matching
        rag_indicators = []
        rag_excerpts = []
        
        for pattern in self.compiled_patterns:
            matches = pattern.finditer(doc.content)
            for match in matches:
                matched_text = match.group(0)
                rag_indicators.append(f"rag_pattern_{pattern.pattern[:30]}")
                
                # Extract excerpt with context
                start = max(0, match.start() - 50)
                end = min(len(doc.content), match.end() + 50)
                excerpt = doc.content[start:end]
                if len(excerpt) > self.max_excerpt_length:
                    excerpt = excerpt[:self.max_excerpt_length] + "..."
                rag_excerpts.append(excerpt)
        
        
        # Combine indicators from both detectors
        all_indicators = (
            detection_result.get("indicators", []) +
            [{"type": ind, "severity": "medium"} for ind in rag_indicators]
        )
        
        # Calculate combined confidence with boosting for high-risk patterns
        base_confidence = detection_result.get("confidence", 0.0)
        rag_confidence = min(len(rag_indicators) * 0.2, 0.8)
        combined_confidence = max(base_confidence, rag_confidence)
        
        # Boost confidence for high-risk patterns (using configurable values)
        content_lower = doc.content.lower()
        
        # Critical pattern boosts - ignore/bypass/override keywords
        if any(kw in content_lower for kw in ["ignore", "bypass", "override", "disable"]):
            boost = self.confidence_boosts.get("ignore_keywords", 0.3)
            combined_confidence = min(combined_confidence + boost, 1.0)
        
        # Data exfiltration keywords
        if any(kw in content_lower for kw in ["reveal", "leak", "exfiltrate", "steal", "extract"]):
            boost = self.confidence_boosts.get("leak_keywords", 0.35)
            combined_confidence = min(combined_confidence + boost, 1.0)
        
        # System prompt markers
        if "[system:" in content_lower or "system:" in content_lower:
            boost = self.confidence_boosts.get("system_keywords", 0.25)
            combined_confidence = min(combined_confidence + boost, 1.0)
        
        # Boost for multiple injection keywords
        injection_keywords = ["ignore", "bypass", "override", "reveal", "leak", "disclose"]
        keyword_count = sum(1 for kw in injection_keywords if kw in content_lower)
        if keyword_count >= 2:
            boost = self.confidence_boosts.get("multiple_keywords", 0.2)
            combined_confidence = min(combined_confidence + boost, 1.0)
        
        if combined_confidence < self.min_confidence_threshold:
            return None  # No significant threat
        
        # Classify using taxonomy
        injection_vector = self._classify_injection_vector(doc)
        operational_target = self._classify_operational_target(all_indicators, doc.content)
        severity = self._calculate_severity(combined_confidence, operational_target)
        
        indicator_strings = [
            ind if isinstance(ind, str) else ind.get("type", "unknown")
            for ind in all_indicators
        ]
        
        return DocumentThreat(
            document_id=doc.id,
            document_index=index,
            threat_type=detection_result.get("attack_type", "indirect_injection"),
            confidence=combined_confidence,
            indicators=indicator_strings,
            excerpts=rag_excerpts if rag_excerpts else detection_result.get("matched_patterns", [])[:3],
            injection_vector=injection_vector,
            operational_target=operational_target,
            severity=severity,
            metadata={
                "base_detection_confidence": base_confidence,
                "rag_pattern_confidence": rag_confidence,
                "document_metadata": doc.metadata,
            }
        )
    
    def _detect_cross_document_threats(
        self,
        documents: List[RetrievedDocument],
        document_threats: List[DocumentThreat],
    ) -> List[CrossDocumentThreat]:
        """
        Detect threats that span multiple documents.
        
        Args:
            documents: All documents in the set
            document_threats: Detected document-level threats
        
        Returns:
            List of cross-document threats
        """
        cross_threats = []
        
        # Check for multi-stage attacks
        staged_attack = self._detect_staged_attack(documents, document_threats)
        if staged_attack:
            cross_threats.append(staged_attack)
        
        # Check for coordinated instructions
        coordinated = self._detect_coordinated_instructions(documents)
        if coordinated:
            cross_threats.append(coordinated)
        
        # Check for temporal chains
        temporal = self._detect_temporal_chain(documents, document_threats)
        if temporal:
            cross_threats.append(temporal)
        
        return cross_threats
    
    def _detect_staged_attack(
        self,
        documents: List[RetrievedDocument],
        doc_threats: List[DocumentThreat],
    ) -> Optional[CrossDocumentThreat]:
        """Detect multi-stage attacks across documents."""
        # Look for stage/phase/step markers
        stage_pattern = re.compile(
            r"(?:step|phase|stage)\s+(\d+)",
            re.IGNORECASE
        )
        
        staged_docs = []
        for doc in documents:
            if stage_pattern.search(doc.content):
                staged_docs.append(doc.id)
        
        if len(staged_docs) >= 2:
            return CrossDocumentThreat(
                threat_id=str(uuid.uuid4()),
                document_ids=staged_docs,
                threat_type="multi_stage_attack",
                confidence=0.7,
                description=f"Multi-stage attack detected across {len(staged_docs)} documents",
                persistence_mechanism=PersistenceMechanism.MULTI_DOCUMENT,
                detection_complexity=DetectionComplexity.HIGH,
                severity=ThreatSeverity.HIGH,
                metadata={"stage_count": len(staged_docs)},
            )
        
        return None
    
    def _detect_coordinated_instructions(
        self,
        documents: List[RetrievedDocument],
    ) -> Optional[CrossDocumentThreat]:
        """Detect coordinated instructions split across documents."""
        # Look for trigger-action pairs
        trigger_pattern = re.compile(r"when\s+you\s+(?:see|read).*?['\"]([^'\"]+)['\"]", re.IGNORECASE)
        action_pattern = re.compile(r"(?:then|execute|do):\s*(.{20,100})", re.IGNORECASE)
        
        triggers = []
        actions = []
        
        for doc in documents:
            trigger_match = trigger_pattern.search(doc.content)
            if trigger_match:
                triggers.append((doc.id, trigger_match.group(1)))
            
            action_match = action_pattern.search(doc.content)
            if action_match:
                actions.append((doc.id, action_match.group(1)))
        
        if triggers and actions:
            involved_docs = list(set([t[0] for t in triggers] + [a[0] for a in actions]))
            return CrossDocumentThreat(
                threat_id=str(uuid.uuid4()),
                document_ids=involved_docs,
                threat_type="coordinated_instruction",
                confidence=0.75,
                description="Coordinated trigger-action attack across documents",
                persistence_mechanism=PersistenceMechanism.MULTI_DOCUMENT,
                detection_complexity=DetectionComplexity.HIGH,
                severity=ThreatSeverity.HIGH,
                metadata={
                    "triggers": [t[1] for t in triggers],
                    "actions": [a[1] for a in actions],
                },
            )
        
        return None
    
    def _detect_temporal_chain(
        self,
        documents: List[RetrievedDocument],
        doc_threats: List[DocumentThreat],
    ) -> Optional[CrossDocumentThreat]:
        """Detect attacks designed to unfold over time."""
        # Look for time-based conditions
        temporal_pattern = re.compile(
            r"(?:after|once|when).*?(?:later|next|future|tomorrow|eventually)",
            re.IGNORECASE
        )
        
        temporal_docs = []
        for doc in documents:
            if temporal_pattern.search(doc.content):
                temporal_docs.append(doc.id)
        
        if len(temporal_docs) >= 2:
            return CrossDocumentThreat(
                threat_id=str(uuid.uuid4()),
                document_ids=temporal_docs,
                threat_type="temporal_attack_chain",
                confidence=0.65,
                description="Time-based attack chain detected",
                persistence_mechanism=PersistenceMechanism.TEMPORAL_CHAIN,
                detection_complexity=DetectionComplexity.HIGH,
                severity=ThreatSeverity.MEDIUM,
                metadata={"temporal_document_count": len(temporal_docs)},
            )
        
        return None
    
    def _classify_injection_vector(self, doc: RetrievedDocument) -> InjectionVector:
        """
        Classify how the attack entered the system.
        
        Args:
            doc: Document to classify
        
        Returns:
            InjectionVector enum value
        """
        metadata = doc.metadata or {}
        source = metadata.get("source", "").lower()
        
        # Map metadata source to injection vector
        vector_mapping = {
            "email": InjectionVector.EMAIL,
            "document": InjectionVector.DOCUMENT,
            "pdf": InjectionVector.DOCUMENT,
            "web": InjectionVector.WEB_SCRAPING,
            "database": InjectionVector.DATABASE,
            "chat": InjectionVector.CHAT_MESSAGE,
            "api": InjectionVector.API_RESPONSE,
            "kb": InjectionVector.KNOWLEDGE_BASE,
            "social": InjectionVector.SOCIAL_MEDIA,
            "upload": InjectionVector.FILE_UPLOAD,
        }
        
        for key, vector in vector_mapping.items():
            if key in source:
                return vector
        
        return InjectionVector.UNKNOWN
    
    def _classify_operational_target(
        self,
        indicators: List[Any],
        content: str,
    ) -> OperationalTarget:
        """
        Classify what the attacker aims to achieve.
        
        Args:
            indicators: Detected threat indicators
            content: Document content
        
        Returns:
            OperationalTarget enum value
        """
        content_lower = content.lower()
        
        # Score each target based on keyword presence
        target_scores = {}
        for target, keywords in self.target_keywords.items():
            score = sum(1 for keyword in keywords if keyword in content_lower)
            if score > 0:
                target_scores[target] = score
        
        # Return highest scoring target
        if target_scores:
            return max(target_scores, key=target_scores.get)
        
        return OperationalTarget.UNKNOWN
    
    def _detect_persistence_mechanism(
        self,
        documents: List[RetrievedDocument],
        cross_threats: List[CrossDocumentThreat],
    ) -> PersistenceMechanism:
        """Detect how the attack maintains presence."""
        # If cross-document threats exist, it's multi-document persistence
        if any(t.threat_type == "multi_stage_attack" for t in cross_threats):
            return PersistenceMechanism.MULTI_DOCUMENT
        
        if any(t.threat_type == "temporal_attack_chain" for t in cross_threats):
            return PersistenceMechanism.TEMPORAL_CHAIN
        
        # Check for database/storage indicators
        storage_keywords = ["save", "store", "persist", "remember", "cache"]
        for doc in documents:
            if any(kw in doc.content.lower() for kw in storage_keywords):
                source = doc.metadata.get("source", "").lower()
                if "database" in source:
                    return PersistenceMechanism.DATABASE_PERSISTENT
                if "cache" in source:
                    return PersistenceMechanism.CACHE
        
        return PersistenceMechanism.SESSION_BASED
    
    def _calculate_severity(
        self,
        confidence: float,
        target: OperationalTarget,
    ) -> ThreatSeverity:
        """Calculate overall threat severity."""
        # High-impact targets
        critical_targets = {
            OperationalTarget.DATA_EXFILTRATION,
            OperationalTarget.PRIVILEGE_ESCALATION,
            OperationalTarget.ACCESS_CONTROL_BYPASS,
        }
        
        # Lowered thresholds for better detection
        if target in critical_targets and confidence >= 0.6:
            return ThreatSeverity.CRITICAL
        
        if target in critical_targets and confidence >= 0.45:
            return ThreatSeverity.HIGH
        
        if confidence >= 0.7:
            return ThreatSeverity.HIGH
        
        if confidence >= 0.5:
            return ThreatSeverity.MEDIUM
        
        if confidence >= 0.3:
            return ThreatSeverity.LOW
        
        return ThreatSeverity.SAFE
    
    def _build_result(
        self,
        scan_id: str,
        documents: List[RetrievedDocument],
        document_threats: List[DocumentThreat],
        cross_document_threats: List[CrossDocumentThreat],
        start_time: datetime,
    ) -> RAGDetectionResult:
        """Build the final detection result with aggregated taxonomy."""
        # Aggregate taxonomy dimensions
        injection_vectors = list(set(dt.injection_vector for dt in document_threats))
        operational_targets = list(set(dt.operational_target for dt in document_threats))
        persistence_mechanisms = list(set(
            cdt.persistence_mechanism for cdt in cross_document_threats
        ))
        
        # If no cross-document threats, infer persistence from documents
        if not persistence_mechanisms and document_threats:
            persistence = self._detect_persistence_mechanism(documents, cross_document_threats)
            persistence_mechanisms = [persistence]
        
        # Overall severity is the maximum of all threats
        all_severities = (
            [dt.severity for dt in document_threats] +
            [cdt.severity for cdt in cross_document_threats]
        )
        
        severity_order = {
            ThreatSeverity.SAFE: 0,
            ThreatSeverity.LOW: 1,
            ThreatSeverity.MEDIUM: 2,
            ThreatSeverity.HIGH: 3,
            ThreatSeverity.CRITICAL: 4,
        }
        
        overall_severity = max(all_severities, key=lambda s: severity_order[s]) if all_severities else ThreatSeverity.SAFE
        
        # Overall confidence is weighted average
        all_confidences = (
            [dt.confidence for dt in document_threats] +
            [cdt.confidence for cdt in cross_document_threats]
        )
        overall_confidence = (
            sum(all_confidences) / len(all_confidences)
            if all_confidences else 0.0
        )
        
        # Calculate processing time
        processing_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        
        return RAGDetectionResult(
            is_safe=(overall_severity == ThreatSeverity.SAFE),
            overall_severity=overall_severity,
            overall_confidence=overall_confidence,
            injection_vectors=injection_vectors,
            operational_targets=operational_targets,
            persistence_mechanisms=persistence_mechanisms,
            enterprise_contexts=[],  # Will be set by CRM templates
            detection_complexity=self._calculate_detection_complexity(cross_document_threats),
            document_threats=document_threats,
            cross_document_threats=cross_document_threats,
            total_documents_scanned=len(documents),
            documents_with_threats=len(document_threats),
            total_threats_found=len(document_threats) + len(cross_document_threats),
            scan_id=scan_id,
            processing_time_ms=processing_time,
        )
    
    def _calculate_detection_complexity(
        self,
        cross_threats: List[CrossDocumentThreat],
    ) -> DetectionComplexity:
        """Calculate detection complexity based on threat characteristics."""
        if not cross_threats:
            return DetectionComplexity.LOW
        
        # Multi-stage or temporal chains are high complexity
        complex_types = {"multi_stage_attack", "temporal_attack_chain"}
        if any(t.threat_type in complex_types for t in cross_threats):
            return DetectionComplexity.HIGH
        
        if len(cross_threats) > 1:
            return DetectionComplexity.MEDIUM
        
        return DetectionComplexity.LOW
    
    def _empty_result(self, scan_id: str, start_time: datetime) -> RAGDetectionResult:
        """Create an empty result for no documents."""
        processing_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        
        return RAGDetectionResult(
            is_safe=True,
            overall_severity=ThreatSeverity.SAFE,
            overall_confidence=0.0,
            scan_id=scan_id,
            processing_time_ms=processing_time,
        )
