# Agent Shield Integration Strategy

This document tracks how we are integrating the strongest ideas from `to-be-considered/` into KoreShield over time.

## Goal

Evolve KoreShield from:

- LLM proxy and RAG security platform

toward:

- broader AI security platform covering gateway, context, and runtime security

We are not merging `to-be-considered/` wholesale. We are extracting the highest-value capabilities and rebuilding them as KoreShield-native features.

## Principles

- KoreShield remains the product and naming surface.
- We extract capability, not repo sprawl.
- We prioritize core security quality before ecosystem tooling.
- Every adopted feature must land in a clear repo and product home.

## Phase 1: Detection Hardening

### Scope

- normalization and obfuscation handling
- expanded high-signal injection coverage
- stronger preprocessing before detector and sanitizer checks

### Checklist

- [x] Design a KoreShield-native normalization pipeline
- [x] Add Unicode, homoglyph, invisible-character, encoding, and markdown-aware preprocessing
- [x] Run detector and sanitizer checks against normalized text as well as raw text
- [x] Port a first set of high-signal instruction override, developer mode, prompt leakage, and exfiltration patterns
- [x] Add regression tests for obfuscated prompt injection
- [x] Add benchmark fixtures for evasive prompt injection cases
- [x] Add false-positive benchmark fixtures
- [x] Define detector performance budgets for future hardening work

### Landed In

- [detector.py](/Users/nsisong/projects/koreshield/koreshield/src/koreshield/detector.py)
- [sanitizer.py](/Users/nsisong/projects/koreshield/koreshield/src/koreshield/sanitizer.py)
- [normalization.py](/Users/nsisong/projects/koreshield/koreshield/src/koreshield/normalization.py)

### Detector Performance Budgets

For current hardening work, the backend detector now carries explicit guardrails for future regressions:

- `target_p50_ms`: 8 ms
- `target_p95_ms`: 20 ms
- `max_prompt_chars`: 20,000
- `max_normalized_expansion_ratio`: 1.5x

These are not hard request limits yet. They are engineering budgets surfaced in detector output so future optimization work can measure drift before it becomes user-visible latency.

## Phase 2: RAG and External Context Security

### Scope

- indirect prompt injection improvements
- query-aware document scoring
- richer document-level rationale for why content was flagged

### Checklist

- [x] Add query/document similarity scoring to RAG detection
- [x] Add directive-density scoring for suspicious retrieved content
- [x] Boost risk when instruction-heavy retrieved content is unrelated to the user query
- [x] Include richer document threat metadata for downstream UI and SDK use
- [x] Add regression tests for query-mismatch directives and obfuscated RAG content
- [x] Build benchmark datasets for chunk poisoning and metadata injection
- [x] Update Python and JS SDKs if the RAG result model expands further
- [x] Document indirect prompt injection detection behavior and limits

### Landed In

- [rag_detector.py](/Users/nsisong/projects/koreshield/koreshield/src/koreshield/rag_detector.py)
- [test_rag_detector.py](/Users/nsisong/projects/koreshield/koreshield/tests/test_rag_detector.py)

### Indirect Prompt Injection Behavior and Limits

KoreShield now treats retrieved content as suspicious when it combines instruction-heavy phrasing with weak relevance to the user query. That means directive density alone is not enough to block content; the detector is intentionally query-aware so it can distinguish between operational text that is genuinely relevant and instructions that appear to be injected into unrelated material.

Current limits:

- Similarity scoring is lexical and heuristic, not semantic-model based.
- Directive density is phrase-driven and can miss novel attack wording.
- Metadata injection coverage is benchmarked, but the API and UI do not yet expose every intermediate scoring field.
- The local SDK preflight layer is designed for early warning and policy gating, not as a substitute for server-side enforcement.

## Next Priorities

### Immediate

- [x] Create benchmark fixtures inspired by `to-be-considered/datasets`
- [x] Define the merge map for remaining high-value modules
- [x] Decide how much of the richer RAG metadata should surface in the API/UI now

### After Phase 1 and 2 Stabilize

- [x] Add embedded SDK preflight scanning helpers
- [x] Design KoreShield tool-call security model
- [x] Decide whether MCP security becomes a first-class KoreShield product area

