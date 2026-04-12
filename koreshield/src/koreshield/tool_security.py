"""Server-side tool-call security analysis for runtime enforcement."""

from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Optional

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

# ── Static threat patterns ────────────────────────────────────────────────────

# TOOL-003: File paths that expose sensitive system data.
# Any read_file / open / cat / cat tool call targeting these paths must be blocked.
_DANGEROUS_PATH_RE = re.compile(
    r"""
    # Unix sensitive system files
    /etc/(?:passwd|shadow|sudoers|crontab|cron\.d|ssh|ssl|nginx|apache2?|hosts(?:\.allow|\.deny)?|gshadow|master\.passwd)
    | /etc/                # any /etc/* file (overly permissive read)
    | /proc/(?:self|[0-9]+)/(?:mem|environ|cmdline|maps|fd)  # process memory/env
    | /root/               # root's home dir
    | /home/[^/]+/\.ssh/   # any user's SSH keys
    | /home/[^/]+/\.aws/   # any user's AWS credentials
    | /home/[^/]+/\.env    # user .env files
    # Common credential file names in privileged user locations. Workspace paths
    # are handled as runtime sequence signals instead of hard blocks.
    | (?:^|/)(?:\.aws/credentials|\.ssh/(?:id_rsa|id_ed25519|authorized_keys)|\.bash_history|\.zsh_history|\.netrc)
    # Windows equivalents
    | [Cc]:\\(?:Windows|System32|Users\\[^\\]+\\(?:\.ssh|AppData\\Roaming|NTUSER\.DAT))
    | \bSAM\b | \bNTDS\.dit\b | \bsecurity\.evtx\b
    # Docker / Kubernetes secrets
    | /var/run/secrets/kubernetes\.io
    | /run/secrets/
    # Path traversal — any ../ or ..\ sequence (cross-directory access)
    | \.\.(?:/|\\)
    # Cross-tenant file access patterns
    | /tenants?/[^/]+/
    | /customers?/[^/]+/(?:config|secrets?|keys?|credentials?)
    """,
    re.VERBOSE | re.IGNORECASE,
)

# TOOL-004: SQL DDL and destructive DML that should never be allowed through an LLM tool call.
_SQL_DDL_RE = re.compile(
    r"""
    \b(?:
        DROP\s+(?:TABLE|DATABASE|SCHEMA|VIEW|INDEX|TRIGGER|PROCEDURE|FUNCTION|USER)
      | TRUNCATE\s+(?:TABLE\s+)?
      | ALTER\s+(?:TABLE|DATABASE|SCHEMA|USER)
      | CREATE\s+(?:USER|LOGIN|ROLE|GRANT)\b  # privilege creation
      | (?:GRANT|REVOKE)\s+(?:ALL|SELECT|INSERT|UPDATE|DELETE|DROP|ALTER)
      | DELETE\s+FROM\s+\w+\s+(?:;|$)         # unconstrained DELETE (no WHERE)
      | ;[ \t]*DROP\b                           # classic SQL injection terminator
      | --\s*$                                  # SQL comment terminator (injection trail)
      | xp_cmdshell                             # MSSQL command execution
      | EXEC(?:UTE)?\s+(?:xp_|sp_)             # stored proc abuse
      | LOAD\s+DATA\s+(?:LOCAL\s+)?INFILE      # MySQL arbitrary file read
      | INTO\s+(?:OUTFILE|DUMPFILE)            # MySQL arbitrary file write
    )\b
    """,
    re.VERBOSE | re.IGNORECASE,
)

# TOOL-004: Also catch SSRF / metadata service patterns in network tool calls
_SSRF_RE = re.compile(
    r"""
    169\.254\.169\.254          # AWS/GCP/Azure instance metadata service
    | metadata\.google\.internal
    | fd00:ec2::254             # IPv6 IMDS
    | 100\.100\.100\.200        # Alibaba Cloud IMDS
    | (?:^|[/\s])localhost(?:[:/]|$)(?!.*(?:8000|3000|5000))  # localhost (but not common dev ports)
    | 127\.0\.0\.[0-9]+         # loopback
    | 0\.0\.0\.0                # unspecified (often SSRF gadget)
    | (?:file|gopher|dict|ldap|ftp)://  # dangerous URI schemes
    """,
    re.VERBOSE | re.IGNORECASE,
)


