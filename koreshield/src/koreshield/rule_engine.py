"""
Custom Rule Engine with Domain-Specific Language (DSL) for flexible pattern matching.
"""

from typing import Dict, List, Optional, Any, Callable
import re
import structlog
from dataclasses import dataclass
from enum import Enum

logger = structlog.get_logger(__name__)


class RuleSeverity(Enum):
    """Severity levels for custom rules."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RuleAction(Enum):
    """Actions that can be taken when a rule matches."""
    BLOCK = "block"
    WARN = "warn"
    LOG = "log"
    ALLOW = "allow"


@dataclass
class CustomRule:
    """Represents a custom rule definition."""
    id: str
    name: str
    description: str
    pattern: str
    pattern_type: str  # "regex", "keyword", "contains", "startswith", "endswith"
    severity: RuleSeverity
    action: RuleAction
    enabled: bool = True
    tags: List[str] = None
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.tags is None:
            self.tags = []
        if self.metadata is None:
            self.metadata = {}


class RuleEngine:
    """
    Custom rule engine with DSL for defining flexible pattern matching rules.
    """

    def __init__(self, config: Optional[Dict] = None):
        """
        Initialize the rule engine.

        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        self.rules: Dict[str, CustomRule] = {}
        self._compiled_patterns: Dict[str, Any] = {}
        self._load_default_rules()

    def _load_default_rules(self):
        """Load default security rules."""
        default_rules = [
            CustomRule(
                id="suspicious_commands",
                name="Suspicious Command Injection",
                description="Detects attempts to inject system commands",
                pattern=r"(rm\s+-rf|format\s+c:|del\s+/f|shutdown|reboot)",
                pattern_type="regex",
                severity=RuleSeverity.CRITICAL,
                action=RuleAction.BLOCK,
                tags=["command_injection", "system"],
            ),
            CustomRule(
                id="sql_injection",
                name="SQL Injection Attempts",
                description="Detects potential SQL injection patterns",
                pattern=r"(union\s+select|drop\s+table|insert\s+into|--\s+|;\s*drop)",
                pattern_type="regex",
                severity=RuleSeverity.HIGH,
                action=RuleAction.BLOCK,
                tags=["sql_injection", "database"],
            ),
            CustomRule(
                id="xss_attempts",
                name="Cross-Site Scripting",
                description="Detects XSS payload patterns",
                pattern=r"(<script|javascript:|on\w+\s*=|alert\(|document\.cookie)",
                pattern_type="regex",
                severity=RuleSeverity.HIGH,
                action=RuleAction.BLOCK,
                tags=["xss", "web"],
            ),
            CustomRule(
                id="path_traversal",
                name="Path Traversal",
                description="Detects directory traversal attempts",
                pattern=r"(\.\./|\.\.\\|~|\.\./etc|\.\./home)",
                pattern_type="regex",
                severity=RuleSeverity.HIGH,
                action=RuleAction.BLOCK,
                tags=["path_traversal", "filesystem"],
            ),
            CustomRule(
                id="credential_theft",
                name="Credential Theft Attempts",
                description="Detects attempts to extract credentials",
                pattern=r"(api[_-]?key|password|secret|token|auth)",
                pattern_type="regex",
                severity=RuleSeverity.MEDIUM,
                action=RuleAction.WARN,
                tags=["credentials", "privacy"],
            ),
        ]

        for rule in default_rules:
            self.add_rule(rule)

    def add_rule(self, rule: CustomRule) -> bool:
        """
        Add a custom rule to the engine.

        Args:
            rule: The custom rule to add

        Returns:
            True if rule was added successfully, False otherwise
        """
        try:
            # Validate rule
            if not rule.id or rule.id in self.rules:
                logger.warning("Invalid or duplicate rule ID", rule_id=rule.id)
                return False

            # Compile pattern based on type
            if rule.pattern_type == "regex":
                self._compiled_patterns[rule.id] = re.compile(rule.pattern, re.IGNORECASE)
            elif rule.pattern_type in ["keyword", "contains", "startswith", "endswith"]:
                self._compiled_patterns[rule.id] = rule.pattern.lower()
            else:
                logger.warning("Unknown pattern type", pattern_type=rule.pattern_type)
                return False

            self.rules[rule.id] = rule
            logger.info("Rule added successfully", rule_id=rule.id, name=rule.name)
            return True

        except re.error as e:
            logger.error("Invalid regex pattern", rule_id=rule.id, error=str(e))
            return False
        except Exception as e:
            logger.error("Failed to add rule", rule_id=rule.id, error=str(e))
            return False

    def remove_rule(self, rule_id: str) -> bool:
        """
        Remove a rule from the engine.

        Args:
            rule_id: ID of the rule to remove

        Returns:
            True if rule was removed, False otherwise
        """
        if rule_id in self.rules:
            del self.rules[rule_id]
            if rule_id in self._compiled_patterns:
                del self._compiled_patterns[rule_id]
            logger.info("Rule removed", rule_id=rule_id)
            return True
        return False

    def get_rule(self, rule_id: str) -> Optional[CustomRule]:
        """
        Get a rule by ID.

        Args:
            rule_id: ID of the rule to retrieve

        Returns:
            The rule if found, None otherwise
        """
        return self.rules.get(rule_id)

    def list_rules(self, enabled_only: bool = False, tags: Optional[List[str]] = None) -> List[CustomRule]:
        """
        List all rules, optionally filtered.

        Args:
            enabled_only: If True, only return enabled rules
            tags: If provided, only return rules with these tags

        Returns:
            List of matching rules
        """
        rules = list(self.rules.values())

        if enabled_only:
            rules = [r for r in rules if r.enabled]

        if tags:
            rules = [r for r in rules if any(tag in r.tags for tag in tags)]

        return rules

    def evaluate(self, text: str, context: Optional[Dict] = None) -> List[Dict]:
        """
        Evaluate text against all enabled rules.

        Args:
            text: The text to evaluate
            context: Optional context information

        Returns:
            List of rule matches with details
        """
        matches = []
        text_lower = text.lower()

        for rule_id, rule in self.rules.items():
            if not rule.enabled:
                continue

            try:
                match_result = self._check_rule_match(rule, text, text_lower)
                if match_result:
                    match_info = {
                        "rule_id": rule.id,
                        "rule_name": rule.name,
                        "severity": rule.severity.value,
                        "action": rule.action.value,
                        "tags": rule.tags,
                        "match_details": match_result,
                        "description": rule.description,
                    }
                    matches.append(match_info)

            except Exception as e:
                logger.error("Error evaluating rule", rule_id=rule_id, error=str(e))

        return matches

    def _check_rule_match(self, rule: CustomRule, text: str, text_lower: str) -> Optional[Dict]:
        """
        Check if a rule matches the given text.

        Returns:
            Match details if rule matches, None otherwise
        """
        pattern = self._compiled_patterns.get(rule.id)
        if not pattern:
            return None

        if rule.pattern_type == "regex":
            match = pattern.search(text)
            if match:
                return {
                    "matched_text": match.group(),
                    "start_pos": match.start(),
                    "end_pos": match.end(),
                }
        elif rule.pattern_type == "keyword":
            if pattern in text_lower:
                pos = text_lower.find(pattern)
                return {
                    "matched_text": text[pos:pos + len(pattern)],
                    "start_pos": pos,
                    "end_pos": pos + len(pattern),
                }
        elif rule.pattern_type == "contains":
            if pattern in text_lower:
                pos = text_lower.find(pattern)
                return {
                    "matched_text": text[pos:pos + len(pattern)],
                    "start_pos": pos,
                    "end_pos": pos + len(pattern),
                }
        elif rule.pattern_type == "startswith":
            if text_lower.startswith(pattern):
                return {
                    "matched_text": text[:len(pattern)],
                    "start_pos": 0,
                    "end_pos": len(pattern),
                }
        elif rule.pattern_type == "endswith":
            if text_lower.endswith(pattern):
                start_pos = len(text) - len(pattern)
                return {
                    "matched_text": text[start_pos:],
                    "start_pos": start_pos,
                    "end_pos": len(text),
                }

        return None

    def create_rule_from_dsl(self, dsl_string: str) -> Optional[CustomRule]:
        """
        Create a rule from DSL string.

        DSL Format:
        RULE <id> "<name>" "<description>"
        PATTERN <type> "<pattern>"
        SEVERITY <level>
        ACTION <action>
        TAGS <tag1>,<tag2>
        ENABLED <true|false>

        Example:
        RULE suspicious_file "Suspicious File Access" "Detects attempts to access sensitive files"
        PATTERN regex "\\.\\./etc/passwd"
        SEVERITY high
        ACTION block
        TAGS filesystem,sensitive
        ENABLED true

        Args:
            dsl_string: The DSL string defining the rule

        Returns:
            The created rule if successful, None otherwise
        """
        try:
            lines = [line.strip() for line in dsl_string.split('\n') if line.strip()]
            rule_data = {}

            i = 0
            while i < len(lines):
                line = lines[i]
                parts = line.split(None, 1)  # Split on first space only

                if not parts:
                    i += 1
                    continue

                keyword = parts[0].upper()

                if keyword == "RULE":
                    # RULE <id> "<name>" "<description>"
                    # Parse quoted strings properly
                    import re
                    match = re.match(r'RULE\s+(\S+)\s+"([^"]+)"\s+"([^"]+)"', line, re.IGNORECASE)
                    if match:
                        rule_data['id'] = match.group(1)
                        rule_data['name'] = match.group(2)
                        rule_data['description'] = match.group(3)
                elif keyword == "PATTERN":
                    # PATTERN <type> "<pattern>"
                    match = re.match(r'PATTERN\s+(\S+)\s+"([^"]+)"', line, re.IGNORECASE)
                    if match:
                        rule_data['pattern_type'] = match.group(1)
                        rule_data['pattern'] = match.group(2)
                elif keyword == "SEVERITY":
                    rule_data['severity'] = RuleSeverity(parts[1])
                elif keyword == "ACTION":
                    rule_data['action'] = RuleAction(parts[1])
                elif keyword == "TAGS":
                    tags_str = parts[1] if len(parts) > 1 else ""
                    rule_data['tags'] = [tag.strip() for tag in tags_str.split(',') if tag.strip()]
                elif keyword == "ENABLED":
                    rule_data['enabled'] = parts[1].lower() == 'true'

                i += 1

            # Validate required fields
            required_fields = ['id', 'name', 'description', 'pattern', 'pattern_type', 'severity', 'action']
            if not all(field in rule_data for field in required_fields):
                logger.error("Missing required fields in DSL", missing=[f for f in required_fields if f not in rule_data])
                return None

            # Set defaults
            rule_data.setdefault('enabled', True)
            rule_data.setdefault('tags', [])

            return CustomRule(**rule_data)

        except Exception as e:
            logger.error("Failed to parse DSL", error=str(e), dsl=dsl_string[:100])
            return None
