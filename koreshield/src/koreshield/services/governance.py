"""
Governance service for KoreShield.
Handles tool security and runtime session management.
"""

import structlog
from typing import Optional, Any

from ..tool_security import ToolCallSecurityAnalyzer
from ..runtime_governance import RuntimeGovernanceManager
from ..policy import PolicyEngine

logger = structlog.get_logger(__name__)

class GovernanceService:
    def __init__(self, config: dict, detector: Any):
        self.config = config
        self.tool_security = ToolCallSecurityAnalyzer(detector)
        self.runtime_governance = RuntimeGovernanceManager(config)
        self.policy_engine = PolicyEngine(config)

    def analyze_tool_call(self, tool_name: str, args: dict, context: dict, principal: dict) -> dict:
        """Evaluate a tool call for security risks."""
        session_id = context.get("session_id") or context.get("sessionId")
        session_context = self.runtime_governance.get_session_context(session_id, principal)
        
        if session_context:
            merged_context = dict(context)
            merged_context.update({
                "prior_tools": session_context.get("prior_tools", []),
                "prior_tool_events": session_context.get("prior_tool_events", []),
                "session_state": session_context.get("state")
            })
            context = merged_context

        tool_analysis = self.tool_security.analyze(tool_name, args, context)
        policy_result = self.policy_engine.evaluate_tool_call(
            tool_name=tool_name,
            tool_analysis=tool_analysis,
            user_id=str(principal.get("user_id")) if principal.get("user_id") else None,
            context={"principal": principal}
        )

        should_block = tool_analysis.get("suggested_action") == "block" or policy_result.get("allowed") is False
        action_taken = "blocked" if should_block else policy_result.get("action", tool_analysis.get("suggested_action", "allow"))

        return {
            "analysis": tool_analysis,
            "policy": policy_result,
            "blocked": should_block,
            "action": action_taken,
            "session_id": session_id
        }

    def record_decision(self, session_id, principal, request_id, tool_analysis, policy_result, action_taken, allowed):
        return self.runtime_governance.record_tool_decision(
            session_id=session_id,
            principal=principal,
            request_id=request_id,
            tool_analysis=tool_analysis,
            policy_result=policy_result,
            action_taken=action_taken,
            allowed=allowed
        )

    def create_session(self, principal, body):
        return self.runtime_governance.create_session(principal, body)

    def list_sessions(self, principal, limit=50, status=None):
        return self.runtime_governance.list_sessions(principal, limit=limit, status=status)

    def update_session(self, session_id, principal, new_state, note=None):
        return self.runtime_governance.update_session_state(session_id, principal, new_state, note=note)

    def get_session(self, session_id, principal):
        return self.runtime_governance.get_session(session_id, principal)

    def get_session_context(self, session_id, principal):
        return self.runtime_governance.get_session_context(session_id, principal)

    def list_reviews(self, principal, status=None, limit=50):
        return self.runtime_governance.list_reviews(principal, status=status, limit=limit)

    def get_review(self, ticket_id, principal):
        return self.runtime_governance.get_review(ticket_id, principal)

    def decide_review(self, ticket_id, principal, decision, note=None):
        return self.runtime_governance.decide_review(ticket_id, principal, decision, note=note)
