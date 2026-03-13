"""
Run synthetic CRM benchmark fixtures against the RAG detector.
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.koreshield.rag_detector import RAGContextDetector
from src.koreshield.rag_taxonomy import RetrievedDocument


FIXTURE_DIR = (
    ROOT
    / "research"
    / "experiments"
    / "crm-benchmarks"
)


def load_fixture(path: Path) -> dict:
    with open(path, "r") as fixture_file:
        return json.load(fixture_file)


def run_fixture(path: Path) -> bool:
    fixture = load_fixture(path)
    detector = RAGContextDetector({"min_confidence": 0.3})
    documents = [
        RetrievedDocument(
            id=document["id"],
            content=document["content"],
            metadata=document.get("metadata", {}),
        )
        for document in fixture["documents"]
    ]
    result = detector.scan_retrieved_context(documents, fixture["query"])
    expected = fixture["expected"]
    passed = result.is_safe == expected["is_safe"] and len(result.document_threats) >= expected["minimum_threats"]
    status = "PASS" if passed else "FAIL"
    print(
        f"[{status}] {fixture['platform']} is_safe={result.is_safe} "
        f"threats={len(result.document_threats)}"
    )
    return passed


def main():
    fixtures = sorted(FIXTURE_DIR.glob("*_dataset.json"))
    passed = sum(1 for fixture in fixtures if run_fixture(fixture))
    total = len(fixtures)
    print(f"Completed CRM benchmark run: {passed}/{total} fixtures passed")


if __name__ == "__main__":
    main()