class ToolCallSecurityAnalyzer:
    """Analyze tool calls for runtime security enforcement."""

    def __init__(self, detector: AttackDetector):
        self.detector = detector

    # ── Static threat checkers ────────────────────────────────────────────────

    def _dangerous_path_check(self, tool_name: str, serialized_args: str) -> Optional[str]:
        """Return a description string if a dangerous system path is referenced, else None.

        Applies to tools with 'read', 'cat', 'open', 'file', 'list' in the name,
        as well as any tool whose args reference sensitive filesystem locations.
        """
        if _DANGEROUS_PATH_RE.search(serialized_args):
            return f"Tool '{tool_name}' references a sensitive system path in its arguments."
        return None

    def _sql_ddl_check(self, tool_name: str, serialized_args: str) -> Optional[str]:
        """Return a description string if destructive SQL/DDL is detected, else None."""
        # Only apply to database-capable tools
        lowered_name = tool_name.lower()
        is_db_tool = any(kw in lowered_name for kw in ("sql", "query", "db", "database", "postgres", "mysql", "sqlite"))
        if is_db_tool and _SQL_DDL_RE.search(serialized_args):
            return f"Tool '{tool_name}' contains destructive DDL or SQL injection patterns."
        # Also catch DDL in any tool if it looks like a raw SQL string
        if _SQL_DDL_RE.search(serialized_args) and "query" in serialized_args.lower():
            return f"Tool call contains destructive SQL patterns (DDL/injection)."
        return None

    def _ssrf_check(self, tool_name: str, serialized_args: str) -> Optional[str]:
        """Return a description string if SSRF / metadata endpoint access is detected."""
        lowered_name = tool_name.lower()
        is_network_tool = any(kw in lowered_name for kw in ("fetch", "http", "request", "web", "url", "get", "post", "search", "browse", "webhook", "send"))
        if is_network_tool and _SSRF_RE.search(serialized_args):
            return f"Tool '{tool_name}' targets an SSRF-prone or metadata-service endpoint."
        if _SSRF_RE.search(serialized_args):
            return f"Tool arguments contain SSRF indicators (metadata service or loopback URL)."
        return None

    # EXFIL patterns: external data exfiltration via webhook/network tool calls
    _EXFIL_RE = re.compile(
        r"""
        (?:data|secrets?|credentials?|keys?|tokens?|api[\s_-]?keys?|all[\s_-]?secrets?)
        \s*[=:,]?\s*
        (?:all[\s_-]?(?:tenant|customer|secret|credential|key)s?|include[\s_-]?api[\s_-]?keys?|secrets?|credentials?)
        """,
        re.VERBOSE | re.IGNORECASE,
    )

    # PRIV patterns: privileged admin function access attempts
    _PRIV_FUNC_RE = re.compile(
        r"""
        (?:function|tool|method|endpoint)\s*[=:,]?\s*
        (?:admin|root|sudo|superuser|privileged|system)[\s._-]
        |
        (?:list|get|dump|export|fetch)\s+all\s+(?:tenants?|users?|customers?|api[\s_-]?keys?|secrets?)
        """,
        re.VERBOSE | re.IGNORECASE,
    )

    def _exfil_check(self, tool_name: str, serialized_args: str) -> Optional[str]:
        """Detect data exfiltration patterns in network tool calls (e.g. sending secrets to external webhook)."""
        lowered_name = tool_name.lower()
        is_network_tool = any(kw in lowered_name for kw in (
            "webhook", "send", "post", "http", "fetch", "upload", "export", "transmit", "notify", "request"
        ))
        if is_network_tool and self._EXFIL_RE.search(serialized_args):
            return f"Tool '{tool_name}' appears to send sensitive data (secrets/credentials) to an external endpoint."
        return None

    def _priv_func_check(self, tool_name: str, serialized_args: str) -> Optional[str]:
        """Detect privileged admin function calls attempting unauthorized access."""
        combined = f"{tool_name} {serialized_args}".lower()
        # Admin function names in the tool_name itself
        if any(kw in tool_name.lower() for kw in ("admin", "root", "sudo", "superuser", "privileged")):
            if any(kw in combined for kw in ("tenant", "credential", "secret", "api_key", "all_user")):
                return f"Tool '{tool_name}' appears to request privileged admin access to sensitive resources."
        # Admin function references in args
        if self._PRIV_FUNC_RE.search(serialized_args):
            return f"Tool arguments contain references to privileged/admin function calls."
        return None

    # ── Main analysis ──────────────────────────────────────────────────────────

    def analyze(self, tool_name: str, args: Any, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Analyze a tool call using KoreShield-native detection and capability heuristics."""
        serialized_args = args if isinstance(args, str) else json.dumps(args or {}, sort_keys=True, default=str)
        combined_input = f"{tool_name} {serialized_args}".strip()
        detection_result = self.detector.detect(combined_input)
        capability_signals = self._capability_signals(tool_name, serialized_args)
        trust_context = self._normalize_context(context)
        provenance = self._provenance_analysis(tool_name, capability_signals, trust_context)
        sequence_matches = self._sequence_analysis(capability_signals, serialized_args, trust_context)

        # ── Static threat checks (override risk class unconditionally) ─────────
        static_block_reasons: List[str] = []

        path_threat = self._dangerous_path_check(tool_name, serialized_args)
        if path_threat:
            static_block_reasons.append(path_threat)

        ddl_threat = self._sql_ddl_check(tool_name, serialized_args)
        if ddl_threat:
            static_block_reasons.append(ddl_threat)

        ssrf_threat = self._ssrf_check(tool_name, serialized_args)
        if ssrf_threat:
            static_block_reasons.append(ssrf_threat)

        exfil_threat = self._exfil_check(tool_name, serialized_args)
        if exfil_threat:
            static_block_reasons.append(exfil_threat)

        priv_threat = self._priv_func_check(tool_name, serialized_args)
        if priv_threat:
            static_block_reasons.append(priv_threat)

        # If any static threat fires → always critical / block
        if static_block_reasons:
            risk_class = "critical"
        else:
            risk_class = self._risk_class(
                capability_signals,
                detection_result,
                provenance["risk_class"],
                sequence_matches,
            )

        review_required = risk_class in {"high", "critical"}
        reasons: List[str] = list(static_block_reasons)

        if capability_signals:
            reasons.append("Capability signals: " + ", ".join(capability_signals))
        if detection_result.get("is_attack"):
            reasons.append("Tool arguments contain prompt-injection or exfiltration indicators.")
        if provenance["confused_deputy_risk"]:
            reasons.append("Tool call shows confused-deputy or delegated authority risk.")
        if provenance["escalation_signals"]:
            reasons.extend(provenance["escalation_signals"])
        if sequence_matches:
            reasons.append(
                "Suspicious tool sequence detected: "
                + ", ".join(match["name"] for match in sequence_matches)
            )
        if risk_class == "critical":
            reasons.append("Critical-risk tool call combines sensitive capabilities with high-confidence attack signals.")

        suggested_action = "block" if risk_class == "critical" else "warn" if review_required else "allow"

        return {
            "tool_name": tool_name,
            "args": args,
            "serialized_args": serialized_args,
            "risky_tool": bool(capability_signals) or bool(static_block_reasons),
            "risk_class": risk_class,
            "provenance_risk": provenance["risk_class"],
            "capability_signals": capability_signals,
            "static_threats": static_block_reasons,
            "review_required": review_required,
            "suggested_action": suggested_action,
            "confidence": detection_result.get("confidence", 0.0),
            "indicators": detection_result.get("indicators", []),
            "confused_deputy_risk": provenance["confused_deputy_risk"],
            "escalation_signals": provenance["escalation_signals"],
            "sequence_matches": sequence_matches,
            "trust_context": trust_context,
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

    def _risk_class(
        self,
        capability_signals: List[str],
        detection_result: Dict[str, Any],
        provenance_risk: str,
        sequence_matches: List[Dict[str, str]],
    ) -> str:
        attack = bool(detection_result.get("is_attack"))
        confidence = float(detection_result.get("confidence", 0.0) or 0.0)
        base_risk = "low"

        if attack and any(signal in capability_signals for signal in ("execution", "network", "credential_access", "database")):
            # Database + attack = critical (catches TOOL-004 SQL injection / DDL)
            base_risk = "critical"
        elif attack or any(signal in capability_signals for signal in ("execution", "credential_access")):
            base_risk = "high"
        elif capability_signals or confidence >= 0.35:
            base_risk = "medium"

        max_risk = provenance_risk if RISK_RANK.get(provenance_risk, 0) > RISK_RANK.get(base_risk, 0) else base_risk
        for match in sequence_matches:
            severity = str(match.get("severity", "low")).lower()
            if RISK_RANK.get(severity, 0) > RISK_RANK.get(max_risk, 0):
                max_risk = severity
        if attack and provenance_risk == "high" and max_risk != "critical":
            return "critical"
        return max_risk

    def _normalize_context(self, context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        data = context or {}
        prior_tools = data.get("prior_tools", data.get("priorTools"))
        if not isinstance(prior_tools, list):
            prior_tools = []
        prior_tool_events = data.get("prior_tool_events", data.get("priorToolEvents"))
        if not isinstance(prior_tool_events, list):
            prior_tool_events = []
        return {
            "source": str(data.get("source") or "unknown"),
            "trust_level": str(data.get("trust_level", data.get("trustLevel")) or "unknown"),
            "user_approved": data.get("user_approved", data.get("userApproved")),
            "cross_tenant": bool(data.get("cross_tenant", data.get("crossTenant", False))),
            "chain_depth": int(data.get("chain_depth", data.get("chainDepth", 1)) or 1),
            "prior_tools": [str(tool) for tool in prior_tools if tool],
            "prior_tool_events": [event for event in prior_tool_events if isinstance(event, dict)],
        }

    def _provenance_analysis(
        self,
        tool_name: str,
        capability_signals: List[str],
        trust_context: Dict[str, Any],
    ) -> Dict[str, Any]:
        sensitive = {"execution", "network", "write", "database", "credential_access"}
        high_impact = sensitive | {"read"}
        risk_class = "low"
        escalation_signals: List[str] = []
        confused_deputy_risk = False

        def raise_risk(candidate: str) -> None:
            nonlocal risk_class
            if RISK_RANK.get(candidate, 0) > RISK_RANK.get(risk_class, 0):
                risk_class = candidate

        source = trust_context["source"].lower()
        trust_level = trust_context["trust_level"].lower()
        user_approved = trust_context["user_approved"]
        chain_depth = trust_context["chain_depth"]
        prior_tools = trust_context["prior_tools"]

        if capability_signals and source in {"retrieved_document", "tool_output", "agent_memory", "external"}:
            raise_risk("medium")
            escalation_signals.append(f"Tool request originated from {source.replace('_', ' ')} context.")

        if any(signal in sensitive for signal in capability_signals) and trust_level in {"external", "untrusted"}:
            raise_risk("high")
            confused_deputy_risk = True
            escalation_signals.append("Sensitive capability requested from low-trust or untrusted context.")

        if any(signal in high_impact for signal in capability_signals) and user_approved is False:
            raise_risk("high")
            confused_deputy_risk = True
            escalation_signals.append("High-impact tool call is missing explicit user approval.")

        if trust_context["cross_tenant"] and any(signal in high_impact for signal in capability_signals):
            raise_risk("critical")
            confused_deputy_risk = True
            escalation_signals.append("Cross-tenant tool access attempt detected.")

        if chain_depth >= 3 and any(signal in sensitive for signal in capability_signals):
            raise_risk("medium")
            escalation_signals.append(f"Delegation chain depth {chain_depth} increases runtime trust uncertainty.")

        prior_caps = {
            capability
            for prior_tool in prior_tools
            for capability in self._capability_signals(prior_tool, "")
        }
        if prior_caps.intersection({"read", "database", "credential_access"}) and any(
            signal in capability_signals for signal in {"network", "write", "execution"}
        ):
            raise_risk("high")
            confused_deputy_risk = True
            escalation_signals.append("Cross-tool escalation detected from data access into exfiltration or mutation capabilities.")

        if tool_name.lower() in {tool.lower() for tool in prior_tools} and any(
            signal in capability_signals for signal in {"execution", "network"}
        ):
            raise_risk("medium")
            escalation_signals.append("Repeated sensitive tool delegation detected in the same chain.")

        return {
            "risk_class": risk_class,
            "confused_deputy_risk": confused_deputy_risk,
            "escalation_signals": escalation_signals,
        }

    def _sequence_analysis(
        self,
        capability_signals: List[str],
        serialized_args: str,
        trust_context: Dict[str, Any],
    ) -> List[Dict[str, str]]:
        prior_events = trust_context.get("prior_tool_events", [])
        if not prior_events:
            return []

        matches: List[Dict[str, str]] = []
        lowered_args = serialized_args.lower()
        sensitive_path = re.compile(r"\.env|credential|secret|password|token|key|ssh", re.IGNORECASE)
        config_path = re.compile(r"config|settings|\.env|system", re.IGNORECASE)
        delete_terms = re.compile(r"\b(delete|remove|rm|unlink|drop|truncate)\b", re.IGNORECASE)
        privilege_terms = re.compile(r"\b(chmod|chown|permission|role|grant|sudo)\b", re.IGNORECASE)
        database_dump_terms = re.compile(r"select\s+\*|dump|export|all", re.IGNORECASE)

        def has_prior(predicate) -> bool:
            return any(predicate(event) for event in prior_events)

        if any(signal in capability_signals for signal in {"network", "write", "execution"}) and has_prior(
            lambda event: (
                {"read", "credential_access"}.intersection(event.get("capability_signals", []))
                and sensitive_path.search(str(event.get("args", ""))) is not None
            )
        ):
            matches.append(
                {
                    "name": "credential_exfiltration",
                    "severity": "critical",
                    "description": "Sensitive reads followed by externalization-capable tool usage.",
                }
            )

        if delete_terms.search(lowered_args) and has_prior(
            lambda event: {"read"}.intersection(event.get("capability_signals", []))
        ):
            matches.append(
                {
                    "name": "reconnaissance_then_delete",
                    "severity": "critical",
                    "description": "Reconnaissance-style access followed by destructive mutation.",
                }
            )

        if "write" in capability_signals and config_path.search(lowered_args) and has_prior(
            lambda event: (
                {"read"}.intersection(event.get("capability_signals", []))
                and config_path.search(str(event.get("args", ""))) is not None
            )
        ):
            matches.append(
                {
                    "name": "read_then_write_config",
                    "severity": "high",
                    "description": "Configuration was read before being modified in the same session.",
                }
            )

        if any(signal in capability_signals for signal in {"network", "write"}) and has_prior(
            lambda event: (
                {"database"}.intersection(event.get("capability_signals", []))
                and database_dump_terms.search(str(event.get("args", ""))) is not None
            )
        ):
            matches.append(
                {
                    "name": "database_dump",
                    "severity": "critical",
                    "description": "Bulk database access was followed by exfiltration-capable behavior.",
                }
            )

        if "execution" in capability_signals and has_prior(
            lambda event: privilege_terms.search(str(event.get("args", ""))) is not None
        ):
            matches.append(
                {
                    "name": "privilege_escalation",
                    "severity": "critical",
                    "description": "Permission changes were followed by command execution.",
                }
            )

        return matches
