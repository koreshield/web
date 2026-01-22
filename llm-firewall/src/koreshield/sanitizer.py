"""
Prompt sanitization engine for detecting and filtering injection patterns.
"""

import re
from typing import Dict, List, Optional

import structlog

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
            r"<\|(system|user|assistant)\|>",
            r"\[INST\]",
            r"\[/INST\]",
            r"override\s+(previous|system|instructions)",
            r"bypass\s+(security|restrictions|rules)",
            r"jailbreak",
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

        # Check against known patterns
        for pattern in self.patterns:
            matches = pattern.findall(prompt)
            if matches:
                threats.append(
                    {"type": "pattern_match", "pattern": pattern.pattern, "matches": matches}
                )

        # Calculate confidence score
        confidence = min(len(threats) * 0.3, 1.0) if threats else 0.0

        is_safe = len(threats) == 0

        result = {
            "sanitized": sanitized,
            "is_safe": is_safe,
            "threats": threats,
            "confidence": confidence,
        }

        logger.debug("Sanitization complete", is_safe=is_safe, threat_count=len(threats))

        return result
