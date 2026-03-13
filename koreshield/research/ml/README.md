# ML Fine-Tuning Plan

KoreShield currently uses heuristic and rule-driven detection, with a lightweight
ML placeholder in the detector. Fine-tuning a stronger model should happen only
after we have a curated adversarial dataset and a repeatable evaluation set.

## What we need before fine-tuning

- labeled adversarial prompts
- labeled benign enterprise prompts
- retrieval-context attacks for RAG scenarios
- CRM-specific attack examples
- train, validation, and holdout splits

## Recommended next step

1. Expand the synthetic CRM benchmark fixtures.
2. Collect anonymized red-team payloads from pilots and internal testing.
3. Define offline evaluation metrics:
   - recall on known attacks
   - false positive rate on benign business prompts
   - latency impact
4. Only then train or fine-tune a classifier.

Until that data exists, we should not market a fine-tuned production model as a
current KoreShield capability.
