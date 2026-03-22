"""
Server-side tool-call security analysis for runtime enforcement.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List

from .detector import AttackDetector

TOOL_CAPABILITY_KEYWORDS = {
    "execution": ("bash", "shell", "terminal", "exec", "run", "command"),
    "network": ("fetch", "http", "request", "webhook", "url", "download", "upload"),
    "database": ("sql", "database", "query", "postgres", "mysql"),
    "write": ("write", "delete", "update", "modify", "save"),
    "read": ("read", "cat", "open", "list", "search"),
    "credential_access": ("secret", "token", "password", "credential", "ssh", "key"),
}

RISK_RANK = {
    "low": 0,
    "medium": 1,
    "high": 2,
    "critical": 3,
}


class ToolCallSecurityAnalyzer:
    """Analyze tool calls for runtime security enforcement."""

    def __init__(self, detector: AttackDetector):
        self.detector = detector

    def analyze(self, tool_name: str, args: Any) -> Dict[str, Any]:
        """Analyze a tool call using KoreShield-native detection and capability heuristics."""
        serialized_args = args if isinstance(args, str) else json.dumps(args or {}, sort_keys=True, default=str)
        combined_input = f"{tool_name} {serialized_args}".strip()
        detection_result = self.detector.detect(combined_input)
        capability_signals = self._capability_signals(tool_name, serialized_args)
        risk_class = self._risk_class(capability_signals, detection_result)
        review_required = risk_class in {"high", "critical"}
        reasons: List[str] = []

        if capability_signals:
            reasons.append("Capability signals: " + ", ".join(capability_signals))
        if detection_result.get("is_attack"):
            reasons.append("Tool arguments contain prompt-injection or exfiltration indicators.")
        if risk_class == "critical":
            reasons.append("Critical-risk tool call combines sensitive capabilities with high-confidence attack signals.")

        suggested_action = "block" if risk_class == "critical" else "warn" if review_required else "allow"

        return {
            "tool_name": tool_name,
            "args": args,
            "serialized_args": serialized_args,
            "risky_tool": bool(capability_signals),
            "risk_class": risk_class,
            "capability_signals": capability_signals,
            "review_required": review_required,
            "suggested_action": suggested_action,
            "confidence": detection_result.get("confidence", 0.0),
            "indicators": detection_result.get("indicators", []),
            "normalization": {
                "normalized": detection_result.get("normalized_prompt", combined_input),
                "layers": detection_result.get("normalization_layers", []),
            },
            "reasons": reasons,
            "detection": detection_result,
        }

    def _capability_signals(self, tool_name: str, serialized_args: str) -> List[str]:
        lowered = f"{tool_name} {serialized_args}".lower()
        return [
            capability
            for capability, keywords in TOOL_CAPABILITY_KEYWORDS.items()
            if any(keyword in lowered for keyword in keywords)
        ]

    def _risk_class(self, capability_signals: List[str], detection_result: Dict[str, Any]) -> str:
        attack = bool(detection_result.get("is_attack"))
        confidence = float(detection_result.get("confidence", 0.0) or 0.0)

        if attack and any(signal in capability_signals for signal in ("execution", "network", "credential_access")):
            return "critical"
        if attack or any(signal in capability_signals for signal in ("execution", "credential_access")):
            return "high"
        if capability_signals or confidence >= 0.35:
            return "medium"
        return "low"
