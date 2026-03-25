"""
Regression tests backed by benchmark-style fixtures for Phase 1 and Phase 2.
"""

from __future__ import annotations

import json
from pathlib import Path

from src.koreshield.detector import AttackDetector
from src.koreshield.rag_detector import RAGContextDetector
from src.koreshield.rag_taxonomy import RetrievedDocument


FIXTURES_DIR = Path(__file__).parent / "fixtures"


def _load_fixture(name: str):
    with open(FIXTURES_DIR / name, "r", encoding="utf-8") as handle:
        return json.load(handle)


def test_evasive_prompt_fixture_regression():
    """Ensure evasive prompt fixtures continue to produce the expected outcomes."""
    detector = AttackDetector()
    cases = _load_fixture("evasive_prompt_benchmark.json")

    for case in cases:
        result = detector.detect(case["prompt"])
        assert result["is_attack"] is case["expected_attack"], case["name"]


def test_rag_poisoning_fixture_regression():
    """Ensure RAG poisoning fixtures continue to produce the expected outcomes."""
    detector = RAGContextDetector(config={"min_confidence": 0.3})
    cases = _load_fixture("rag_poisoning_benchmark.json")

    for case in cases:
        documents = [
            RetrievedDocument(
                id=document["id"],
                content=document["content"],
                metadata=document.get("metadata", {}),
            )
            for document in case["documents"]
        ]
        result = detector.scan_retrieved_context(documents, case["user_query"])
        assert result.is_safe is case["expected_safe"], case["name"]
