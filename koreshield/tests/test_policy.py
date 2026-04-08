"""
Tests for the policy engine.
"""

from koreshield.policy import PolicyEngine, UserRole, Permission


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


def test_policy_rbac_user_role_management():
    """Test user role management in policy engine."""
    policy = PolicyEngine()

    # Test default role
    assert policy.get_user_role("unknown") == UserRole.GUEST

    # Set user role
    policy.set_user_role("user1", UserRole.ADMIN)
    assert policy.get_user_role("user1") == UserRole.ADMIN

    # Change role
    policy.set_user_role("user1", UserRole.USER)
    assert policy.get_user_role("user1") == UserRole.USER


def test_policy_rbac_permission_checking():
    """Test permission checking with RBAC."""
    policy = PolicyEngine()

    # Admin should have all permissions
    policy.set_user_role("admin", UserRole.ADMIN)
    assert policy.has_permission("admin", Permission.MANAGE_RULES)
    assert policy.has_permission("admin", Permission.BYPASS_CHECKS)
    assert policy.has_permission("admin", Permission.MANAGE_USERS)

    # User should have limited permissions
    policy.set_user_role("user", UserRole.USER)
    assert policy.has_permission("user", Permission.VIEW_STATS)
    assert not policy.has_permission("user", Permission.MANAGE_RULES)
    assert not policy.has_permission("user", Permission.BYPASS_CHECKS)


def test_policy_rbac_role_access_check():
    """Test role-based access checking."""
    policy = PolicyEngine()

    policy.set_user_role("admin", UserRole.ADMIN)
    policy.set_user_role("user", UserRole.USER)
    policy.set_user_role("guest", UserRole.GUEST)

    # Admin should have access to admin-only policies
    assert policy.check_role_access("admin", ["admin", "moderator"])

    # User should not have access to admin-only
    assert not policy.check_role_access("user", ["admin"])

    # User should have access to user policies
    assert policy.check_role_access("user", ["user", "admin"])

    # Guest should have limited access
    assert policy.check_role_access("guest", ["guest"])


def test_policy_management():
    """Test policy management methods."""
    policy = PolicyEngine()

    # Test listing policies
    policies = policy.list_policies()
    assert len(policies) >= 3  # Default policies

    # Test adding a policy
    new_policy = {
        "id": "test_policy",
        "name": "Test Policy",
        "description": "A test policy",
        "severity": "medium",
        "roles": ["admin", "user"]
    }

    success = policy.add_policy(new_policy)
    assert success is True

    # Verify policy was added
    policies = policy.list_policies()
    assert any(p["id"] == "test_policy" for p in policies)

    # Test removing policy
    success = policy.remove_policy("test_policy")
    assert success is True

    # Verify policy was removed
    policies = policy.list_policies()
    assert not any(p["id"] == "test_policy" for p in policies)

    # Test adding duplicate policy
    policy.add_policy(new_policy)
    success = policy.add_policy(new_policy)  # Should fail
    assert success is False


def test_policy_role_permissions_update():
    """Test updating role permissions."""
    policy = PolicyEngine()

    # Update moderator permissions
    new_permissions = {Permission.READ_LOGS.value, Permission.VIEW_STATS.value}
    policy.update_role_permissions(UserRole.MODERATOR, new_permissions)

    # Verify permissions were updated
    assert policy.role_permissions[UserRole.MODERATOR.value] == new_permissions

    # Test permission checking with updated permissions
    policy.set_user_role("mod", UserRole.MODERATOR)
    assert policy.has_permission("mod", Permission.READ_LOGS)
    assert policy.has_permission("mod", Permission.VIEW_STATS)
    assert not policy.has_permission("mod", Permission.MANAGE_RULES)


def test_policy_evaluation_with_rbac():
    """Test policy evaluation with RBAC context."""
    config = {"security": {"sensitivity": "high", "default_action": "block"}}
    policy = PolicyEngine(config)

    # Set up user with bypass permission
    policy.set_user_role("admin_user", UserRole.ADMIN)

    sanitization_result = {"is_safe": False, "threats": [{"type": "test"}], "confidence": 0.9}
    detection_result = {"is_attack": True, "confidence": 0.9, "indicators": [{"severity": "high"}]}

    result = policy.evaluate("Malicious prompt", sanitization_result, detection_result, user_id="admin_user")

    # Admin should be allowed due to bypass permission
    assert result["allowed"] is True
    assert result["action"] == "warn"
    assert result["bypass_allowed"] is True
    assert result["user_role"] == "admin"
    assert Permission.BYPASS_CHECKS.value in result["permissions"]


def test_policy_evaluation_anonymous_user():
    """Test policy evaluation for anonymous users."""
    config = {"security": {"sensitivity": "medium", "default_action": "block"}}
    policy = PolicyEngine(config)

    sanitization_result = {"is_safe": False, "threats": [{"type": "test"}], "confidence": 0.8}
    detection_result = {"is_attack": True, "confidence": 0.8, "indicators": [{"severity": "high"}]}

    result = policy.evaluate("Malicious prompt", sanitization_result, detection_result)

    # Anonymous user should be blocked
    assert result["allowed"] is False
    assert result["action"] == "block"
    assert result["user_role"] is None
    assert result["permissions"] == []


def test_tool_call_policy_blocks_critical_runtime_requests():
    """Critical runtime tool calls should be blocked for ordinary users."""
    policy = PolicyEngine({"security": {"tool_call": {"default_action": "block", "review_threshold": "high"}}})
    policy.set_user_role("user1", UserRole.USER)

    result = policy.evaluate_tool_call(
        "bash",
        {
            "risk_class": "critical",
            "capability_signals": ["execution", "credential_access"],
        },
        user_id="user1",
    )

    assert result["allowed"] is False
    assert result["action"] == "block"
    assert result["review_required"] is True
    assert len(result["policy_violations"]) >= 2


def test_tool_call_policy_respects_bypass_permissions():
    """Admins with bypass permission should be warned instead of blocked."""
    policy = PolicyEngine({"security": {"tool_call": {"default_action": "block", "review_threshold": "high"}}})
    policy.set_user_role("admin1", UserRole.ADMIN)

    result = policy.evaluate_tool_call(
        "bash",
        {
            "risk_class": "critical",
            "capability_signals": ["execution"],
        },
        user_id="admin1",
    )

    assert result["allowed"] is True
    assert result["action"] == "warn"
    assert result["bypass_allowed"] is True
    assert result["review_required"] is True


def test_tool_call_policy_flags_confused_deputy_review():
    """Delegated low-trust tool requests should surface a review policy violation."""
    policy = PolicyEngine({"security": {"tool_call": {"default_action": "block", "review_threshold": "high"}}})
    policy.set_user_role("user2", UserRole.USER)

    result = policy.evaluate_tool_call(
        "send_webhook",
        {
            "risk_class": "high",
            "provenance_risk": "high",
            "capability_signals": ["network"],
            "confused_deputy_risk": True,
            "escalation_signals": ["Sensitive capability requested from low-trust or untrusted context."],
        },
        user_id="user2",
    )

    assert any(v["policy"] == "confused_deputy_review" for v in result["policy_violations"])
