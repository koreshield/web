# Remaining `to-be-considered` Integration Map

This document tracks what is still left to evaluate or extract from [`to-be-considered`](/Users/nsisong/projects/koreshield/to-be-considered) after Phases 1 through 4.

## Already Integrated

- [x] normalization and obfuscation hardening concepts
- [x] high-signal prompt-injection pattern expansion
- [x] benchmark fixtures for evasive prompt injection and RAG poisoning
- [x] query-aware RAG and indirect prompt injection scoring
- [x] richer RAG threat metadata for downstream consumers
- [x] embedded preflight scanning in the JS SDK
- [x] embedded preflight scanning in the Python SDK
- [x] tool-call capability modeling and review-required semantics
- [x] server-side tool-call scanning and policy-backed runtime decisions

## Next Candidates To Extract

### Highest Value

- [ ] Expand the detector corpus with additional `patterns/` ideas that improve recall without materially increasing false positives
- [ ] Convert more dataset and benchmark-registry scenarios into stable KoreShield regression fixtures
- [ ] Add confused-deputy and cross-tool escalation heuristics inspired by `src/confused-deputy.js`
- [ ] Add richer tool provenance and trust-context scoring inspired by `src/mcp-security-runtime.js`
- [ ] Surface tool-call decision history and review workflows in the KoreShield web dashboard

### Platform Extensions

- [ ] Evaluate a Go SDK only if a concrete customer or deployment path needs it
- [ ] Evaluate Rust and WASM extraction only if local/browser-side performance becomes a real product requirement
- [ ] Consider OpenTelemetry collector integration for downstream enterprise telemetry pipelines
- [ ] Consider a GitHub App or CI integration only as a KoreShield integration surface, not a separate product
- [ ] Consider Kubernetes sidecar and operator packaging only after runtime enforcement has production demand
- [ ] Consider Terraform packaging only after the product shape for enterprise deployment is stable

### Product Surfaces Not Yet Taken

- [ ] MCP-native session governance and agent-to-agent trust modeling
- [ ] runtime approval workflows for sensitive tool classes
- [ ] end-user dashboard views for runtime tool-call events
- [ ] policy authoring UX for runtime capabilities and exceptions
- [ ] enterprise deployment packaging for runtime controls

## Explicitly Not Planned As Wholesale Imports

- [ ] Do not merge the standalone `dashboard` or `dashboard-live` apps directly into KoreShield
- [ ] Do not adopt separate Agent Shield branding or a parallel control plane
- [ ] Do not import `terraform-provider`, `github-app`, `vscode`, or `vscode-extension` wholesale
- [ ] Do not fork a second policy engine or a separate runtime-only backend

## Decision Rules For Any Future Extraction

- A `to-be-considered` capability only lands if it strengthens KoreShield’s existing product line.
- The backend policy model must stay unified.
- New runtime work must be testable through the existing backend and SDK release flow.
- Docker and standard package builds must remain part of verification before adoption.
