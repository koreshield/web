# CRM Benchmark Fixtures

This directory contains sanitized benchmark fixtures for validating KoreShield's
CRM security claims against realistic retrieval contexts.

## Included datasets

- `salesforce_synthetic_dataset.json`
- `hubspot_synthetic_dataset.json`

Each fixture contains:

- a `platform`
- a `query`
- retrieved `documents`
- an `expected` outcome

The goal is not to mimic customer data verbatim. The goal is to test whether
KoreShield correctly catches realistic CRM-style indirect prompt injection and
data exfiltration patterns before those documents are passed to an LLM.

## How to run

Use the benchmark helper:

```bash
python scripts/benchmark_crm_datasets.py
```

This prints a simple pass/fail summary for the included Salesforce and HubSpot
fixtures. These datasets are intentionally synthetic and safe to store in-repo.
