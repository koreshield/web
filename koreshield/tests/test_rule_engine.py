"""
Tests for the custom rule engine.
"""

import pytest
from src.koreshield.rule_engine import RuleEngine, CustomRule, RuleSeverity, RuleAction


class TestRuleEngine:
    """Test cases for the custom rule engine."""

    def test_rule_engine_initialization(self):
        """Test rule engine initializes with default rules."""
        engine = RuleEngine()
        assert engine.rules is not None
        assert len(engine.list_rules()) > 0  # Should have default rules

    def test_add_rule(self):
        """Test adding a custom rule."""
        engine = RuleEngine()

        rule = CustomRule(
            id="test_rule",
            name="Test Rule",
            description="A test rule",
            pattern="test.*pattern",
            pattern_type="regex",
            severity=RuleSeverity.MEDIUM,
            action=RuleAction.WARN,
        )

        assert engine.add_rule(rule)
        assert "test_rule" in engine.rules
        assert engine.get_rule("test_rule") == rule

    def test_evaluate_regex_rule(self):
        """Test evaluating text against regex rules."""
        engine = RuleEngine()

        # Clear default rules for clean test
        engine.rules.clear()
        engine._compiled_patterns.clear()

        rule = CustomRule(
            id="email_rule",
            name="Email Detection",
            description="Detect email addresses",
            pattern=r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
            pattern_type="regex",
            severity=RuleSeverity.MEDIUM,
            action=RuleAction.WARN,
        )

        engine.add_rule(rule)

        matches = engine.evaluate("Contact me at test@example.com")
        assert len(matches) == 1
        assert matches[0]["rule_id"] == "email_rule"

    def test_create_rule_from_dsl(self):
        """Test creating rules from DSL strings."""
        engine = RuleEngine()

        dsl = '''RULE test_dsl_rule "DSL Test Rule" "A rule created from DSL"
PATTERN regex "test\\s+pattern"
SEVERITY medium
ACTION warn
TAGS test,dsl
ENABLED true'''

        rule = engine.create_rule_from_dsl(dsl)
        assert rule is not None
        assert rule.id == "test_dsl_rule"
        assert rule.name == "DSL Test Rule"
        assert rule.pattern_type == "regex"
        assert rule.severity == RuleSeverity.MEDIUM
        assert rule.action == RuleAction.WARN
        assert "test" in rule.tags
        assert "dsl" in rule.tags
        assert rule.enabled