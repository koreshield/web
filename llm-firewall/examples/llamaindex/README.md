
# KoreShield LlamaIndex Integration

This example demonstrates how to integrate KoreShield with **LlamaIndex** by creating a custom LLM class.

## Prerequisites

1.  **KoreShield Proxy** running.
2.  Python 3.10+.

## Installation

```bash
pip install llama-index koreshield
```

## Usage

The `KoreShieldLLM` class in `rag_app.py` inherits from `CustomLLM` and intercepts calls to `.complete()`. It first validates the prompt with KoreShield's `.guard()` method.

To use it in your RAG pipeline:

```python
from llama_index.core import Settings
from rag_app import KoreShieldLLM

# Set as the global LLM
Settings.llm = KoreShieldLLM()
```

## Running the Example

```bash
python rag_app.py
```
