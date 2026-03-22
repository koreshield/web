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
- [ ] Add benchmark fixtures for evasive prompt injection cases
- [ ] Add false-positive benchmark fixtures
- [ ] Define detector performance budgets for future hardening work

### Landed In

- [detector.py](/Users/nsisong/projects/koreshield/koreshield/src/koreshield/detector.py)
- [sanitizer.py](/Users/nsisong/projects/koreshield/koreshield/src/koreshield/sanitizer.py)
- [normalization.py](/Users/nsisong/projects/koreshield/koreshield/src/koreshield/normalization.py)

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
- [ ] Build benchmark datasets for chunk poisoning and metadata injection
- [ ] Update Python and JS SDKs if the RAG result model expands further
- [ ] Document indirect prompt injection detection behavior and limits

### Landed In

- [rag_detector.py](/Users/nsisong/projects/koreshield/koreshield/src/koreshield/rag_detector.py)
- [test_rag_detector.py](/Users/nsisong/projects/koreshield/koreshield/tests/test_rag_detector.py)

## Next Priorities

### Immediate

- [ ] Create benchmark fixtures inspired by `to-be-considered/datasets`
- [ ] Define the merge map for remaining high-value modules
- [ ] Decide how much of the richer RAG metadata should surface in the API/UI now

### After Phase 1 and 2 Stabilize

- [ ] Add embedded SDK preflight scanning helpers
- [ ] Design KoreShield tool-call security model
- [ ] Decide whether MCP security becomes a first-class KoreShield product area

## Verification Requirements

For every Phase 1 and Phase 2 change:

- [x] targeted tests must pass
- [x] full `koreshield` backend test suite must pass
- [x] package build must complete successfully

## Latest Verification

- `pytest koreshield/tests/test_sanitizer.py koreshield/tests/test_detector.py koreshield/tests/test_rag_detector.py`
- `pytest` in [koreshield](/Users/nsisong/projects/koreshield/koreshield)
- `python -m build` in [koreshield](/Users/nsisong/projects/koreshield/koreshield)
