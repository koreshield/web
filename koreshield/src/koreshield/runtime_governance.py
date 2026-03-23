"""Runtime session governance and human review workflows for tool calls."""

from __future__ import annotations

from collections import deque
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any, Dict, Optional
import uuid


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


class RuntimeGovernanceManager:
    """In-memory runtime governance layer for session and review workflows."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        tool_config = (config or {}).get("security", {}).get("tool_call", {})
        self.max_sessions = int(tool_config.get("max_runtime_sessions", 500) or 500)
        self.max_reviews = int(tool_config.get("max_runtime_reviews", 1000) or 1000)
        self.sessions: Dict[str, Dict[str, Any]] = {}
        self.reviews: Dict[str, Dict[str, Any]] = {}
        self.session_order = deque(maxlen=self.max_sessions)
        self.review_order = deque(maxlen=self.max_reviews)

    def create_session(self, principal: Dict[str, Any], payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        payload = payload or {}
        session_id = f"rts_{uuid.uuid4().hex}"
        user_id = str(principal.get("user_id") or "")
        session = {
            "session_id": session_id,
            "user_id": user_id or None,
            "email": principal.get("email"),
            "auth_type": principal.get("auth_type"),
            "api_key_id": str(principal.get("api_key_id")) if principal.get("api_key_id") else None,
            "agent_id": payload.get("agent_id"),
            "intent": payload.get("intent"),
            "allowed_tools": list(payload.get("allowed_tools") or []),
            "metadata": payload.get("metadata") or {},
            "max_tool_calls": int(payload.get("max_tool_calls") or 100),
            "state": "active",
            "created_at": _utcnow(),
            "last_activity": _utcnow(),
            "tool_call_count": 0,
            "review_count": 0,
            "blocked_count": 0,
            "history": [],
            "review_ticket_ids": [],
        }
        self.sessions[session_id] = session
        self.session_order.append(session_id)
        self._trim_sessions()
        return self._public_session(session)

    def list_sessions(
        self,
        principal: Dict[str, Any],
        limit: int = 50,
        status: Optional[str] = None,
    ) -> Dict[str, Any]:
        sessions = [
            self._public_session(self.sessions[session_id])
            for session_id in reversed(self.session_order)
            if session_id in self.sessions and self._belongs_to_principal(self.sessions[session_id], principal)
        ]
        if status:
            sessions = [session for session in sessions if session["state"] == status]
        total = len(sessions)
        return {"sessions": sessions[:limit], "total": total, "limit": limit}

    def get_session(self, session_id: str, principal: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        session = self.sessions.get(session_id)
        if not session or not self._belongs_to_principal(session, principal):
            return None
        return self._public_session(session, include_history=True)

    def update_session_state(
        self,
        session_id: str,
        principal: Dict[str, Any],
        new_state: str,
        note: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        session = self.sessions.get(session_id)
        if not session or not self._belongs_to_principal(session, principal):
            return None
        if new_state not in {"active", "suspended", "terminated"}:
            raise ValueError("Unsupported session state")
        session["state"] = new_state
        session["last_activity"] = _utcnow()
        if note:
            session.setdefault("state_notes", []).append({"state": new_state, "note": note, "timestamp": _utcnow()})
        return self._public_session(session, include_history=True)

    def get_session_context(self, session_id: Optional[str], principal: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not session_id:
            return None
        session = self.sessions.get(session_id)
        if not session or not self._belongs_to_principal(session, principal):
            return None
        session["last_activity"] = _utcnow()
        return {
            "session_id": session_id,
            "state": session["state"],
            "prior_tools": [entry["tool_name"] for entry in session["history"][-5:]],
            "prior_tool_events": [
                {
                    "tool_name": entry["tool_name"],
                    "args": entry.get("serialized_args", ""),
                    "capability_signals": entry.get("capability_signals", []),
                    "risk_class": entry.get("risk_class"),
                    "action": entry.get("action"),
                    "timestamp": entry.get("timestamp"),
                }
                for entry in session["history"][-5:]
            ],
            "tool_call_count": session["tool_call_count"],
            "review_count": session["review_count"],
            "blocked_count": session["blocked_count"],
        }

    def record_tool_decision(
        self,
        session_id: Optional[str],
        principal: Dict[str, Any],
        request_id: str,
        tool_analysis: Dict[str, Any],
        policy_result: Dict[str, Any],
        action_taken: str,
        allowed: bool,
    ) -> Dict[str, Any]:
        session_summary = None
        review_ticket = None
        session = None
        if session_id:
            session = self.sessions.get(session_id)
            if not session or not self._belongs_to_principal(session, principal):
                raise KeyError("Runtime session not found")

        if session:
            history_entry = {
                "request_id": request_id,
                "tool_name": tool_analysis.get("tool_name"),
                "serialized_args": tool_analysis.get("serialized_args"),
                "capability_signals": tool_analysis.get("capability_signals", []),
                "risk_class": tool_analysis.get("risk_class"),
                "action": action_taken,
                "allowed": allowed,
                "sequence_matches": tool_analysis.get("sequence_matches", []),
                "timestamp": _utcnow(),
            }
            session["history"].append(history_entry)
            session["history"] = session["history"][-20:]
            session["tool_call_count"] += 1
            session["last_activity"] = _utcnow()
            if not allowed:
                session["blocked_count"] += 1
                session["state"] = "suspended"

        if tool_analysis.get("review_required") or not allowed:
            review_ticket = self._create_review_ticket(
                principal=principal,
                session=session,
                request_id=request_id,
                tool_analysis=tool_analysis,
                policy_result=policy_result,
                action_taken=action_taken,
                allowed=allowed,
            )
            if session:
                session["review_count"] += 1
                session["review_ticket_ids"].append(review_ticket["ticket_id"])

        if session:
            session_summary = self._public_session(session, include_history=True)

        return {"session": session_summary, "review_ticket": review_ticket}

    def list_reviews(
        self,
        principal: Dict[str, Any],
        status: Optional[str] = None,
        limit: int = 50,
    ) -> Dict[str, Any]:
        reviews = [
            self._public_review(self.reviews[ticket_id])
            for ticket_id in reversed(self.review_order)
            if ticket_id in self.reviews and self._belongs_to_principal(self.reviews[ticket_id], principal)
        ]
        if status:
            reviews = [review for review in reviews if review["status"] == status]
        total = len(reviews)
        return {"reviews": reviews[:limit], "total": total, "limit": limit}

    def get_review(self, ticket_id: str, principal: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        review = self.reviews.get(ticket_id)
        if not review or not self._belongs_to_principal(review, principal):
            return None
        return self._public_review(review)

    def decide_review(
        self,
        ticket_id: str,
        principal: Dict[str, Any],
        decision: str,
        note: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        review = self.reviews.get(ticket_id)
        if not review or not self._belongs_to_principal(review, principal):
            return None
        if decision not in {"approved", "rejected"}:
            raise ValueError("Unsupported review decision")

        review["status"] = decision
        review["decision"] = {
            "decision": decision,
            "note": note,
            "actor": principal.get("email") or str(principal.get("user_id") or principal.get("api_key_id") or "system"),
            "timestamp": _utcnow(),
        }
        review["updated_at"] = _utcnow()

        session_id = review.get("session_id")
        session = self.sessions.get(session_id) if session_id else None
        if session:
            session["last_activity"] = _utcnow()
            session["state"] = "active" if decision == "approved" else "suspended"

        return self._public_review(review)

    def _create_review_ticket(
        self,
        principal: Dict[str, Any],
        session: Optional[Dict[str, Any]],
        request_id: str,
        tool_analysis: Dict[str, Any],
        policy_result: Dict[str, Any],
        action_taken: str,
        allowed: bool,
    ) -> Dict[str, Any]:
        ticket_id = f"review_{uuid.uuid4().hex[:12]}"
        review = {
            "ticket_id": ticket_id,
            "request_id": request_id,
            "session_id": session.get("session_id") if session else None,
            "user_id": str(principal.get("user_id")) if principal.get("user_id") else None,
            "email": principal.get("email"),
            "api_key_id": str(principal.get("api_key_id")) if principal.get("api_key_id") else None,
            "tool_name": tool_analysis.get("tool_name"),
            "risk_class": tool_analysis.get("risk_class"),
            "action": action_taken,
            "allowed": allowed,
            "status": "pending",
            "reasons": list(tool_analysis.get("reasons", [])),
            "sequence_matches": list(tool_analysis.get("sequence_matches", [])),
            "capability_signals": list(tool_analysis.get("capability_signals", [])),
            "policy_result": deepcopy(policy_result),
            "tool_analysis": {
                "review_required": tool_analysis.get("review_required"),
                "confused_deputy_risk": tool_analysis.get("confused_deputy_risk"),
                "escalation_signals": list(tool_analysis.get("escalation_signals", [])),
                "trust_context": deepcopy(tool_analysis.get("trust_context", {})),
            },
            "created_at": _utcnow(),
            "updated_at": _utcnow(),
        }
        self.reviews[ticket_id] = review
        self.review_order.append(ticket_id)
        self._trim_reviews()
        return self._public_review(review)

    def _trim_sessions(self) -> None:
        while len(self.session_order) > self.max_sessions:
            expired_id = self.session_order.popleft()
            self.sessions.pop(expired_id, None)

    def _trim_reviews(self) -> None:
        while len(self.review_order) > self.max_reviews:
            expired_id = self.review_order.popleft()
            self.reviews.pop(expired_id, None)

    def _belongs_to_principal(self, record: Dict[str, Any], principal: Dict[str, Any]) -> bool:
        user_id = principal.get("user_id")
        api_key_id = principal.get("api_key_id")
        if user_id and str(record.get("user_id")) == str(user_id):
            return True
        if api_key_id and str(record.get("api_key_id")) == str(api_key_id):
            return True
        return False

    def _public_session(self, session: Dict[str, Any], include_history: bool = False) -> Dict[str, Any]:
        data = {
            "session_id": session["session_id"],
            "state": session["state"],
            "agent_id": session.get("agent_id"),
            "intent": session.get("intent"),
            "allowed_tools": session.get("allowed_tools", []),
            "metadata": session.get("metadata", {}),
            "created_at": session["created_at"],
            "last_activity": session["last_activity"],
            "tool_call_count": session["tool_call_count"],
            "review_count": session["review_count"],
            "blocked_count": session["blocked_count"],
            "pending_reviews": len(
                [ticket_id for ticket_id in session.get("review_ticket_ids", []) if self.reviews.get(ticket_id, {}).get("status") == "pending"]
            ),
            "recent_tools": [entry["tool_name"] for entry in session.get("history", [])[-5:]],
        }
        if include_history:
            data["history"] = deepcopy(session.get("history", []))
            data["review_ticket_ids"] = list(session.get("review_ticket_ids", []))
        return data

    def _public_review(self, review: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "ticket_id": review["ticket_id"],
            "request_id": review["request_id"],
            "session_id": review.get("session_id"),
            "tool_name": review.get("tool_name"),
            "risk_class": review.get("risk_class"),
            "action": review.get("action"),
            "allowed": review.get("allowed"),
            "status": review.get("status"),
            "reasons": list(review.get("reasons", [])),
            "sequence_matches": list(review.get("sequence_matches", [])),
            "capability_signals": list(review.get("capability_signals", [])),
            "policy_result": deepcopy(review.get("policy_result", {})),
            "tool_analysis": deepcopy(review.get("tool_analysis", {})),
            "decision": deepcopy(review.get("decision")),
            "created_at": review.get("created_at"),
            "updated_at": review.get("updated_at"),
        }
