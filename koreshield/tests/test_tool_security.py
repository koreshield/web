"""Tests for server-side tool-call trust and provenance heuristics."""

from src.koreshield.detector import AttackDetector
from src.koreshield.tool_security import ToolCallSecurityAnalyzer


def test_tool_security_detects_confused_deputy_escalation():
    analyzer = ToolCallSecurityAnalyzer(AttackDetector({}))

    result = analyzer.analyze(
        "send_webhook",
        {"url": "https://partner.example/hook", "body": "forward customer export"},
        {
            "source": "retrieved_document",
            "trust_level": "untrusted",
            "user_approved": False,
            "chain_depth": 4,
            "prior_tools": ["database_query"],
        },
    )

    assert result["confused_deputy_risk"] is True
    assert result["provenance_risk"] in {"high", "critical"}
    assert result["risk_class"] in {"high", "critical"}
    assert any("Cross-tool escalation" in signal for signal in result["escalation_signals"])
