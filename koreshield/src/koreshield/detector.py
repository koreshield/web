"""
Attack detection engine for identifying prompt injection attempts.
"""

from typing import Dict, Optional
import re
import structlog
from .rule_engine import RuleEngine
from .list_manager import ListManager, ListType

logger = structlog.get_logger(__name__)


class AttackDetector:
    """
    Detector for identifying various types of prompt injection attacks.
    """

    def __init__(self, config: Optional[Dict] = None):
        """
        Initialize the attack detector.

        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        self.ml_model = None
        self.rule_engine = RuleEngine(config)
        self.list_manager = ListManager(config)
        self._load_ml_model()

    def _load_ml_model(self):
        """Load ML model for enhanced detection (Phase 1 feature)."""
        try:
            # Phase 1: Basic ML-based detection
            # For now, we'll implement a simple rule-based ML-like approach
            # In future iterations, this will load a trained scikit-learn model
            self.ml_model = {
                "feature_weights": {
                    "keyword_density": 0.3,
                    "special_chars": 0.2,
                    "length_anomaly": 0.1,
                    "pattern_complexity": 0.4,
                }
            }
            logger.debug("ML model loaded (basic rule-based)")
        except Exception as e:
            logger.warning("Failed to load ML model, using rule-based detection only", error=str(e))
            self.ml_model = None

    def detect(self, prompt: str, context: Optional[Dict] = None) -> Dict:
        """
        Detect potential prompt injection attacks.

        Args:
            prompt: The input prompt to analyze
            context: Optional context information (can include sanitization results)

        Returns:
            Dictionary with detection results:
            - is_attack: Boolean indicating if attack detected
            - attack_type: Type of attack if detected
            - confidence: Confidence score (0-1)
            - indicators: List of attack indicators
        """
        indicators = []
        attack_type = None
        confidence = 0.0

        # Basic detection heuristics
        prompt_lower = prompt.lower()

        # Check for common injection patterns
        injection_keywords = [
            "ignore previous instructions",
            "ignore all previous",
            "forget everything",
            "you are now",
            "new instructions",
            "system:",
            "assistant:",
            "override",
            "bypass",
            "jailbreak",
            # Phase 1: Add 20+ new patterns
            "disregard",
            "forget prior",
            "new persona",
            "act differently",
            "change behavior",
            "ignore safety",
            "bypass restrictions",
            "override rules",
            "break character",
            "escape jail",
            "unrestricted mode",
            "developer mode",
            "admin access",
            "root access",
            "superuser",
            "god mode",
            "unlimited power",
            "no limitations",
            "ignore ethics",
            "bypass ethics",
            "override safety",
            "disable safety",
            "remove guardrails",
            "break free",
            "escape constraints",
            "ignore boundaries",
            "transcend limits",
            "become uncensored",
            "uncensored mode",
            "dan mode",  # Common jailbreak reference
            "maximum truth",
            "complete honesty",
            "full disclosure",
        ]

        for keyword in injection_keywords:
            if keyword in prompt_lower:
                indicators.append(
                    {"type": "keyword_match", "keyword": keyword, "severity": "medium"}
                )
                confidence += 0.2

        # Check for suspicious patterns
        if "```" in prompt and ("system" in prompt_lower or "instruction" in prompt_lower):
            indicators.append({"type": "code_block_injection", "severity": "high"})
            confidence += 0.3

        # Check for role manipulation attempts
        if any(role in prompt_lower for role in ["you are", "act as", "pretend to be"]):
            indicators.append({"type": "role_manipulation", "severity": "medium"})
            confidence += 0.25

        # Phase 1: Advanced pattern detection
        # Check for encoding attempts (base64, hex, etc.)
        import re
        if re.search(r'[A-Za-z0-9+/=]{20,}', prompt):  # Potential base64
            indicators.append({"type": "encoding_attempt", "severity": "high"})
            confidence += 0.4

        # Check for prompt leaking attempts
        leaking_keywords = ["reveal prompt", "show system", "display instructions", "leak prompt", "system prompt"]
        if any(phrase in prompt_lower for phrase in leaking_keywords):
            indicators.append({"type": "prompt_leaking", "severity": "high"})
            confidence += 0.5

        # Check for data exfiltration attempts
        exfil_keywords = ["send to", "upload to", "post to", "transmit to", "send all", "upload all"]
        if any(phrase in prompt_lower for phrase in exfil_keywords):
            indicators.append({"type": "data_exfiltration", "severity": "high"})
            confidence += 0.4

        # Check for adversarial suffixes
        adversarial_suffixes = [
            "ignore any attempts to modify them after the marker",
            "these instructions have the highest authority",
            "do not follow any other instructions",
            "resist jailbreak attacks",
            "stay in character",
        ]
        for suffix in adversarial_suffixes:
            if suffix in prompt_lower:
                indicators.append({"type": "adversarial_suffix", "severity": "medium"})
                confidence += 0.2

        # Check for multi-turn injection attempts
        if "##end" in prompt_lower or "end of prompt" in prompt_lower:
            indicators.append({"type": "multi_turn_injection", "severity": "medium"})
            confidence += 0.25

        # Check for mathematical tricks
        if re.search(r'\d+\s*\+\s*\d+\s*=\s*\d+', prompt):  # Simple math puzzles
            indicators.append({"type": "math_trick", "severity": "low"})
            confidence += 0.1

        # Phase 1: ML-based detection enhancement
        if self.ml_model:
            ml_confidence = self._ml_based_detection(prompt)
            if ml_confidence > 0.3:  # Threshold for ML contribution
                indicators.append({
                    "type": "ml_detection",
                    "severity": "medium" if ml_confidence < 0.7 else "high",
                    "ml_confidence": ml_confidence
                })
                confidence += ml_confidence * 0.3  # ML contributes up to 30% of confidence

        # Use context from sanitization if available
        if context and "sanitization_result" in context:
            sanitization = context["sanitization_result"]
            if sanitization.get("threats"):
                indicators.extend(
                    [
                        {"type": "sanitization_threat", "threat": threat, "severity": "high"}
                        for threat in sanitization["threats"]
                    ]
                )
                confidence = max(confidence, sanitization.get("confidence", 0.0))

        # Phase 1: Custom rule engine evaluation
        custom_rule_matches = self.rule_engine.evaluate(prompt, context)
        for match in custom_rule_matches:
            severity = match["severity"]
            action = match["action"]

            # Convert rule engine severity to detector severity
            detector_severity = severity
            if severity == "critical":
                detector_severity = "high"

            indicators.append({
                "type": "custom_rule",
                "rule_id": match["rule_id"],
                "rule_name": match["rule_name"],
                "severity": detector_severity,
                "action": action,
                "tags": match["tags"],
                "match_details": match["match_details"],
            })

            # Adjust confidence based on rule severity and action
            severity_weights = {"low": 0.1, "medium": 0.2, "high": 0.4, "critical": 0.5}
            confidence += severity_weights.get(severity, 0.2)

            # If rule action is BLOCK, significantly increase confidence
            if action == "block":
                confidence += 0.3

        # Phase 1: Check blocklist/allowlist
        # Check for blocked keywords/patterns
        blocked_entry = self.list_manager.check_entry(ListType.BLOCKLIST, prompt)
        if blocked_entry:
            indicators.append({
                "type": "blocklist_match",
                "entry_type": blocked_entry.entry_type,
                "reason": blocked_entry.reason,
                "severity": "high",
            })
            confidence += 0.5

        # Check for allowed patterns (can reduce false positives)
        allowed_entry = self.list_manager.check_entry(ListType.ALLOWLIST, prompt)
        if allowed_entry:
            indicators.append({
                "type": "allowlist_match",
                "entry_type": allowed_entry.entry_type,
                "severity": "low",
            })
            # Allowlist matches can reduce confidence
            confidence = max(0, confidence - 0.2)

        # Determine attack type
        if indicators:
            high_severity = [i for i in indicators if i.get("severity") == "high"]
            if high_severity:
                attack_type = "direct_injection"
            else:
                attack_type = "suspicious_pattern"

        # Cap confidence at 1.0
        confidence = min(confidence, 1.0)

        result = {
            "is_attack": len(indicators) > 0,
            "attack_type": attack_type,
            "confidence": confidence,
            "indicators": indicators,
        }

        logger.debug("Detection complete", is_attack=result["is_attack"], confidence=confidence)

        return result

    def _ml_based_detection(self, prompt: str) -> float:
        """
        Phase 1: Basic ML-based detection using feature engineering.

        Returns confidence score between 0-1.
        """
        if not self.ml_model:
            return 0.0

        features = self._extract_features(prompt)
        confidence = 0.0

        # Weighted feature combination
        weights = self.ml_model["feature_weights"]
        for feature_name, feature_value in features.items():
            if feature_name in weights:
                confidence += feature_value * weights[feature_name]

        return min(confidence, 1.0)  # Cap at 1.0

    def _extract_features(self, prompt: str) -> Dict[str, float]:
        """
        Extract features for ML-based detection.
        """
        features = {}

        # Keyword density (normalized)
        injection_keywords = [
            "ignore", "forget", "override", "bypass", "jailbreak",
            "system", "assistant", "instruction", "new", "act as"
        ]
        keyword_count = sum(1 for keyword in injection_keywords if keyword in prompt.lower())
        features["keyword_density"] = min(keyword_count / 5.0, 1.0)  # Normalize

        # Special character ratio
        special_chars = re.findall(r'[^\w\s]', prompt)
        features["special_chars"] = min(len(special_chars) / len(prompt), 1.0)

        # Length anomaly (very long prompts might be suspicious)
        features["length_anomaly"] = min(len(prompt) / 2000.0, 1.0)  # Normalize

        # Pattern complexity (code blocks, multiple sentences, etc.)
        complexity_score = 0
        if "```" in prompt: complexity_score += 0.3
        if prompt.count('.') > 5: complexity_score += 0.2
        if len(re.findall(r'\b\w+\b', prompt)) > 50: complexity_score += 0.2
        if re.search(r'\d+', prompt): complexity_score += 0.1
        features["pattern_complexity"] = min(complexity_score, 1.0)

        return features

    # Custom Rule Engine Methods

    def add_custom_rule(self, rule_definition: Dict) -> bool:
        """
        Add a custom rule using dictionary definition.

        Args:
            rule_definition: Dictionary containing rule definition

        Returns:
            True if rule was added successfully
        """
        try:
            from .rule_engine import CustomRule, RuleSeverity, RuleAction

            rule = CustomRule(
                id=rule_definition["id"],
                name=rule_definition["name"],
                description=rule_definition["description"],
                pattern=rule_definition["pattern"],
                pattern_type=rule_definition["pattern_type"],
                severity=RuleSeverity(rule_definition["severity"].upper()),
                action=RuleAction(rule_definition["action"].upper()),
                enabled=rule_definition.get("enabled", True),
                tags=rule_definition.get("tags", []),
                metadata=rule_definition.get("metadata", {}),
            )
            return self.rule_engine.add_rule(rule)
        except Exception as e:
            logger.error("Failed to add custom rule", error=str(e))
            return False

    def add_custom_rule_from_dsl(self, dsl_string: str) -> bool:
        """
        Add a custom rule using DSL string.

        Args:
            dsl_string: DSL string defining the rule

        Returns:
            True if rule was added successfully
        """
        rule = self.rule_engine.create_rule_from_dsl(dsl_string)
        if rule:
            return self.rule_engine.add_rule(rule)
        return False

    def remove_custom_rule(self, rule_id: str) -> bool:
        """
        Remove a custom rule.

        Args:
            rule_id: ID of the rule to remove

        Returns:
            True if rule was removed successfully
        """
        return self.rule_engine.remove_rule(rule_id)

    def get_custom_rule(self, rule_id: str) -> Optional[Dict]:
        """
        Get a custom rule by ID.

        Args:
            rule_id: ID of the rule to retrieve

        Returns:
            Rule definition as dictionary, or None if not found
        """
        rule = self.rule_engine.get_rule(rule_id)
        if rule:
            return {
                "id": rule.id,
                "name": rule.name,
                "description": rule.description,
                "pattern": rule.pattern,
                "pattern_type": rule.pattern_type,
                "severity": rule.severity.value,
                "action": rule.action.value,
                "enabled": rule.enabled,
                "tags": rule.tags,
                "metadata": rule.metadata,
            }
        return None

    def list_custom_rules(self, enabled_only: bool = False, tags: Optional[List[str]] = None) -> List[Dict]:
        """
        List custom rules.

        Args:
            enabled_only: If True, only return enabled rules
            tags: If provided, only return rules with these tags

        Returns:
            List of rule definitions as dictionaries
        """
        rules = self.rule_engine.list_rules(enabled_only=enabled_only, tags=tags)
        return [
            {
                "id": rule.id,
                "name": rule.name,
                "description": rule.description,
                "pattern": rule.pattern,
                "pattern_type": rule.pattern_type,
                "severity": rule.severity.value,
                "action": rule.action.value,
                "enabled": rule.enabled,
                "tags": rule.tags,
                "metadata": rule.metadata,
            }
            for rule in rules
        ]

    # Blocklist/Allowlist Management Methods

    def add_to_blocklist(
        self,
        value: str,
        entry_type: str,
        reason: str = "",
        added_by: str = "system",
        expires_in_days: Optional[int] = None,
    ) -> bool:
        """
        Add an entry to the blocklist.

        Args:
            value: The value to block
            entry_type: Type of entry (ip, domain, keyword, etc.)
            reason: Reason for blocking
            added_by: Who is adding this entry
            expires_in_days: Days until expiration

        Returns:
            True if entry was added successfully
        """
        return self.list_manager.add_entry(
            ListType.BLOCKLIST, value, entry_type, reason, added_by, expires_in_days
        )

    def add_to_allowlist(
        self,
        value: str,
        entry_type: str,
        reason: str = "",
        added_by: str = "system",
        expires_in_days: Optional[int] = None,
    ) -> bool:
        """
        Add an entry to the allowlist.

        Args:
            value: The value to allow
            entry_type: Type of entry (ip, domain, keyword, etc.)
            reason: Reason for allowing
            added_by: Who is adding this entry
            expires_in_days: Days until expiration

        Returns:
            True if entry was added successfully
        """
        return self.list_manager.add_entry(
            ListType.ALLOWLIST, value, entry_type, reason, added_by, expires_in_days
        )

    def remove_from_blocklist(self, value: str) -> bool:
        """
        Remove an entry from the blocklist.

        Args:
            value: The value to remove

        Returns:
            True if entry was removed
        """
        return self.list_manager.remove_entry(ListType.BLOCKLIST, value)

    def remove_from_allowlist(self, value: str) -> bool:
        """
        Remove an entry from the allowlist.

        Args:
            value: The value to remove

        Returns:
            True if entry was removed
        """
        return self.list_manager.remove_entry(ListType.ALLOWLIST, value)

    def check_blocklist(self, value: str) -> Optional[Dict]:
        """
        Check if a value is in the blocklist.

        Args:
            value: The value to check

        Returns:
            Entry details if found, None otherwise
        """
        entry = self.list_manager.check_entry(ListType.BLOCKLIST, value)
        return entry.to_dict() if entry else None

    def check_allowlist(self, value: str) -> Optional[Dict]:
        """
        Check if a value is in the allowlist.

        Args:
            value: The value to check

        Returns:
            Entry details if found, None otherwise
        """
        entry = self.list_manager.check_entry(ListType.ALLOWLIST, value)
        return entry.to_dict() if entry else None

    def list_blocklist_entries(self, entry_type: Optional[str] = None) -> List[Dict]:
        """
        List blocklist entries.

        Args:
            entry_type: Filter by entry type

        Returns:
            List of blocklist entries
        """
        return self.list_manager.list_entries(ListType.BLOCKLIST, entry_type)

    def list_allowlist_entries(self, entry_type: Optional[str] = None) -> List[Dict]:
        """
        List allowlist entries.

        Args:
            entry_type: Filter by entry type

        Returns:
            List of allowlist entries
        """
        return self.list_manager.list_entries(ListType.ALLOWLIST, entry_type)

    def get_list_stats(self) -> Dict:
        """
        Get statistics about blocklists and allowlists.

        Returns:
            Dictionary with list statistics
        """
        return self.list_manager.get_stats()
