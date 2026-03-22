"""
Policy engine for evaluating security rules and policies with RBAC support.
"""

from typing import Any, Dict, List, Optional, Set
import structlog
from enum import Enum

logger = structlog.get_logger(__name__)


class UserRole(Enum):
    """User roles for RBAC."""
    ADMIN = "admin"
    MODERATOR = "moderator"
    USER = "user"
    GUEST = "guest"


class Permission(Enum):
    """Permissions for different actions."""
    READ_LOGS = "read_logs"
    MANAGE_RULES = "manage_rules"
    MANAGE_LISTS = "manage_lists"
    BYPASS_CHECKS = "bypass_checks"
    VIEW_STATS = "view_stats"
    MANAGE_USERS = "manage_users"


class PolicyEngine:
    """
    Engine for evaluating security policies and rules with RBAC support.
    """

    def __init__(self, config: Optional[Dict] = None):
        """
        Initialize the policy engine.

        Args:
            config: Configuration dictionary containing policies
        """
        self.config = config or {}
        self.policies = self._load_policies()
        self.role_permissions = self._load_role_permissions()
        self.user_roles: Dict[str, UserRole] = {}  # user_id -> role

    def _load_policies(self) -> List[Dict]:
        """
        Load security policies from configuration.

        Returns:
            List of policy dictionaries
        """
        # Load from config if available
        if self.config and "policies" in self.config:
            return self.config["policies"].copy()

        # Default policies
        return [
            {
                "id": "sanitization_required",
                "name": "Sanitization Check Required",
                "description": "All prompts must pass sanitization checks",
                "severity": "high",
                "roles": [UserRole.ADMIN.value, UserRole.MODERATOR.value, UserRole.USER.value, UserRole.GUEST.value],
            },
            {
                "id": "attack_detection",
                "name": "Attack Detection",
                "description": "Prompts must not contain detected attacks",
                "severity": "high",
                "roles": [UserRole.ADMIN.value, UserRole.MODERATOR.value, UserRole.USER.value, UserRole.GUEST.value],
            },
            {
                "id": "blocklist_enforcement",
                "name": "Blocklist Enforcement",
                "description": "Blocked terms are not allowed",
                "severity": "high",
                "roles": [UserRole.ADMIN.value, UserRole.MODERATOR.value, UserRole.USER.value, UserRole.GUEST.value],
            },
            {
                "id": "tool_execution_review",
                "name": "Tool Execution Review",
                "description": "Execution-capable tool calls require runtime review",
                "severity": "high",
                "roles": [UserRole.ADMIN.value, UserRole.MODERATOR.value, UserRole.USER.value, UserRole.GUEST.value],
            },
            {
                "id": "tool_credential_access_review",
                "name": "Credential Access Review",
                "description": "Tool calls that touch credentials or secrets must be scrutinized",
                "severity": "high",
                "roles": [UserRole.ADMIN.value, UserRole.MODERATOR.value, UserRole.USER.value, UserRole.GUEST.value],
            },
            {
                "id": "critical_tool_call_block",
                "name": "Critical Tool Call Block",
                "description": "Critical-risk tool calls are blocked unless bypassed",
                "severity": "critical",
                "roles": [UserRole.ADMIN.value, UserRole.MODERATOR.value, UserRole.USER.value, UserRole.GUEST.value],
            },
        ]

    def _load_role_permissions(self) -> Dict[str, Set[str]]:
        """
        Load role-based permissions.

        Returns:
            Dictionary mapping roles to permission sets
        """
        return {
            UserRole.ADMIN.value: {
                Permission.READ_LOGS.value,
                Permission.MANAGE_RULES.value,
                Permission.MANAGE_LISTS.value,
                Permission.BYPASS_CHECKS.value,
                Permission.VIEW_STATS.value,
                Permission.MANAGE_USERS.value,
            },
            UserRole.MODERATOR.value: {
                Permission.READ_LOGS.value,
                Permission.MANAGE_RULES.value,
                Permission.MANAGE_LISTS.value,
                Permission.VIEW_STATS.value,
            },
            UserRole.USER.value: {
                Permission.READ_LOGS.value,
                Permission.VIEW_STATS.value,
            },
            UserRole.GUEST.value: set(),  # No permissions
        }

    def set_user_role(self, user_id: str, role: UserRole):
        """
        Set a user's role.

        Args:
            user_id: The user ID
            role: The role to assign
        """
        self.user_roles[user_id] = role
        logger.info("User role set", user_id=user_id, role=role.value)

    def get_user_role(self, user_id: str) -> UserRole:
        """
        Get a user's role.

        Args:
            user_id: The user ID

        Returns:
            The user's role, defaults to GUEST
        """
        return self.user_roles.get(user_id, UserRole.GUEST)

    def has_permission(self, user_id: str, permission: Permission) -> bool:
        """
        Check if a user has a specific permission.

        Args:
            user_id: The user ID
            permission: The permission to check

        Returns:
            True if user has the permission
        """
        user_role = self.get_user_role(user_id)
        role_permissions = self.role_permissions.get(user_role.value, set())
        return permission.value in role_permissions

    def check_role_access(self, user_id: str, required_roles: List[str]) -> bool:
        """
        Check if a user has access based on required roles.

        Args:
            user_id: The user ID
            required_roles: List of role names that have access

        Returns:
            True if user has access
        """
        user_role = self.get_user_role(user_id)
        return user_role.value in required_roles

    def evaluate(
        self,
        prompt: str,
        sanitization_result: Dict,
        detection_result: Dict,
        user_id: Optional[str] = None,
        context: Optional[Dict] = None
    ) -> Dict:
        """
        Evaluate a request against security policies with RBAC.

        Args:
            prompt: The input prompt
            sanitization_result: Results from sanitization engine
            detection_result: Results from attack detector
            user_id: Optional user ID for RBAC checks
            context: Optional additional context

        Returns:
            Dictionary with policy evaluation results:
            - allowed: Boolean indicating if request is allowed
            - action: Action to take (allow, block, warn)
            - reason: Reason for the decision
            - policy_violations: List of violated policies
            - user_role: User's role (if user_id provided)
            - permissions: User's permissions (if user_id provided)
        """
        violations = []
        allowed = True
        action = "allow"
        reason = "No policy violations"

        # Get user role and permissions
        user_role = None
        user_permissions = []
        bypass_allowed = False

        if user_id:
            user_role = self.get_user_role(user_id)
            user_permissions = list(self.role_permissions.get(user_role.value, set()))
            bypass_allowed = self.has_permission(user_id, Permission.BYPASS_CHECKS)

        # Get security configuration
        sensitivity = self.config.get("security", {}).get("sensitivity", "medium")
        default_action = self.config.get("security", {}).get("default_action", "block")

        # Check sanitization results
        if not sanitization_result.get("is_safe", True):
            policy = self._get_policy_by_id("sanitization_required")
            if policy and self._check_policy_access(user_id, policy):
                violations.append(
                    {
                        "policy": "sanitization_check",
                        "severity": "high",
                        "details": sanitization_result.get("threats", []),
                        "policy_id": policy["id"],
                    }
                )

        # Check detection results
        if detection_result.get("is_attack", False):
            policy = self._get_policy_by_id("attack_detection")
            if policy and self._check_policy_access(user_id, policy):
                violations.append(
                    {
                        "policy": "attack_detection",
                        "severity": "high" if detection_result.get("confidence", 0) > 0.7 else "medium",
                        "details": detection_result.get("indicators", []),
                        "policy_id": policy["id"],
                    }
                )

        # Blocklist enforcement
        blocklist = self.config.get("security", {}).get("blocklist", [])
        prompt_lower = prompt.lower()
        for term in blocklist:
            if term.lower() in prompt_lower:
                policy = self._get_policy_by_id("blocklist_enforcement")
                if policy and self._check_policy_access(user_id, policy):
                    violations.append(
                        {
                            "policy": "blocklist",
                            "severity": "high",
                            "details": {"term": term},
                            "policy_id": policy["id"],
                        }
                    )

        # Make decision based on violations, sensitivity, and RBAC
        if violations:
            high_severity_violations = [v for v in violations if v.get("severity") == "high"]

            if high_severity_violations:
                # Check if user can bypass high severity violations
                if bypass_allowed:
                    allowed = True
                    action = "warn"
                    reason = f"High severity violations detected but user {user_id} has bypass permission"
                elif sensitivity in ["high", "medium"]:
                    allowed = False
                    action = default_action
                    reason = f"High severity policy violations detected: {len(high_severity_violations)}"
                else:
                    # Low sensitivity - warn but allow
                    allowed = True
                    action = "warn"
                    reason = f"High severity violations detected but sensitivity is low: {len(high_severity_violations)}"
            else:
                # Medium severity violations
                if bypass_allowed:
                    allowed = True
                    action = "allow"
                    reason = f"Medium severity violations detected but user {user_id} has bypass permission"
                elif sensitivity == "high":
                    allowed = False
                    action = default_action
                    reason = f"Medium severity policy violations detected: {len(violations)}"
                else:
                    allowed = True
                    action = "warn"
                    reason = f"Policy violations detected but within tolerance: {len(violations)}"

        result = {
            "allowed": allowed,
            "action": action,
            "reason": reason,
            "policy_violations": violations,
            "user_role": user_role.value if user_role else None,
            "permissions": user_permissions,
            "bypass_allowed": bypass_allowed,
        }

        logger.debug(
            "Policy evaluation complete",
            allowed=allowed,
            action=action,
            violations=len(violations),
            user_id=user_id,
            user_role=user_role.value if user_role else None,
        )

        return result

    def evaluate_tool_call(
        self,
        tool_name: str,
        tool_analysis: Dict[str, Any],
        user_id: Optional[str] = None,
        context: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """Evaluate a server-side tool call against runtime security policies."""
        violations = []
        user_role = None
        user_permissions = []
        bypass_allowed = False

        if user_id:
            user_role = self.get_user_role(user_id)
            user_permissions = list(self.role_permissions.get(user_role.value, set()))
            bypass_allowed = self.has_permission(user_id, Permission.BYPASS_CHECKS)

        tool_config = self.config.get("security", {}).get("tool_call", {})
        default_action = tool_config.get("default_action", "block")
        review_threshold = tool_config.get("review_threshold", "high")
        risk_class = tool_analysis.get("risk_class", "low")
        capability_signals = tool_analysis.get("capability_signals", [])

        if risk_class == "critical":
            policy = self._get_policy_by_id("critical_tool_call_block")
            if policy and self._check_policy_access(user_id, policy):
                violations.append(
                    {
                        "policy": "critical_tool_call",
                        "severity": "critical",
                        "details": {"tool_name": tool_name, "risk_class": risk_class},
                        "policy_id": policy["id"],
                    }
                )

        if "execution" in capability_signals:
            policy = self._get_policy_by_id("tool_execution_review")
            if policy and self._check_policy_access(user_id, policy):
                violations.append(
                    {
                        "policy": "tool_execution_review",
                        "severity": "high",
                        "details": {"tool_name": tool_name, "capability": "execution"},
                        "policy_id": policy["id"],
                    }
                )

        if "credential_access" in capability_signals:
            policy = self._get_policy_by_id("tool_credential_access_review")
            if policy and self._check_policy_access(user_id, policy):
                violations.append(
                    {
                        "policy": "tool_credential_access_review",
                        "severity": "high",
                        "details": {"tool_name": tool_name, "capability": "credential_access"},
                        "policy_id": policy["id"],
                    }
                )

        rank_threshold = {"low": 0, "medium": 1, "high": 2, "critical": 3}
        review_required = rank_threshold.get(risk_class, 0) >= rank_threshold.get(review_threshold, 2)

        if violations and not bypass_allowed:
            highest = max(v["severity"] for v in violations)
            if highest in {"critical", "high"}:
                allowed = False
                action = default_action
                reason = f"Tool call blocked by runtime policy: {tool_name}"
            else:
                allowed = True
                action = "warn"
                reason = f"Tool call requires review: {tool_name}"
        else:
            allowed = True
            action = "warn" if review_required else "allow"
            reason = "Tool call allowed"

        return {
            "allowed": allowed,
            "action": action,
            "reason": reason,
            "policy_violations": violations,
            "user_role": user_role.value if user_role else None,
            "permissions": user_permissions,
            "bypass_allowed": bypass_allowed,
            "review_required": review_required,
            "risk_class": risk_class,
        }

    def _get_policy_by_id(self, policy_id: str) -> Optional[Dict]:
        """Get a policy by ID."""
        for policy in self.policies:
            if policy["id"] == policy_id:
                return policy
        return None

    def _check_policy_access(self, user_id: Optional[str], policy: Dict) -> bool:
        """
        Check if a user has access to a policy based on roles.

        Args:
            user_id: The user ID (None for anonymous)
            policy: The policy to check

        Returns:
            True if user has access to the policy
        """
        if not user_id:
            # Anonymous users only have access to policies that allow all roles
            return UserRole.GUEST.value in policy.get("roles", [])

        user_role = self.get_user_role(user_id)
        return user_role.value in policy.get("roles", [])

    # RBAC Management Methods

    def add_policy(self, policy: Dict) -> bool:
        """
        Add a new policy.

        Args:
            policy: Policy definition dictionary

        Returns:
            True if policy was added
        """
        if any(p["id"] == policy["id"] for p in self.policies):
            logger.warning("Policy ID already exists", policy_id=policy["id"])
            return False

        self.policies.append(policy)
        logger.info("Policy added", policy_id=policy["id"])
        return True

    def remove_policy(self, policy_id: str) -> bool:
        """
        Remove a policy.

        Args:
            policy_id: ID of policy to remove

        Returns:
            True if policy was removed
        """
        for i, policy in enumerate(self.policies):
            if policy["id"] == policy_id:
                del self.policies[i]
                logger.info("Policy removed", policy_id=policy_id)
                return True
        return False

    def list_policies(self) -> List[Dict]:
        """
        List all policies.

        Returns:
            List of policy dictionaries
        """
        return self.policies.copy()

    def update_role_permissions(self, role: UserRole, permissions: Set[str]):
        """
        Update permissions for a role.

        Args:
            role: The role to update
            permissions: Set of permission strings
        """
        self.role_permissions[role.value] = permissions
        logger.info("Role permissions updated", role=role.value, permissions=list(permissions))
