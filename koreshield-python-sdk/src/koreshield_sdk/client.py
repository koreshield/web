"""Synchronous KoreShield client."""

from __future__ import annotations

import json as _json
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Dict, Iterator, List, Literal, Optional, Union

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from . import __version__
from .exceptions import (
    AuthenticationError,
    KoreShieldError,
    NetworkError,
    RateLimitError,
    ServerError,
    TimeoutError,
    ValidationError,
)
from .local_security import (
    preflight_scan_prompt,
    preflight_scan_rag_context,
    preflight_scan_tool_call,
)
from .types import (
    AuthConfig,
    BatchScanRequest,
    BatchScanResponse,
    DetectionResult,
    LocalPreflightResult,
    RAGDocument,
    RAGPreflightResult,
    RAGScanRequest,
    RAGScanResponse,
    ScanRequest,
    ScanResponse,
    ToolCallPreflightResult,
    ToolScanResponse,
    ToolTrustContext,
)

TimeRange = Literal["today", "7d", "30d", "90d", "1y"]


class KoreShieldClient:
    """Synchronous KoreShield API client."""

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.koreshield.com",
        timeout: float = 30.0,
    ):
        """Initialise the KoreShield client.

        Args:
            api_key: Your KoreShield API key.
            base_url: Base URL for the API (default: production).
            timeout: Request timeout in seconds.
        """
        self.auth_config = AuthConfig(
            api_key=api_key,
            base_url=base_url.rstrip("/"),
            timeout=timeout,
        )

        self.session = requests.Session()

        retry_strategy = Retry(
            total=3,
            status_forcelist=[429, 500, 502, 503, 504],
            backoff_factor=1,
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

        # API keys are sent via X-API-Key.
        # Authorization: Bearer is reserved for JWT session tokens.
        self.session.headers.update(
            {
                "X-API-Key": api_key,
                "Content-Type": "application/json",
                "User-Agent": f"koreshield-python-sdk/{__version__}",
            }
        )

    # ──────────────────────────────────────────────────────────────────────────
    # Core scanning
    # ──────────────────────────────────────────────────────────────────────────

    def scan_prompt(self, prompt: str, **kwargs: Any) -> DetectionResult:
        """Scan a single prompt for security threats."""
        request = ScanRequest(prompt=prompt, **kwargs)
        response = self._make_request("POST", "/v1/scan", request.model_dump())
        scan_response = ScanResponse(**response)
        return scan_response.result

    def preflight_prompt(self, prompt: str) -> LocalPreflightResult:
        """Run a local prompt scan without calling the KoreShield API."""
        return preflight_scan_prompt(prompt)

    def preflight_tool_call(
        self,
        tool_name: str,
        args: Any,
        context: Optional[Union[Dict[str, Any], ToolTrustContext]] = None,
    ) -> ToolCallPreflightResult:
        """Run a local tool-call preflight scan before execution."""
        return preflight_scan_tool_call(tool_name, args, context)

    def preflight_rag_context(
        self,
        user_query: str,
        documents: List[Union[Dict[str, Any], RAGDocument]],
    ) -> RAGPreflightResult:
        """Run a local preflight scan across retrieved RAG documents."""
        rag_documents = [
            RAGDocument(id=d["id"], content=d["content"], metadata=d.get("metadata", {}))
            if isinstance(d, dict)
            else d
            for d in documents
        ]
        return preflight_scan_rag_context(user_query, rag_documents)

    def scan_tool_call(
        self,
        tool_name: str,
        args: Any = None,
        context: Optional[Union[Dict[str, Any], ToolTrustContext]] = None,
    ) -> ToolScanResponse:
        """Scan a tool call server-side before execution."""
        response = self._make_request(
            "POST",
            "/v1/tools/scan",
            {
                "tool_name": tool_name,
                "args": args,
                "context": context.model_dump() if isinstance(context, ToolTrustContext) else context,
            },
        )
        return ToolScanResponse(**response)

    def scan_batch(
        self,
        prompts: List[str],
        parallel: bool = True,
        max_concurrent: int = 10,
    ) -> List[DetectionResult]:
        """Scan multiple prompts using the server-side batch endpoint."""
        requests_list = [ScanRequest(prompt=p) for p in prompts]
        batch_request = BatchScanRequest(
            requests=requests_list,
            parallel=parallel,
            max_concurrent=max_concurrent,
        )
        response = self._make_request("POST", "/v1/scan/batch", batch_request.model_dump())
        batch_response = BatchScanResponse(**response)
        return [sr.result for sr in batch_response.results]

    def get_scan_history(self, limit: int = 50, offset: int = 0, **filters: Any) -> Dict[str, Any]:
        """Get scan history with optional filters."""
        params = {"limit": limit, "offset": offset, **filters}
        return self._make_request("GET", "/v1/scans", params=params)

    def get_scan_details(self, scan_id: str) -> Dict[str, Any]:
        """Get detailed information about a specific scan."""
        return self._make_request("GET", f"/v1/scans/{scan_id}")

    # ──────────────────────────────────────────────────────────────────────────
    # RAG scanning
    # ──────────────────────────────────────────────────────────────────────────

    def scan_rag_context(
        self,
        user_query: str,
        documents: List[Union[Dict[str, Any], RAGDocument]],
        config: Optional[Dict[str, Any]] = None,
    ) -> RAGScanResponse:
        """Scan retrieved RAG context for indirect prompt injection attacks."""
        rag_documents = [
            RAGDocument(id=d["id"], content=d["content"], metadata=d.get("metadata", {}))
            if isinstance(d, dict)
            else d
            for d in documents
        ]
        request = RAGScanRequest(user_query=user_query, documents=rag_documents, config=config or {})
        response = self._make_request("POST", "/v1/rag/scan", request.model_dump())
        return RAGScanResponse(**response)

    def scan_rag_context_batch(
        self,
        queries_and_docs: List[Dict[str, Any]],
        parallel: bool = True,
        max_concurrent: int = 5,
    ) -> List[RAGScanResponse]:
        """Scan multiple RAG contexts in batch (client-side parallel)."""
        if not parallel:
            return [
                self.scan_rag_context(
                    user_query=item["user_query"],
                    documents=item["documents"],
                    config=item.get("config"),
                )
                for item in queries_and_docs
            ]

        results: List[RAGScanResponse] = [None] * len(queries_and_docs)  # type: ignore[list-item]

        def _scan(index_and_item: tuple) -> tuple:
            idx, item = index_and_item
            return idx, self.scan_rag_context(
                user_query=item["user_query"],
                documents=item["documents"],
                config=item.get("config"),
            )

        with ThreadPoolExecutor(max_workers=max_concurrent) as executor:
            futures = {
                executor.submit(_scan, (idx, item)): idx
                for idx, item in enumerate(queries_and_docs)
            }
            for future in as_completed(futures):
                idx, result = future.result()
                results[idx] = result

        return results

    def get_rag_scan_history(self, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """Get RAG scan history."""
        return self._make_request("GET", "/v1/rag/scans", params={"limit": limit, "offset": offset})

    def get_rag_scan_details(self, scan_id: str) -> Dict[str, Any]:
        """Get details for a specific RAG scan."""
        return self._make_request("GET", f"/v1/rag/scans/{scan_id}")

    def delete_rag_scan(self, scan_id: str) -> Dict[str, Any]:
        """Delete a specific RAG scan record."""
        return self._make_request("DELETE", f"/v1/rag/scans/{scan_id}")

    # ──────────────────────────────────────────────────────────────────────────
    # LLM Proxy — chat completions
    # ──────────────────────────────────────────────────────────────────────────

    def chat_completion(
        self,
        messages: List[Dict[str, Any]],
        model: str = "gpt-4o-mini",
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """Send a chat completion through the KoreShield proxy."""
        payload: Dict[str, Any] = {"messages": messages, "model": model, **kwargs}
        payload.pop("stream", None)
        return self._make_request("POST", "/v1/chat/completions", data=payload)

    def chat_completion_stream(
        self,
        messages: List[Dict[str, Any]],
        model: str = "gpt-4o-mini",
        **kwargs: Any,
    ) -> Iterator[str]:
        """Stream a chat completion through the KoreShield proxy.

        Yields text delta strings as they arrive from the upstream provider.

        Example::

            for token in client.chat_completion_stream(
                model="gpt-4o",
                messages=[{"role": "user", "content": "Hello"}],
            ):
                print(token, end="", flush=True)
        """
        url = f"{self.auth_config.base_url}/v1/chat/completions"
        payload: Dict[str, Any] = {
            "messages": messages,
            "model": model,
            "stream": True,
            **{k: v for k, v in kwargs.items() if k != "stream"},
        }

        with self.session.post(
            url, json=payload, stream=True, timeout=self.auth_config.timeout * 4
        ) as response:
            if response.status_code == 403:
                data = response.json() if response.content else {}
                raise ServerError(
                    data.get("reason", "Prompt blocked by KoreShield"),
                    status_code=403,
                    response_data=data,
                )
            response.raise_for_status()

            for raw_line in response.iter_lines():
                if not raw_line:
                    continue
                line = raw_line.decode("utf-8") if isinstance(raw_line, bytes) else raw_line
                if not line.startswith("data: "):
                    continue
                payload_str = line[6:].strip()
                if payload_str == "[DONE]":
                    break
                try:
                    chunk = _json.loads(payload_str)
                except _json.JSONDecodeError:
                    continue
                choices = chunk.get("choices", [])
                if choices:
                    content = choices[0].get("delta", {}).get("content", "")
                    if content:
                        yield content

    # ──────────────────────────────────────────────────────────────────────────
    # Health & status
    # ──────────────────────────────────────────────────────────────────────────

    def health_check(self) -> Dict[str, Any]:
        """Check API health and version information."""
        return self._make_request("GET", "/health")

    def get_provider_health(self) -> Dict[str, Any]:
        """Get health status of all LLM providers."""
        return self._make_request("GET", "/health/providers")

    # ──────────────────────────────────────────────────────────────────────────
    # User profile
    # ──────────────────────────────────────────────────────────────────────────

    def get_me(self) -> Dict[str, Any]:
        """Get the current authenticated user's profile."""
        return self._make_request("GET", "/v1/management/me")

    def update_me(
        self,
        name: Optional[str] = None,
        company: Optional[str] = None,
        job_title: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Update the current user's profile."""
        payload = {k: v for k, v in {"name": name, "company": company, "job_title": job_title}.items() if v is not None}
        return self._make_request("PATCH", "/v1/management/me", data=payload)

    # ──────────────────────────────────────────────────────────────────────────
    # API keys
    # ──────────────────────────────────────────────────────────────────────────

    def list_api_keys(self) -> Dict[str, Any]:
        """List all API keys for the current account."""
        return self._make_request("GET", "/v1/management/api-keys")

    def create_api_key(self, name: str, **kwargs: Any) -> Dict[str, Any]:
        """Create a new API key."""
        return self._make_request("POST", "/v1/management/api-keys", data={"name": name, **kwargs})

    def get_api_key(self, key_id: str) -> Dict[str, Any]:
        """Get details for a specific API key."""
        return self._make_request("GET", f"/v1/management/api-keys/{key_id}")

    def revoke_api_key(self, key_id: str) -> Dict[str, Any]:
        """Revoke an API key."""
        return self._make_request("DELETE", f"/v1/management/api-keys/{key_id}")

    # ──────────────────────────────────────────────────────────────────────────
    # Stats & metrics
    # ──────────────────────────────────────────────────────────────────────────

    def get_stats(self) -> Dict[str, Any]:
        """Get per-account statistics."""
        return self._make_request("GET", "/v1/management/stats")

    def get_audit_logs(self, limit: int = 100, offset: int = 0, level: Optional[str] = None) -> Dict[str, Any]:
        """Get audit logs."""
        params: Dict[str, Any] = {"limit": limit, "offset": offset}
        if level:
            params["level"] = level
        return self._make_request("GET", "/v1/management/logs", params=params)

    def export_threat_logs(self) -> bytes:
        """Download threat and block logs as a CSV byte string."""
        url = f"{self.auth_config.base_url}/v1/management/export/threats"
        try:
            response = self.session.get(url, timeout=self.auth_config.timeout * 4)
            response.raise_for_status()
            return response.content
        except requests.exceptions.Timeout:
            raise TimeoutError("Request timed out")
        except requests.exceptions.ConnectionError:
            raise NetworkError("Network connection failed")

    # ──────────────────────────────────────────────────────────────────────────
    # Security config
    # ──────────────────────────────────────────────────────────────────────────

    def get_security_config(self) -> Dict[str, Any]:
        """Get current security configuration."""
        return self._make_request("GET", "/v1/management/config")

    def update_security_config(self, sensitivity: Optional[str] = None, default_action: Optional[str] = None) -> Dict[str, Any]:
        """Update security configuration."""
        payload = {k: v for k, v in {"sensitivity": sensitivity, "default_action": default_action}.items() if v is not None}
        return self._make_request("PATCH", "/v1/management/config/security", data=payload)

    # ──────────────────────────────────────────────────────────────────────────
    # Policies
    # ──────────────────────────────────────────────────────────────────────────

    def list_policies(self) -> Dict[str, Any]:
        """List all security policies."""
        return self._make_request("GET", "/v1/management/policies")

    def create_policy(self, policy: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new security policy."""
        return self._make_request("POST", "/v1/management/policies", data=policy)

    def delete_policy(self, policy_id: str) -> Dict[str, Any]:
        """Delete a security policy."""
        return self._make_request("DELETE", f"/v1/management/policies/{policy_id}")

    # ──────────────────────────────────────────────────────────────────────────
    # Rules
    # ──────────────────────────────────────────────────────────────────────────

    def list_rules(self) -> Dict[str, Any]:
        """List all detection rules."""
        return self._make_request("GET", "/v1/management/rules")

    def get_rule(self, rule_id: str) -> Dict[str, Any]:
        """Get a specific rule by ID."""
        return self._make_request("GET", f"/v1/management/rules/{rule_id}")

    def create_rule(self, rule: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new detection rule."""
        return self._make_request("POST", "/v1/management/rules", data=rule)

    def update_rule(self, rule_id: str, rule: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing detection rule."""
        return self._make_request("PUT", f"/v1/management/rules/{rule_id}", data=rule)

    def delete_rule(self, rule_id: str) -> Dict[str, Any]:
        """Delete a detection rule."""
        return self._make_request("DELETE", f"/v1/management/rules/{rule_id}")

    def test_rule(self, pattern: str, test_input: str) -> Dict[str, Any]:
        """Test a rule pattern against a sample input."""
        return self._make_request("POST", "/v1/management/rules/test", data={"pattern": pattern, "test_input": test_input})

    # ──────────────────────────────────────────────────────────────────────────
    # Alerts
    # ──────────────────────────────────────────────────────────────────────────

    def list_alert_rules(self) -> Dict[str, Any]:
        """List all alert rules."""
        return self._make_request("GET", "/v1/management/alerts/rules")

    def get_alert_rule(self, rule_id: str) -> Dict[str, Any]:
        """Get a specific alert rule."""
        return self._make_request("GET", f"/v1/management/alerts/rules/{rule_id}")

    def create_alert_rule(self, rule: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new alert rule."""
        return self._make_request("POST", "/v1/management/alerts/rules", data=rule)

    def update_alert_rule(self, rule_id: str, rule: Dict[str, Any]) -> Dict[str, Any]:
        """Update an alert rule."""
        return self._make_request("PUT", f"/v1/management/alerts/rules/{rule_id}", data=rule)

    def delete_alert_rule(self, rule_id: str) -> Dict[str, Any]:
        """Delete an alert rule."""
        return self._make_request("DELETE", f"/v1/management/alerts/rules/{rule_id}")

    def list_alert_channels(self) -> Dict[str, Any]:
        """List all alert channels."""
        return self._make_request("GET", "/v1/management/alerts/channels")

    def get_alert_channel(self, channel_id: str) -> Dict[str, Any]:
        """Get a specific alert channel."""
        return self._make_request("GET", f"/v1/management/alerts/channels/{channel_id}")

    def create_alert_channel(self, channel: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new alert channel."""
        return self._make_request("POST", "/v1/management/alerts/channels", data=channel)

    def update_alert_channel(self, channel_id: str, channel: Dict[str, Any]) -> Dict[str, Any]:
        """Update an alert channel."""
        return self._make_request("PUT", f"/v1/management/alerts/channels/{channel_id}", data=channel)

    def delete_alert_channel(self, channel_id: str) -> Dict[str, Any]:
        """Delete an alert channel."""
        return self._make_request("DELETE", f"/v1/management/alerts/channels/{channel_id}")

    def test_alert_channel(self, channel_id: str) -> Dict[str, Any]:
        """Send a test alert to a channel."""
        return self._make_request("POST", f"/v1/management/alerts/channels/{channel_id}/test")

    # ──────────────────────────────────────────────────────────────────────────
    # Analytics
    # ──────────────────────────────────────────────────────────────────────────

    def get_cost_analytics(
        self,
        time_range: TimeRange = "7d",
        provider: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get cost analytics broken down by provider and model."""
        params: Dict[str, Any] = {"time_range": time_range}
        if provider:
            params["provider"] = provider
        return self._make_request("GET", "/v1/analytics/costs", params=params)

    def get_cost_summary(self) -> Dict[str, Any]:
        """Get aggregated cost summary."""
        return self._make_request("GET", "/v1/analytics/costs/summary")

    def get_attack_vectors(self, time_range: TimeRange = "7d") -> Dict[str, Any]:
        """Get attack vector breakdown for the given time range."""
        return self._make_request("GET", "/v1/analytics/attack-vectors", params={"time_range": time_range})

    def get_top_endpoints(self, time_range: TimeRange = "7d", limit: int = 10) -> Dict[str, Any]:
        """Get top endpoints by request volume."""
        return self._make_request("GET", "/v1/analytics/top-endpoints", params={"time_range": time_range, "limit": limit})

    def get_provider_metrics(self, time_range: TimeRange = "7d") -> Dict[str, Any]:
        """Get per-provider performance metrics."""
        return self._make_request("GET", "/v1/analytics/provider-metrics", params={"time_range": time_range})

    def get_compliance_posture(self) -> Dict[str, Any]:
        """Get compliance posture report."""
        return self._make_request("GET", "/v1/analytics/compliance-posture")

    # ──────────────────────────────────────────────────────────────────────────
    # Teams
    # ──────────────────────────────────────────────────────────────────────────

    def list_teams(self) -> Dict[str, Any]:
        """List all teams."""
        return self._make_request("GET", "/v1/teams/")

    def get_team(self, team_id: str) -> Dict[str, Any]:
        """Get a team by ID."""
        return self._make_request("GET", f"/v1/teams/{team_id}")

    def create_team(self, name: str, **kwargs: Any) -> Dict[str, Any]:
        """Create a new team."""
        return self._make_request("POST", "/v1/teams/", data={"name": name, **kwargs})

    def update_team(self, team_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a team."""
        return self._make_request("PUT", f"/v1/teams/{team_id}", data=data)

    def delete_team(self, team_id: str) -> Dict[str, Any]:
        """Delete a team."""
        return self._make_request("DELETE", f"/v1/teams/{team_id}")

    def list_team_members(self, team_id: str) -> Dict[str, Any]:
        """List members of a team."""
        return self._make_request("GET", f"/v1/teams/{team_id}/members")

    def add_team_member(self, team_id: str, user_id: str, role: str = "member") -> Dict[str, Any]:
        """Add a member to a team."""
        return self._make_request("POST", f"/v1/teams/{team_id}/members", data={"user_id": user_id, "role": role})

    def remove_team_member(self, team_id: str, user_id: str) -> Dict[str, Any]:
        """Remove a member from a team."""
        return self._make_request("DELETE", f"/v1/teams/{team_id}/members/{user_id}")

    # ──────────────────────────────────────────────────────────────────────────
    # RBAC
    # ──────────────────────────────────────────────────────────────────────────

    def list_users(self) -> Dict[str, Any]:
        """List all users (admin only)."""
        return self._make_request("GET", "/v1/rbac/users")

    def get_user(self, user_id: str) -> Dict[str, Any]:
        """Get a user by ID."""
        return self._make_request("GET", f"/v1/rbac/users/{user_id}")

    def update_user(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a user."""
        return self._make_request("PUT", f"/v1/rbac/users/{user_id}", data=data)

    def delete_user(self, user_id: str) -> Dict[str, Any]:
        """Delete a user."""
        return self._make_request("DELETE", f"/v1/rbac/users/{user_id}")

    def list_roles(self) -> Dict[str, Any]:
        """List all roles."""
        return self._make_request("GET", "/v1/rbac/roles")

    def create_role(self, name: str, permissions: List[str]) -> Dict[str, Any]:
        """Create a new role."""
        return self._make_request("POST", "/v1/rbac/roles", data={"name": name, "permissions": permissions})

    def update_role(self, role_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a role."""
        return self._make_request("PUT", f"/v1/rbac/roles/{role_id}", data=data)

    def delete_role(self, role_id: str) -> Dict[str, Any]:
        """Delete a role."""
        return self._make_request("DELETE", f"/v1/rbac/roles/{role_id}")

    def list_permissions(self) -> Dict[str, Any]:
        """List all available permissions."""
        return self._make_request("GET", "/v1/rbac/permissions")

    # ──────────────────────────────────────────────────────────────────────────
    # Reports
    # ──────────────────────────────────────────────────────────────────────────

    def list_reports(self) -> Dict[str, Any]:
        """List all reports."""
        return self._make_request("GET", "/v1/reports")

    def get_report(self, report_id: str) -> Dict[str, Any]:
        """Get a specific report."""
        return self._make_request("GET", f"/v1/reports/{report_id}")

    def create_report(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new report."""
        return self._make_request("POST", "/v1/reports", data=data)

    def generate_report(self, report_id: str) -> Dict[str, Any]:
        """Trigger report generation."""
        return self._make_request("POST", f"/v1/reports/{report_id}/generate")

    def download_report(self, report_id: str) -> bytes:
        """Download a generated report as bytes."""
        url = f"{self.auth_config.base_url}/v1/reports/{report_id}/download"
        try:
            response = self.session.get(url, timeout=self.auth_config.timeout * 4)
            response.raise_for_status()
            return response.content
        except requests.exceptions.Timeout:
            raise TimeoutError("Request timed out")
        except requests.exceptions.ConnectionError:
            raise NetworkError("Network connection failed")

    def delete_report(self, report_id: str) -> Dict[str, Any]:
        """Delete a report."""
        return self._make_request("DELETE", f"/v1/reports/{report_id}")

    # ──────────────────────────────────────────────────────────────────────────
    # Billing
    # ──────────────────────────────────────────────────────────────────────────

    def get_billing_account(self) -> Dict[str, Any]:
        """Get billing account details and current plan."""
        return self._make_request("GET", "/v1/billing/account")

    def sync_billing(self) -> Dict[str, Any]:
        """Sync billing account state with payment provider."""
        return self._make_request("POST", "/v1/billing/sync")

    # ──────────────────────────────────────────────────────────────────────────
    # Tool sessions & review queue
    # ──────────────────────────────────────────────────────────────────────────

    def list_tool_sessions(self, limit: int = 50, status: Optional[str] = None) -> Dict[str, Any]:
        """List tool execution sessions."""
        params: Dict[str, Any] = {"limit": limit}
        if status:
            params["status"] = status
        return self._make_request("GET", "/v1/tools/sessions", params=params)

    def get_tool_session(self, session_id: str) -> Dict[str, Any]:
        """Get a specific tool session."""
        return self._make_request("GET", f"/v1/tools/sessions/{session_id}")

    def list_tool_reviews(self, limit: int = 50, status: Optional[str] = None) -> Dict[str, Any]:
        """List tool calls pending human review."""
        params: Dict[str, Any] = {"limit": limit}
        if status:
            params["status"] = status
        return self._make_request("GET", "/v1/tools/reviews", params=params)

    def decide_tool_review(self, review_id: str, decision: Literal["approved", "rejected"], note: Optional[str] = None) -> Dict[str, Any]:
        """Approve or reject a tool call in the review queue."""
        payload: Dict[str, Any] = {"decision": decision}
        if note:
            payload["note"] = note
        return self._make_request("POST", f"/v1/tools/reviews/{review_id}/decision", data=payload)

    # ──────────────────────────────────────────────────────────────────────────
    # Operational state
    # ──────────────────────────────────────────────────────────────────────────

    def get_operational_state(self) -> Dict[str, Any]:
        """Get current operational state (incidents, maintenance, breaches)."""
        return self._make_request("GET", "/v1/management/operations")

    def create_incident(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create an incident record."""
        return self._make_request("POST", "/v1/management/operations/incidents", data=data)

    def add_incident_update(self, incident_id: str, update: Dict[str, Any]) -> Dict[str, Any]:
        """Add an update to an existing incident."""
        return self._make_request("POST", f"/v1/management/operations/incidents/{incident_id}/updates", data=update)

    def schedule_maintenance(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Schedule a maintenance window."""
        return self._make_request("POST", "/v1/management/operations/maintenance", data=data)

    # ──────────────────────────────────────────────────────────────────────────
    # Internal HTTP helpers
    # ──────────────────────────────────────────────────────────────────────────

    def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Make an HTTP request to the API."""
        url = f"{self.auth_config.base_url}{endpoint}"
        try:
            response = self.session.request(
                method=method,
                url=url,
                json=data,
                params=params,
                timeout=self.auth_config.timeout,
            )
            return self._handle_response(response)
        except requests.exceptions.Timeout:
            raise TimeoutError("Request timed out")
        except requests.exceptions.ConnectionError:
            raise NetworkError("Network connection failed")
        except requests.exceptions.RequestException as exc:
            raise NetworkError(f"Request failed: {exc}") from exc

    def _handle_response(self, response: requests.Response) -> Dict[str, Any]:
        """Handle API response and raise appropriate exceptions."""
        try:
            data = response.json() if response.content else {}
        except ValueError:
            data = {"message": "Invalid JSON response"}

        # Treat any 2xx as success
        if response.status_code < 300:
            return data

        # Extract a human-readable message from FastAPI error shapes
        detail = data.get("detail")
        if isinstance(detail, list):
            message = "; ".join(
                f"{'.'.join(str(l) for l in e.get('loc', []))}: {e.get('msg', '')}"
                for e in detail
            )
        elif isinstance(detail, str):
            message = detail
        else:
            message = data.get("message", f"HTTP {response.status_code}")

        if response.status_code == 401:
            raise AuthenticationError(message, status_code=response.status_code, response_data=data)
        if response.status_code in (400, 422):
            raise ValidationError(message, status_code=response.status_code, response_data=data)
        if response.status_code == 429:
            raise RateLimitError(message, status_code=response.status_code, response_data=data)
        if response.status_code >= 500:
            raise ServerError(message, status_code=response.status_code, response_data=data)

        raise KoreShieldError(message, status_code=response.status_code, response_data=data)
