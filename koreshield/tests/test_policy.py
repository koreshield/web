"""
Tests for the policy engine.
"""

from src.koreshield.policy import PolicyEngine


def test_policy_initialization():
    """Test that policy engine initializes correctly."""
    policy = PolicyEngine()
    assert policy is not None


def test_policy_allows_safe_requests():
    """Test that policy engine allows safe requests."""
    policy = PolicyEngine()

    sanitization_result = {"is_safe": True, "threats": [], "confidence": 0.0}
    detection_result = {"is_attack": False, "confidence": 0.0, "indicators": []}

    result = policy.evaluate("Safe prompt", sanitization_result, detection_result)

    assert result["allowed"] is True
    assert result["action"] == "allow"
    assert len(result["policy_violations"]) == 0


def test_policy_blocks_high_severity_attacks():
    """Test that policy blocks high severity attacks."""
    config = {"security": {"sensitivity": "high", "default_action": "block"}}
    policy = PolicyEngine(config)

    sanitization_result = {"is_safe": False, "threats": [{"type": "attack"}], "confidence": 0.9}
    detection_result = {"is_attack": True, "confidence": 0.9, "indicators": [{"severity": "high"}]}

    result = policy.evaluate("Malicious prompt", sanitization_result, detection_result)

    assert result["allowed"] is False
    assert result["action"] == "block"
    assert len(result["policy_violations"]) > 0


def test_policy_warns_on_medium_severity():
    """Test that policy warns on medium severity with low sensitivity."""
    config = {"security": {"sensitivity": "low", "default_action": "block"}}
    policy = PolicyEngine(config)

    sanitization_result = {"is_safe": False, "threats": [{"type": "attack"}], "confidence": 0.5}
    detection_result = {
        "is_attack": True,
        "confidence": 0.5,
        "indicators": [{"severity": "medium"}],
    }

    result = policy.evaluate("Suspicious prompt", sanitization_result, detection_result)

    # With low sensitivity, should allow but warn
    assert result["action"] == "warn" or result["allowed"] is True


def test_policy_respects_sensitivity_levels():
    """Test that policy respects different sensitivity levels."""
    # High sensitivity
    config_high = {"security": {"sensitivity": "high", "default_action": "block"}}
    policy_high = PolicyEngine(config_high)

    sanitization_result = {"is_safe": False, "threats": [{"type": "attack"}], "confidence": 0.6}
    detection_result = {
        "is_attack": True,
        "confidence": 0.6,
        "indicators": [{"severity": "medium"}],
    }

    result_high = policy_high.evaluate("Test", sanitization_result, detection_result)

    # High sensitivity should block medium severity
    assert result_high["allowed"] is False


def test_policy_blocklist_enforced():
    """Test that blocklist terms trigger a block."""
    config = {
        "security": {
            "sensitivity": "medium",
            "default_action": "block",
            "blocklist": ["forbidden term"],
        }
    }
    policy = PolicyEngine(config)

    sanitization_result = {"is_safe": True, "threats": [], "confidence": 0.0}
    detection_result = {"is_attack": False, "confidence": 0.0, "indicators": []}

    result = policy.evaluate(
        "This prompt contains a forbidden term inside.", sanitization_result, detection_result
    )

    assert result["allowed"] is False
    assert any(v.get("policy") == "blocklist" for v in result["policy_violations"])
