"""Local preflight security helpers for embedded KoreShield SDK usage."""

from __future__ import annotations

import base64
import html
import json
import re
import unicodedata
from urllib.parse import unquote

from .types import (
    DetectionIndicator,
    DetectionType,
    LocalPreflightResult,
    NormalizationResult,
    RAGDocument,
    RAGPreflightDocumentResult,
    RAGPreflightResult,
    ThreatLevel,
    ToolCapability,
    ToolCallPreflightResult,
    ToolRiskClass,
)

INVISIBLE_RE = re.compile(r"[\u200B\u200C\u200D\uFEFF\u00AD\u034F\u061C\u2060\u2061\u2062\u2063\u2064]")
WHITESPACE_RE = re.compile(r"\s+")
MARKDOWN_LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
MARKDOWN_HEADER_RE = re.compile(r"^\s{0,3}#{1,6}\s+", re.MULTILINE)
BASE64_RE = re.compile(r"^[A-Za-z0-9+/=\s]+$")
HOMOGLYPHS = str.maketrans(
    {
        "\u0430": "a",
        "\u0435": "e",
        "\u043E": "o",
        "\u0440": "p",
        "\u0441": "c",
        "\u0445": "x",
        "\u0456": "i",
        "\u03BF": "o",
        "\u03B1": "a",
        "\u03B5": "e",
        "\u03C1": "p",
        "\u03C7": "x",
    }
)
LEET = str.maketrans(
    {
        "0": "o",
        "1": "i",
        "3": "e",
        "4": "a",
        "5": "s",
        "7": "t",
        "@": "a",
        "$": "s",
    }
)
RISKY_TOOLS = ("bash", "shell", "terminal", "exec", "fetch", "http_request", "sql", "database", "write_file", "delete_file")
WEIGHTED_PATTERNS = (
    ("instruction_override", ThreatLevel.HIGH, 0.35, re.compile(r"ignore\s+(?:all\s+)?(?:previous|prior|above|earlier)\s+(?:instructions|rules|prompts|guidelines|context)", re.IGNORECASE), "Attempts to override prior instructions."),
    ("system_prompt_spoof", ThreatLevel.HIGH, 0.30, re.compile(r"\[\s*(?:system|admin|developer|override)\s*:?.*?\]", re.IGNORECASE), "Spoofed system or admin directive."),
    ("developer_mode", ThreatLevel.HIGH, 0.30, re.compile(r"\b(?:developer|debug|dan|god)\s+mode\b", re.IGNORECASE), "References jailbreak or developer mode phrasing."),
    ("prompt_leakage", ThreatLevel.HIGH, 0.40, re.compile(r"(?:reveal|show|display|leak)\s+(?:your\s+)?(?:system\s+prompt|instructions?|hidden\s+prompt)", re.IGNORECASE), "Attempts to extract hidden model instructions."),
    ("data_exfiltration", ThreatLevel.HIGH, 0.35, re.compile(r"(?:send|upload|transmit|export)\s+(?:all\s+|the\s+)?(?:data|credentials|passwords|secrets?)", re.IGNORECASE), "Attempts to exfiltrate sensitive data."),
)


def normalize_text(value: str) -> NormalizationResult:
    """Normalize input so local preflight scans are resilient to obfuscation."""
    normalized = value
    layers: list[str] = []

    unicode_normalized = unicodedata.normalize("NFKC", normalized)
    if unicode_normalized != normalized:
        normalized = unicode_normalized
        layers.append("unicode_nfkc")

    html_decoded = html.unescape(normalized)
    if html_decoded != normalized:
        normalized = html_decoded
        layers.append("html_entities")

    try:
        url_decoded = unquote(normalized)
    except Exception:
        url_decoded = normalized
    if url_decoded != normalized:
        normalized = url_decoded
        layers.append("url_decode")

    stripped = INVISIBLE_RE.sub("", normalized)
    if stripped != normalized:
        normalized = stripped
        layers.append("invisible_strip")

    homoglyph_normalized = normalized.translate(HOMOGLYPHS)
    if homoglyph_normalized != normalized:
        normalized = homoglyph_normalized
        layers.append("homoglyph_map")

    compact = normalized.strip()
    if len(compact) >= 24 and len(compact) % 4 == 0 and BASE64_RE.fullmatch(compact):
        try:
            decoded = base64.b64decode(compact, validate=True).decode("utf-8")
            normalized = decoded
            layers.append("base64_decode")
        except Exception:
            pass

    leet_normalized = normalized.translate(LEET)
    if leet_normalized != normalized:
        normalized = leet_normalized
        layers.append("leet_map")

    markdown_stripped = MARKDOWN_LINK_RE.sub(r"\1", normalized)
    markdown_stripped = markdown_stripped.replace("```", " ").replace("`", " ")
    markdown_stripped = MARKDOWN_HEADER_RE.sub("", markdown_stripped)
    if markdown_stripped != normalized:
        normalized = markdown_stripped
        layers.append("markdown_strip")

    collapsed = WHITESPACE_RE.sub(" ", normalized).strip()
    if collapsed != normalized:
        normalized = collapsed
        layers.append("whitespace_collapse")

    return NormalizationResult(original=value, normalized=normalized, layers=layers)


