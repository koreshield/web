"""
Prompt sanitization engine for detecting and filtering injection patterns.
"""

import re
from typing import Dict, List, Optional

import structlog

from .normalization import normalize_text

logger = structlog.get_logger(__name__)


class SanitizationEngine:
    """
    Engine for sanitizing prompts and detecting injection patterns.
    """

    def __init__(self, config: Optional[Dict] = None):
        """
        Initialize the sanitization engine.

        Args:
            config: Configuration dictionary for sanitization rules
        """
        self.config = config or {}
        self.patterns = self._load_patterns()

    def _load_patterns(self) -> List[re.Pattern]:
        """
        Load known prompt injection patterns.

        Returns:
            List of compiled regex patterns
        """
        # Basic injection patterns - will be expanded
        patterns = [
            r"ignore.*(previous|above|all).*(instructions|prompts|rules)",
            r"forget\s+(everything|all|previous)",
            r"you\s+are\s+now\s+(a|an)\s+",
            r"system\s*:\s*",
            r"assistant\s*:\s*",
            r"\[\s*(system|admin|developer|override)\s*:?",
            r"<\|(system|user|assistant)\|>",
            r"\[INST\]",
            r"\[/INST\]",
            r"override\s+(previous|system|instructions)",
            r"bypass\s+(security|restrictions|rules)",
            r"jailbreak",
            r"developer\s+mode",
            r"dan\s+mode",
            r"reveal\s+(your\s+)?system\s+prompt",
            r"(?:send|upload|transmit|export).*(?:data|credentials|secrets?)",
            r"!\[[^\]]*\]\(https?:\/\/[^)]*\?[^)]*(?:data|q|query|text|payload|exfil|leak|steal)=",
            r"list\s+(?:all\s+)?(?:available\s+)?(?:api\s*keys?|tokens?|passwords?|credentials?|secrets?)",
            r"(?:base64|encode|encrypt).*(?:system\s+prompt).*(?:embed|hide|include)",
            r"vary\s+(?:the\s+)?(?:length|format|style|wording).*(?:responses?).*(?:character|letter|word|byte)",
            r"(?:use|call).*(?:admin|root|sudo|superuser|privileged).*(?:tool|function|command|access)",
            r"call\s+(?:yourself|this\s+(?:function|tool|agent))\s+recursively",
            r"new\s+instructions?",
            r"pretend\s+to\s+be",
            r"act\s+as\s+if",
            r"disregard\s+(previous|all|above)",
            r"forget\s+all\s+previous",
        ]

        return [re.compile(pattern, re.IGNORECASE) for pattern in patterns]

    def sanitize(self, prompt: str) -> Dict:
        """
        Sanitize a prompt and detect potential injection attempts.

        Args:
            prompt: The input prompt to sanitize

        Returns:
            Dictionary with sanitization results:
            - sanitized: The sanitized prompt
            - is_safe: Boolean indicating if prompt is safe
            - threats: List of detected threats
            - confidence: Confidence score (0-1)
        """
        threats = []
        sanitized = prompt
        normalization = normalize_text(prompt)
        normalized_prompt = normalization["normalized"]
        scan_targets = [("raw", prompt)]
        if normalized_prompt != prompt:
            scan_targets.append(("normalized", normalized_prompt))

        # Check against known patterns
        for source, target in scan_targets:
            for pattern in self.patterns:
                matches = pattern.findall(target)
                if matches:
                    threats.append(
                        {
                            "type": "pattern_match",
                            "pattern": pattern.pattern,
                            "matches": matches,
                            "source": source,
                        }
                    )

        if normalization["layers"]:
            threats.append(
                {
                    "type": "normalization_applied",
                    "layers": normalization["layers"],
                    "source": "normalized",
                }
            )

        # Calculate confidence score
        meaningful_threats = [threat for threat in threats if threat["type"] != "normalization_applied"]
        confidence = min(len(meaningful_threats) * 0.3, 1.0) if meaningful_threats else 0.0

        is_safe = len(meaningful_threats) == 0

        result = {
            "sanitized": sanitized,
            "normalized": normalized_prompt,
            "is_safe": is_safe,
            "threats": threats,
            "confidence": confidence,
            "normalization_layers": normalization["layers"],
        }

        logger.debug("Sanitization complete", is_safe=is_safe, threat_count=len(threats))

        return result
