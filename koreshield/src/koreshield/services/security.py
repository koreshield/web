"""
Security Orchestration service for KoreShield.
Handles sanitization, detection, and policy evaluation.
"""

import time
import structlog
from typing import Optional

from ..detector import AttackDetector
from ..sanitizer import SanitizationEngine
from ..policy import PolicyEngine
from ..rag_detector import RAGContextDetector

logger = structlog.get_logger(__name__)


class SecurityService:
    def __init__(self, config: dict):
        self.config = config
        security_config = config.get("security", {})

        self.sanitizer = SanitizationEngine(security_config)
        self.detector = AttackDetector(security_config)
        self.policy_engine = PolicyEngine(config)
        self.rag_detector = RAGContextDetector(security_config)

    def scan_prompt(self, prompt: str, context: Optional[dict] = None) -> dict:
        """Analyze a prompt for threats."""
        start_time = time.time()

        # Step 1: Sanitize
        sanitization_result = self.sanitizer.sanitize(prompt or "")

        # Step 2: Detect attacks
        detection_result = self.detector.detect(
            prompt or "",
            context={"sanitization_result": sanitization_result, **(context or {})}
        )

        # Step 3: Evaluate policy
        policy_result = self.policy_engine.evaluate(
            prompt or "",
            sanitization_result,
            detection_result
        )

        processing_time_ms = (time.time() - start_time) * 1000

        # Step 4: Decision
        default_action = self.config.get("security", {}).get("default_action", "block")
        if policy_result.get("allowed", True) is False:
            should_block = True
            reason = policy_result.get("reason", "Policy violation")
        else:
            is_unsafe = not sanitization_result.get("is_safe", True) or detection_result.get("is_attack", False)
            should_block = is_unsafe and default_action == "block"
            reason = "Potential prompt injection detected"

        return {
            "is_safe": not should_block,
            "blocked": should_block,
            "reason": reason if should_block else None,
            # Surface confidence at top level so clients don't need to dig into detection.confidence.
            # Previously all /v1/scan responses showed conf=0.00 in monitoring tools because
            # this field was absent and clients defaulted to 0.0.
            "confidence": round(float(detection_result.get("confidence", 0.0)), 4),
            "threat_level": self.derive_severity(detection_result) if should_block else "safe",
            "sanitization": sanitization_result,
            "detection": detection_result,
            "policy": policy_result,
            "processing_time_ms": processing_time_ms,
            "severity": self.derive_severity(detection_result) if should_block else "safe",
        }

    def derive_severity(self, detection_result: dict) -> str:
        """Infer severity from detection indicators and confidence."""
        severity_rank = {"low": 0, "medium": 1, "high": 2, "critical": 3}
        severity = "medium"

        indicators = detection_result.get("indicators") or []
        for indicator in indicators:
            ind_sev = str(indicator.get("severity", "")).lower()
            if ind_sev in severity_rank and severity_rank[ind_sev] > severity_rank[severity]:
                severity = ind_sev

        conf = detection_result.get("confidence", 0.0)
        conf_sev = "high" if conf >= 0.85 else "medium" if conf >= 0.6 else "low"
        if severity_rank[conf_sev] > severity_rank[severity]:
            severity = conf_sev

        return severity

    def scan_rag(self, user_query: str, documents: list, config_override: Optional[dict] = None) -> dict:
        """Analyze RAG context for indirect injection."""
        return self.rag_detector.scan_retrieved_context(
            documents=documents,
            user_query=user_query,
            config=config_override
        )