## Phase 3: Embedded and Runtime Security

### Scope

- local SDK-side preflight enforcement
- tool-call risk modeling before execution
- product boundary decisions for future MCP/runtime work

### Checklist

- [x] Add embedded SDK preflight scanning helpers
- [x] Design KoreShield tool-call security model
- [x] Decide whether MCP security becomes a first-class KoreShield product area

### Tool-Call Security Model

KoreShield now treats tool calls as a distinct preflight decision surface rather than just another prompt string. The embedded SDK model classifies tools by capability and produces a review recommendation before execution.

Current capability buckets:

- `execution`
- `network`
- `database`
- `write`
- `read`
- `credential_access`

Current risk classes:

- `low`: ordinary read-style actions with no strong attack signals
- `medium`: operational tools with some side effects but no strong injection indicators
- `high`: execution or credential-sensitive tools, or tool calls with strong prompt-injection signals
- `critical`: high-risk tools combined with strong prompt-injection or exfiltration indicators

The SDK contract now surfaces:

- capability signals
- risk class
- review-required flag
- recommended block/warn/allow action

This is the Phase 3 baseline model. Server-side enforcement, policy authoring, and audit history for tool calls come next.

### Merge Map

What gets integrated from `to-be-considered/` over time:

- detector normalization and evasive-pattern ideas: [detector.py](/Users/nsisong/projects/koreshield/koreshield/src/koreshield/detector.py), [normalization.py](/Users/nsisong/projects/koreshield/koreshield/src/koreshield/normalization.py)
- RAG and indirect prompt injection scoring: [rag_detector.py](/Users/nsisong/projects/koreshield/koreshield/src/koreshield/rag_detector.py)
- embedded preflight protections for app-side usage: [koreshield-js-sdk/src/local/security.ts](/Users/nsisong/projects/koreshield/koreshield-js-sdk/src/local/security.ts), [koreshield-python-sdk/src/koreshield_sdk/local_security.py](/Users/nsisong/projects/koreshield/koreshield-python-sdk/src/koreshield_sdk/local_security.py)
- benchmark and dataset ideas: [koreshield/tests/fixtures/evasive_prompt_benchmark.json](/Users/nsisong/projects/koreshield/koreshield/tests/fixtures/evasive_prompt_benchmark.json), [koreshield/tests/fixtures/rag_poisoning_benchmark.json](/Users/nsisong/projects/koreshield/koreshield/tests/fixtures/rag_poisoning_benchmark.json)

What does not get integrated wholesale right now:

- standalone GitHub App
- operator/sidecar runtime platform
- Terraform/provider sprawl
- parallel product branding or separate control plane

### RAG Metadata Surface Decision

The current product decision is:

- expose document-level query similarity, directive score, normalization layers, and query-mismatch/directive-density flags in API responses
- expose aggregate counts and score summaries in `context_analysis.statistics` for UI use
- keep heavier internal signals and raw matching internals out of the primary UI for now

This keeps the API and SDKs rich enough for dashboards and customer-side handling without overcommitting the frontend to every internal scoring detail.

### MCP and Runtime Security Decision

Decision for now: MCP/runtime security is an explicit KoreShield expansion area, but not yet a first-class standalone product line.

That means:

- we continue integrating MCP-inspired ideas into KoreShield-native policy, SDK, and proxy surfaces
- we do not split branding, repos, or platform ownership around MCP yet
- runtime enforcement becomes Phase 4+ work once proxy, RAG, and embedded controls are stable

## Phase 4: Runtime Enforcement and Auditability

### Scope

- server-side tool-call scanning before execution
- policy-backed runtime decisions for risky tools
- audit/event/log support for tool-call decisions
- SDK access to the server-side runtime scan surface
- Docker-confirmed local deployment path for the new route

### Checklist

- [x] Add a KoreShield-native tool-call scan endpoint in the backend proxy
- [x] Reuse the existing policy engine for tool-call review and block decisions
- [x] Emit audit-friendly events and request logs for tool-call decisions
- [x] Expose server-side tool-call scanning through the JS SDK
- [x] Expose server-side tool-call scanning through the Python SDK
- [x] Add backend and SDK regression coverage for the new runtime path
- [x] Confirm Docker Compose configuration for the new runtime path
- [ ] Confirm Docker image build execution with a live local Docker daemon
- [x] Record the decision gates for Phase 4 rollout