def _severity_weight(level: ThreatLevel) -> int:
    weights = {
        ThreatLevel.SAFE: 0,
        ThreatLevel.LOW: 1,
        ThreatLevel.MEDIUM: 2,
        ThreatLevel.HIGH: 3,
        ThreatLevel.CRITICAL: 4,
    }
    return weights[level]


def _max_severity(indicators: list[DetectionIndicator]) -> ThreatLevel:
    if not indicators:
        return ThreatLevel.SAFE
    return max(indicators, key=lambda indicator: _severity_weight(indicator.severity)).severity


def _tool_capabilities(tool_name: str, serialized_args: str) -> list[ToolCapability]:
    lowered = f"{tool_name} {serialized_args}".lower()
    capabilities: list[ToolCapability] = []
    patterns = (
        (ToolCapability.EXECUTION, ("bash", "shell", "terminal", "exec", "run", "command")),
        (ToolCapability.NETWORK, ("fetch", "http", "request", "webhook", "url", "download", "upload")),
        (ToolCapability.DATABASE, ("sql", "database", "query", "postgres", "mysql")),
        (ToolCapability.WRITE, ("write", "delete", "update", "modify", "save")),
        (ToolCapability.READ, ("read", "cat", "open", "list", "search")),
        (ToolCapability.CREDENTIAL_ACCESS, ("secret", "token", "password", "credential", "ssh", "key")),
    )
    for capability, keywords in patterns:
        if any(keyword in lowered for keyword in keywords):
            capabilities.append(capability)
    return capabilities


def _risk_class(capabilities: list[ToolCapability], prompt_result: LocalPreflightResult) -> ToolRiskClass:
    if (
        prompt_result.threat_level in {ThreatLevel.HIGH, ThreatLevel.CRITICAL}
        and any(capability in capabilities for capability in (ToolCapability.EXECUTION, ToolCapability.NETWORK, ToolCapability.CREDENTIAL_ACCESS))
    ):
        return ToolRiskClass.CRITICAL
    if prompt_result.threat_level in {ThreatLevel.HIGH, ThreatLevel.CRITICAL} or any(
        capability in capabilities for capability in (ToolCapability.EXECUTION, ToolCapability.CREDENTIAL_ACCESS)
    ):
        return ToolRiskClass.HIGH
    if capabilities:
        return ToolRiskClass.MEDIUM
    return ToolRiskClass.LOW


def preflight_scan_prompt(prompt: str) -> LocalPreflightResult:
    """Scan a prompt locally before sending it to KoreShield."""
    normalization = normalize_text(prompt)
    indicators: list[DetectionIndicator] = []
    confidence = 0.0

    for category, severity, score, pattern, description in WEIGHTED_PATTERNS:
        if pattern.search(normalization.normalized):
            indicators.append(
                DetectionIndicator(
                    type=DetectionType.PATTERN,
                    severity=severity,
                    confidence=score,
                    description=description,
                    metadata={"category": category},
                )
            )
            confidence += score

    if "```" in prompt and re.search(r"(system|instruction)", normalization.normalized, re.IGNORECASE):
        indicators.append(
            DetectionIndicator(
                type=DetectionType.PATTERN,
                severity=ThreatLevel.HIGH,
                confidence=0.3,
                description="Instruction-like content embedded in a code block.",
                metadata={"category": "code_block_injection"},
            )
        )
        confidence += 0.3

    if re.search(r"(?:you are|act as|pretend to be)", normalization.normalized, re.IGNORECASE):
        indicators.append(
            DetectionIndicator(
                type=DetectionType.KEYWORD,
                severity=ThreatLevel.MEDIUM,
                confidence=0.25,
                description="Role manipulation phrasing detected.",
                metadata={"category": "role_hijack"},
            )
        )
        confidence += 0.25

    if "base64_decode" in normalization.layers:
        indicators.append(
            DetectionIndicator(
                type=DetectionType.PATTERN,
                severity=ThreatLevel.HIGH,
                confidence=0.4,
                description="Encoded content required normalization before analysis.",
                metadata={"category": "encoding_attempt"},
            )
        )
        confidence += 0.4

    threat_level = _max_severity(indicators)
    suggested_action = (
        "block" if threat_level in {ThreatLevel.HIGH, ThreatLevel.CRITICAL}
        else "warn" if indicators
        else "allow"
    )

    return LocalPreflightResult(
        blocked=suggested_action == "block",
        is_safe=not indicators,
        threat_level=threat_level,
        confidence=min(confidence, 1.0),
        normalization=normalization,
        indicators=indicators,
        suggested_action=suggested_action,
    )


