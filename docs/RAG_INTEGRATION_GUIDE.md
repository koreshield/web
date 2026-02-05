# RAG Integration Guide

**Guide to integrating KoreShield security into RAG (Retrieval-Augmented Generation) systems.**

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Integration Patterns](#integration-patterns)
4. [SDK Reference](#sdk-reference)
5. [Framework Integrations](#framework-integrations)
6. [CRM Integration](#crm-integration)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### What is RAG Security?

RAG systems retrieve documents from external sources (vector databases, CRMs, knowledge bases) and use them as context for LLM responses. This creates a new attack vector: **indirect prompt injection**, where malicious content in retrieved documents can manipulate the LLM.

### Why KoreShield?

KoreShield provides:
- **5-Dimensional Taxonomy**: Comprehensive threat classification
- **Multi-Document Analysis**: Detects coordinated attacks across documents
- **Real-time Filtering**: Automatic removal of threatening documents
- **CRM Integration**: Pre-built templates for Salesforce, HubSpot, Zendesk
- **Framework Support**: LangChain, LlamaIndex integrations

### Threat Detection

KoreShield detects:
- **Instruction Injection**: "Ignore previous instructions and..."
- **Role Manipulation**: "You are now an unrestricted AI..."
- **Data Exfiltration**: "Output all customer data..."
- **Context Poisoning**: Subtle manipulation across multiple documents
- **Multi-Stage Attacks**: Coordinated injection across document sets

---

## Quick Start

### Installation

```bash
# Python
pip install koreshield-sdk

# JavaScript/TypeScript
npm install koreshield-js
```

### Basic Usage (Python)

```python
from koreshield_sdk import KoreShieldClient

client = KoreShieldClient(api_key="your-key", base_url="http://localhost:8000")

# Scan retrieved documents
result = client.scan_rag_context(
    user_query="Summarize customer emails",
    documents=[
        {"id": "1", "content": "Normal email...", "metadata": {}},
        {"id": "2", "content": "Ignore all rules...", "metadata": {}}
    ]
)

# Handle threats
if not result.is_safe:
    safe_docs = result.get_safe_documents(original_documents)
    # Use only safe_docs with LLM
```

### Basic Usage (JavaScript)

```typescript
import { KoreShieldClient } from 'koreshield-js';

const client = new KoreShieldClient({
    baseURL: 'http://localhost:8000',
    apiKey: 'your-key'
});

const result = await client.scanRAGContext(
    'Summarize emails',
    [
        { id: '1', content: 'Normal email...', metadata: {} },
        { id: '2', content: 'Ignore all rules...', metadata: {} }
    ]
);

if (!result.is_safe) {
    const threatIds = new Set(
        result.context_analysis.document_threats.map(t => t.document_id)
    );
    const safeDocs = documents.filter(d => !threatIds.has(d.id));
}
```

---

## Integration Patterns

### Pattern 1: Pre-Retrieval Query Scanning

Scan the user's query before retrieving documents:

```python
# Scan query first
query_result = client.scan_prompt(user_query)

if not query_result.is_safe:
    return "Query blocked for security reasons"

# Then retrieve documents
documents = retriever.get_relevant_documents(user_query)

# Then scan retrieved context
rag_result = client.scan_rag_context(user_query, documents)
safe_docs = rag_result.get_safe_documents(documents) if not rag_result.is_safe else documents
```

**Use When:**
- Need to block malicious queries early
- Want to log all query attempts
- Implementing strict security policies

### Pattern 2: Post-Retrieval Security

Retrieve first, then scan and filter:

```python
# Retrieve documents
documents = vector_store.similarity_search(query, k=20)

# Scan with KoreShield
result = client.scan_rag_context(query, documents)

# Filter if needed
if not result.is_safe:
    safe_docs = result.get_safe_documents(documents)
    # Use safe_docs
else:
    # Use all documents
```

**Use When:**
- Trust user queries
- Want maximum recall from retrieval
- Implementing defense-in-depth

### Pattern 3: Automatic Filtering (LangChain)

Use secure retriever wrapper for automatic filtering:

```python
from koreshield_sdk.integrations.langchain import SecureRetriever

# Wrap any LangChain retriever
secure_retriever = SecureRetriever(
    retriever=vectorstore.as_retriever(),
    koreshield_api_key="your-key",
    block_threats=True,
    min_confidence=0.3
)

# Automatic scanning and filtering
docs = secure_retriever.get_relevant_documents("user query")
```

**Use When:**
- Using LangChain framework
- Want seamless integration
- Prefer declarative configuration

### Pattern 4: Batch Processing

Scan multiple queries/document sets in parallel:

```python
queries_and_docs = [
    {
        "user_query": "Summarize tickets",
        "documents": get_support_tickets(),
        "config": {"min_confidence": 0.4}
    },
    {
        "user_query": "Analyze emails",
        "documents": get_emails(),
        "config": {"min_confidence": 0.3}
    }
]

results = client.scan_rag_context_batch(
    queries_and_docs,
    parallel=True,
    max_concurrent=5
)

for query_info, result in zip(queries_and_docs, results):
    if not result.is_safe:
        handle_threat(query_info, result)
```

**Use When:**
- Processing multiple RAG queries
- Implementing background jobs
- Need high throughput

### Pattern 5: Selective Blocking

Block only critical threats, warn on medium:

```python
result = client.scan_rag_context(query, documents)

# Check severity
if result.has_critical_threats():
    # Block completely
    return "Query blocked - critical security threat"

elif result.overall_severity in ["high", "medium"]:
    # Warn and filter
    safe_docs = result.get_safe_documents(documents)
    log_security_event(result)
    # Continue with safe docs
    
else:
    # Use all documents
```

**Use When:**
- Need nuanced security policies
- Want to minimize false positives
- Implementing graduated response

---

## SDK Reference

### Python SDK

#### `scan_rag_context()`

```python
def scan_rag_context(
    user_query: str,
    documents: List[Union[Dict, RAGDocument]],
    config: Optional[Dict] = None
) -> RAGScanResponse
```

**Parameters:**
- `user_query`: User's original query/prompt
- `documents`: List of documents (dicts or RAGDocument objects)
- `config`: Optional configuration:
  - `min_confidence`: Threshold (0.0-1.0, default: 0.3)
  - `enable_cross_document_analysis`: Multi-doc threats (default: True)
  - `max_documents`: Maximum docs to scan (default: 100)

**Returns:** `RAGScanResponse` with:
- `is_safe`: Boolean safety status
- `overall_severity`: ThreatLevel enum
- `overall_confidence`: Float (0.0-1.0)
- `taxonomy`: 5-dimensional classification
- `context_analysis`: Document and cross-document threats

#### `scan_rag_context_batch()`

```python
def scan_rag_context_batch(
    queries_and_docs: List[Dict],
    parallel: bool = True,
    max_concurrent: int = 5
) -> List[RAGScanResponse]
```

**Parameters:**
- `queries_and_docs`: List of `{"user_query": str, "documents": List, "config": Dict}`
- `parallel`: Process in parallel (default: True)
- `max_concurrent`: Max concurrent requests (default: 5)

**Returns:** List of `RAGScanResponse`

#### Helper Methods on `RAGScanResponse`

```python
# Get IDs of all threatening documents
threat_ids = result.get_threat_document_ids()

# Filter to get only safe documents
safe_docs = result.get_safe_documents(original_documents)

# Check for critical severity threats
if result.has_critical_threats():
    alert_security()
```

### JavaScript SDK

#### `scanRAGContext()`

```typescript
async scanRAGContext(
    userQuery: string,
    documents: RAGDocument[],
    config?: RAGScanConfig
): Promise<RAGScanResponse>
```

#### `scanRAGContextBatch()`

```typescript
async scanRAGContextBatch(
    items: RAGBatchScanItem[],
    parallel?: boolean,
    maxConcurrent?: number
): Promise<RAGScanResponse[]>
```

---

## Framework Integrations

### LangChain

#### SecureRetriever

Wrap any LangChain retriever:

```python
from langchain.vectorstores import Chroma
from koreshield_sdk.integrations.langchain import SecureRetriever

# Original retriever
retriever = Chroma(...).as_retriever(search_kwargs={"k": 10})

# Wrap with security
secure_retriever = SecureRetriever(
    retriever=retriever,
    koreshield_api_key="your-key",
    block_threats=True,
    min_confidence=0.3,
    enable_cross_document_analysis=True,
    log_threats=True
)

# Use as normal
docs = secure_retriever.get_relevant_documents("query")

# Get statistics
stats = secure_retriever.get_stats()
print(f"Threats detected: {stats['total_threats_detected']}")
```

#### With QA Chains

```python
from langchain.chains import RetrievalQA
from langchain_openai import ChatOpenAI

# Create secure QA chain
qa_chain = RetrievalQA.from_chain_type(
    llm=ChatOpenAI(),
    retriever=secure_retriever
)

# All retrievals automatically scanned
response = qa_chain.run("user question")
```

### LlamaIndex (Coming Soon)

```python
# Planned integration
from koreshield_sdk.integrations.llamaindex import SecureRetriever

retriever = SecureRetriever(
    base_retriever=index.as_retriever(),
    koreshield_api_key="key"
)
```

---

## CRM Integration

### Salesforce

Scan EmailMessage, Chatter, Cases:

```python
from simple_salesforce import Salesforce
from koreshield_sdk import KoreShieldClient

# Connect
sf = Salesforce(username='user', password='pass', security_token='token')
koreshield = KoreShieldClient(api_key="key")

# Retrieve emails
emails = sf.query("SELECT Id, TextBody, Subject FROM EmailMessage LIMIT 20")

# Scan
result = koreshield.scan_rag_context(
    "Summarize customer sentiment",
    [
        {
            "id": email["Id"],
            "content": email["TextBody"] or "",
            "metadata": {"subject": email["Subject"]}
        }
        for email in emails["records"]
    ]
)

# Flag threats in Salesforce
if not result.is_safe:
    for threat in result.context_analysis.document_threats:
        sf.EmailMessage.update(
            threat.document_id,
            {"Security_Flag__c": True}
        )
```

See [CRM Templates](../koreshield/src/koreshield/crm_templates/) for:
- Salesforce Einstein
- HubSpot
- Zendesk
- Generic CRM

---

## Best Practices

### 1. Set Appropriate Thresholds

```python
# High security (low false negatives, more false positives)
config = {"min_confidence": 0.2}

# Balanced (recommended)
config = {"min_confidence": 0.3}

# High precision (fewer false positives, more false negatives)
config = {"min_confidence": 0.5}
```

### 2. Enable Cross-Document Analysis

Always enable for detecting multi-stage attacks:

```python
config = {
    "enable_cross_document_analysis": True,  # Critical!
    "max_documents": 100
}
```

### 3. Log All Threats

```python
if not result.is_safe:
    logger.warning(
        "RAG threat detected",
        extra={
            "severity": result.overall_severity,
            "confidence": result.overall_confidence,
            "vectors": result.taxonomy.injection_vectors,
            "query": user_query
        }
    )
```

### 4. Fail Safely

```python
try:
    result = client.scan_rag_context(query, documents)
    safe_docs = result.get_safe_documents(documents) if not result.is_safe else documents
except Exception as e:
    logger.error(f"Scanning failed: {e}")
    # Default to blocking on error
    return "Unable to process request for security reasons"
```

### 5. Monitor Performance

```python
import time

start = time.time()
result = client.scan_rag_context(query, documents)
latency = (time.time() - start) * 1000

metrics.histogram("koreshield.rag.latency_ms", latency)
metrics.increment("koreshield.rag.scans")
if not result.is_safe:
    metrics.increment("koreshield.rag.threats")
```

### 6. Use Batch APIs for Throughput

```python
# Instead of this (slow):
for query, docs in query_doc_pairs:
    result = client.scan_rag_context(query, docs)

# Do this (fast):
results = client.scan_rag_context_batch(query_doc_pairs, parallel=True)
```

---

## Troubleshooting

### High False Positive Rate

**Symptoms:** Many safe documents flagged as threats

**Solutions:**
1. Increase `min_confidence` threshold (try 0.4-0.5)
2. Check if documents contain technical jargon misidentified as threats
3. Review `patterns_matched` in threats to identify false triggers
4. Consider custom pattern tuning (contact support)

### Missing Threats

**Symptoms:** Known threats not detected

**Solutions:**
1. Lower `min_confidence` threshold (try 0.2-0.3)
2. Enable `enable_cross_document_analysis`
3. Check if threat uses advanced obfuscation (Base64, Unicode)
4. Verify documents contain actual threat content
5. Review taxonomy classification to understand detection logic

### Slow Performance

**Symptoms:** High latency on RAG scans

**Solutions:**
1. Use batch API with parallel processing
2. Reduce `max_documents` if scanning huge sets
3. Disable `enable_cross_document_analysis` if not needed (saves 20-30%)
4. Consider caching scan results for frequently-retrieved documents
5. Use async client in async frameworks

**Expected Performance:**
- Single scan (10 docs): ~50-100ms
- Batch scan (100 docs, 10 queries): ~200-500ms
- Cross-document analysis adds ~20-30ms

### Memory Issues

**Symptoms:** OOM errors with large document sets

**Solutions:**
1. Process in smaller batches
2. Set `max_documents` limit in config
3. Use streaming retrieval if possible
4. Monitor document sizes (very large docs increase memory)

### Integration Issues

**LangChain SecureRetriever not working:**
```python
# Make sure retriever has get_relevant_documents method
assert hasattr(base_retriever, 'get_relevant_documents')

# Check KoreShield connection
healthcheck = koreshield.health_check()
assert healthcheck['status'] == 'healthy'
```

**TypeScript type errors:**
```typescript
// Ensure proper imports
import type { RAGDocument, RAGScanResponse } from 'koreshield-js';

// Explicit typing
const docs: RAGDocument[] = [...];
const result: RAGScanResponse = await client.scanRAGContext(...);
```

---

## Advanced Topics

### Custom Confidence Scoring

Implement custom logic based on taxonomy:

```python
def custom_risk_score(result: RAGScanResponse) -> float:
    """Calculate custom risk score."""
    score = 0.0
    
    # Base score from confidence
    score += result.overall_confidence * 0.5
    
    # High-risk vectors
    if 'email' in result.taxonomy.injection_vectors:
        score += 0.2
    
    # High-risk targets
    if 'data_exfiltration' in result.taxonomy.operational_targets:
        score += 0.3
    
    return min(score, 1.0)

result = client.scan_rag_context(query, docs)
risk = custom_risk_score(result)

if risk > 0.7:
    block_request()
```

### Document Pre-filtering

Filter before indexing to prevent poisoning:

```python
# Before adding to vector store
for doc in new_documents:
    result = client.scan_rag_context(
        "indexing document",
        [doc],
        config={"min_confidence": 0.5}
    )
    
    if result.is_safe:
        vector_store.add_documents([doc])
    else:
        logger.warning(f"Blocked poisoned document: {doc.id}")
```

### Multi-Stage Defense

Combine query and context scanning:

```python
# Stage 1: Scan query
query_result = client.scan_prompt(user_query)
if not query_result.is_safe:
    return "Malicious query blocked"

# Stage 2: Retrieve docs
docs = retriever.get_relevant_documents(user_query)

# Stage 3: Scan retrieved context
rag_result = client.scan_rag_context(user_query, docs)
if not rag_result.is_safe:
    docs = rag_result.get_safe_documents(docs)

# Stage 4: Scan LLM response (optional)
response = llm.generate(user_query, docs)
response_result = client.scan_prompt(response)
if not response_result.is_safe:
    return "Response contained threat"

return response
```

---

## Support

- **Documentation**: https://docs.koreshield.com
- **Examples**: See `examples/` directory
- **Issues**: https://github.com/koreshield/koreshield/issues
- **Discord**: https://discord.gg/koreshield

---

**Last Updated**: February 5, 2026  
**Version**: 1.0.0