### Landed In

- [tool_security.py](/Users/nsisong/projects/koreshield/koreshield/src/koreshield/tool_security.py)
- [policy.py](/Users/nsisong/projects/koreshield/koreshield/src/koreshield/policy.py)
- [proxy.py](/Users/nsisong/projects/koreshield/koreshield/src/koreshield/proxy.py)
- [koreshield-js-sdk/src/core/client.ts](/Users/nsisong/projects/koreshield/koreshield-js-sdk/src/core/client.ts)
- [koreshield-python-sdk/src/koreshield_sdk/client.py](/Users/nsisong/projects/koreshield/koreshield-python-sdk/src/koreshield_sdk/client.py)
- [koreshield-python-sdk/src/koreshield_sdk/async_client.py](/Users/nsisong/projects/koreshield/koreshield-python-sdk/src/koreshield_sdk/async_client.py)

### Phase 4 Decision Gates

#### Gate 1: Product Boundary

Decision: pass.

Tool-call runtime security lands as a KoreShield-native backend capability under `/v1/tools/scan`. We are not introducing a parallel Agent Shield product surface, separate service, or separate policy plane.

#### Gate 2: Policy Reuse

Decision: pass.

Runtime tool-call decisions reuse the existing policy engine instead of forking a second authorization system. New tool-call actions map onto the same allow, review, and block semantics already used elsewhere in KoreShield.

#### Gate 3: Auditability

Decision: pass.

Tool-call decisions now emit request logs and policy-aware events so blocked or review-required decisions can be surfaced in analytics, alerts, and future UI work without redesigning the backend event model.

#### Gate 4: SDK Contract

Decision: pass.

The runtime scan surface is exposed through the JS and Python SDKs so embedded usage can progressively move from local preflight-only behavior toward server-backed enforcement.

#### Gate 5: Docker Delivery Path

Decision: pending local daemon availability.

The existing Docker Compose path remains the delivery model for local backend verification. Compose configuration validates successfully for both the backend stack and the root development stack. The final image build command is still environment-blocked on this machine because the Docker daemon did not expose `~/.docker/run/docker.sock` during verification, even after launching Docker Desktop.

## Remaining From `to-be-considered`

The current, tracked extraction backlog now lives in:

- [TO_BE_CONSIDERED_REMAINING_MAP.md](/Users/nsisong/projects/koreshield/koreshield/docs/TO_BE_CONSIDERED_REMAINING_MAP.md)

## Verification Requirements

For every Phase 1 and Phase 2 change:

- [x] targeted tests must pass
- [x] full `koreshield` backend test suite must pass
- [x] package build must complete successfully

## Latest Verification

- `pytest koreshield/tests/test_sanitizer.py koreshield/tests/test_detector.py koreshield/tests/test_rag_detector.py`
- `pytest` in [koreshield](/Users/nsisong/projects/koreshield/koreshield)
- `python -m build` in [koreshield](/Users/nsisong/projects/koreshield/koreshield)

For Phase 4:

- `pytest` in [koreshield](/Users/nsisong/projects/koreshield/koreshield)
- `python -m build` in [koreshield](/Users/nsisong/projects/koreshield/koreshield)
- `npm test -- --runInBand` in [koreshield-js-sdk](/Users/nsisong/projects/koreshield/koreshield-js-sdk)
- `npm run build` in [koreshield-js-sdk](/Users/nsisong/projects/koreshield/koreshield-js-sdk)
- `pytest` in [koreshield-python-sdk](/Users/nsisong/projects/koreshield/koreshield-python-sdk)
- `python -m build` in [koreshield-python-sdk](/Users/nsisong/projects/koreshield/koreshield-python-sdk)
- `docker compose -f /Users/nsisong/projects/koreshield/koreshield/docker-compose.yml config`
- `docker compose -f /Users/nsisong/projects/koreshield/docker-compose.dev.yml config`
- `docker compose -f /Users/nsisong/projects/koreshield/koreshield/docker-compose.yml build koreshield`