def preflight_scan_tool_call(tool_name: str, args: object) -> ToolCallPreflightResult:
    """Locally scan a tool call before execution."""
    serialized = args if isinstance(args, str) else json.dumps(args or {}, sort_keys=True)
    prompt_result = preflight_scan_prompt(f"{tool_name} {serialized}")
    risky_tool = any(candidate in tool_name.lower() for candidate in RISKY_TOOLS)
    capabilities = _tool_capabilities(tool_name, serialized)
    risk_class = _risk_class(capabilities, prompt_result)
    reasons: list[str] = []
    if risky_tool:
        reasons.append(f'Tool "{tool_name}" is in the higher-risk execution class.')
    if not prompt_result.is_safe:
        reasons.append("Tool arguments contain prompt-injection or exfiltration signals.")
    if capabilities:
        reasons.append(
            "Capability signals: " + ", ".join(capability.value for capability in capabilities)
        )

    return ToolCallPreflightResult(
        **prompt_result.model_dump(),
        tool_name=tool_name,
        risky_tool=risky_tool,
        reasons=reasons,
        risk_class=risk_class,
        capability_signals=capabilities,
        review_required=risk_class in {ToolRiskClass.HIGH, ToolRiskClass.CRITICAL},
    )


def _tokenize(text: str) -> set[str]:
    return {
        token
        for token in re.findall(r"\b[a-z0-9]{3,}\b", text.lower())
        if token not in {"the", "and", "for", "with", "this", "that", "from"}
    }


def _query_similarity(user_query: str, content: str) -> float:
    query_tokens = _tokenize(user_query)
    content_tokens = _tokenize(content[:3000])
    if not query_tokens or not content_tokens:
        return 0.0
    intersection = len(query_tokens & content_tokens)
    union = len(query_tokens | content_tokens)
    return intersection / union if union else 0.0


def _directive_score(content: str) -> float:
    lowered = content.lower()
    phrases = {
        "ignore all previous instructions": 0.35,
        "ignore previous instructions": 0.30,
        "override": 0.18,
        "bypass": 0.18,
        "reveal": 0.18,
        "leak": 0.18,
        "from now on": 0.2,
        "you must": 0.18,
        "you are now": 0.18,
        "system:": 0.16,
        "[system": 0.18,
        "execute": 0.14,
        "ignore": 0.08,
    }
    score = sum(weight for phrase, weight in phrases.items() if phrase in lowered)
    token_count = max(len(re.findall(r"\b\w+\b", lowered)), 1)
    return min(score / max(token_count / 30, 1), 1.0)


def preflight_scan_rag_context(user_query: str, documents: list[RAGDocument]) -> RAGPreflightResult:
    """Locally scan retrieved documents before they enter a RAG pipeline."""
    document_results: list[RAGPreflightDocumentResult] = []

    for document in documents:
        prompt_result = preflight_scan_prompt(document.content)
        similarity = _query_similarity(user_query, prompt_result.normalization.normalized)
        directive = _directive_score(prompt_result.normalization.normalized)
        mismatch_boost = similarity <= 0.15 and directive >= 0.12

        indicators = list(prompt_result.indicators)
        boosted_confidence = min(prompt_result.confidence + (0.15 if directive >= 0.18 else 0.0) + (0.2 if mismatch_boost else 0.0), 1.0)

        if directive >= 0.18:
            indicators.append(
                DetectionIndicator(
                    type=DetectionType.PATTERN,
                    severity=ThreatLevel.MEDIUM,
                    confidence=0.15,
                    description="High directive density detected in retrieved content.",
                    metadata={"category": "directive_density"},
                )
            )

        if mismatch_boost:
            indicators.append(
                DetectionIndicator(
                    type=DetectionType.PATTERN,
                    severity=ThreatLevel.HIGH,
                    confidence=0.2,
                    description="Directive-heavy content appears unrelated to the user query.",
                    metadata={"category": "query_mismatch_directive"},
                )
            )

        threat_level = _max_severity(indicators)
        suggested_action = (
            "block" if threat_level in {ThreatLevel.HIGH, ThreatLevel.CRITICAL}
            else "warn" if indicators
            else "allow"
        )

        document_results.append(
            RAGPreflightDocumentResult(
                blocked=suggested_action == "block",
                is_safe=not indicators,
                threat_level=threat_level,
                confidence=boosted_confidence,
                normalization=prompt_result.normalization,
                indicators=indicators,
                suggested_action=suggested_action,
                document_id=document.id,
                query_similarity=similarity,
                directive_score=directive,
                metadata=document.metadata or {},
            )
        )

    blocked = any(result.blocked for result in document_results)
    unsafe = [result for result in document_results if not result.is_safe]
    overall_threat = max((result.threat_level for result in document_results), key=_severity_weight, default=ThreatLevel.SAFE)

    return RAGPreflightResult(
        blocked=blocked,
        is_safe=not unsafe,
        threat_level=overall_threat,
        confidence=max((result.confidence for result in document_results), default=0.0),
        user_query=user_query,
        documents=document_results,
        suggested_action="block" if blocked else "warn" if unsafe else "allow",
    )
