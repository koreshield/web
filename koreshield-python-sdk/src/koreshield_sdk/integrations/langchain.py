"""LangChain integration for KoreShield."""

from typing import Any, Dict, List, Optional, Union
from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.outputs import LLMResult
from langchain_core.messages import BaseMessage

from ..client import KoreShieldClient
from ..async_client import AsyncKoreShieldClient
from ..types import (
    DetectionResult,
    ThreatLevel,
    RAGDocument,
    RAGScanResponse,
    RAGScanConfig,
)
from ..exceptions import KoreShieldError


class KoreShieldCallbackHandler(BaseCallbackHandler):
    """LangChain callback handler for KoreShield security monitoring.

    This handler automatically scans prompts and responses for security threats
    during LangChain operations.
    """

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.koreshield.com",
        block_on_threat: bool = False,
        threat_threshold: ThreatLevel = ThreatLevel.MEDIUM,
        scan_responses: bool = True,
        **client_kwargs
    ):
        """Initialize the KoreShield callback handler.

        Args:
            api_key: KoreShield API key
            base_url: KoreShield API base URL
            block_on_threat: Whether to raise exception on detected threats
            threat_threshold: Minimum threat level to trigger blocking
            scan_responses: Whether to scan LLM responses
            **client_kwargs: Additional arguments for KoreShieldClient
        """
        super().__init__()
        self.client = KoreShieldClient(api_key, base_url, **client_kwargs)
        self.block_on_threat = block_on_threat
        self.threat_threshold = threat_threshold
        self.scan_responses = scan_responses
        self.scan_results = []

    def on_llm_start(self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any) -> None:
        """Called when LLM starts processing prompts."""
        for prompt in prompts:
            try:
                result = self.client.scan_prompt(prompt)
                self.scan_results.append({
                    "type": "prompt",
                    "content": prompt,
                    "result": result,
                    "timestamp": kwargs.get("run_id", None),
                })

                if self._should_block(result):
                    raise KoreShieldError(
                        f"Security threat detected in prompt: {result.threat_level.value} "
                        f"(confidence: {result.confidence:.2f})"
                    )

            except KoreShieldError:
                raise  # Re-raise security errors
            except Exception as e:
                # Log but don't block on client errors
                print(f"Warning: KoreShield scan failed: {e}")

    def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        """Called when LLM finishes processing."""
        if not self.scan_responses:
            return

        for generation in response.generations:
            for gen in generation:
                if hasattr(gen, 'text') and gen.text:
                    try:
                        result = self.client.scan_prompt(gen.text)
                        self.scan_results.append({
                            "type": "response",
                            "content": gen.text,
                            "result": result,
                            "timestamp": kwargs.get("run_id", None),
                        })

                        if self._should_block(result):
                            raise KoreShieldError(
                                f"Security threat detected in response: {result.threat_level.value} "
                                f"(confidence: {result.confidence:.2f})"
                            )

                    except KoreShieldError:
                        raise  # Re-raise security errors
                    except Exception as e:
                        # Log but don't block on client errors
                        print(f"Warning: KoreShield scan failed: {e}")

    def get_scan_results(self) -> List[Dict[str, Any]]:
        """Get all scan results from this handler."""
        return self.scan_results.copy()

    def clear_scan_results(self) -> None:
        """Clear stored scan results."""
        self.scan_results.clear()

    def _should_block(self, result: DetectionResult) -> bool:
        """Determine if a result should trigger blocking."""
        if not self.block_on_threat:
            return False

        threat_levels = {
            ThreatLevel.SAFE: 0,
            ThreatLevel.LOW: 1,
            ThreatLevel.MEDIUM: 2,
            ThreatLevel.HIGH: 3,
            ThreatLevel.CRITICAL: 4,
        }

        result_level = threat_levels.get(result.threat_level, 0)
        threshold_level = threat_levels.get(self.threat_threshold, 2)

        return result_level >= threshold_level


class AsyncKoreShieldCallbackHandler(BaseCallbackHandler):
    """Async LangChain callback handler for KoreShield security monitoring."""

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.koreshield.com",
        block_on_threat: bool = False,
        threat_threshold: ThreatLevel = ThreatLevel.MEDIUM,
        scan_responses: bool = True,
        **client_kwargs
    ):
        """Initialize the async KoreShield callback handler."""
        super().__init__()
        self.client = AsyncKoreShieldClient(api_key, base_url, **client_kwargs)
        self.block_on_threat = block_on_threat
        self.threat_threshold = threat_threshold
        self.scan_responses = scan_responses
        self.scan_results = []

    async def on_llm_start(self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any) -> None:
        """Called when LLM starts processing prompts (async)."""
        for prompt in prompts:
            try:
                result = await self.client.scan_prompt(prompt)
                self.scan_results.append({
                    "type": "prompt",
                    "content": prompt,
                    "result": result,
                    "timestamp": kwargs.get("run_id", None),
                })

                if self._should_block(result):
                    raise KoreShieldError(
                        f"Security threat detected in prompt: {result.threat_level.value} "
                        f"(confidence: {result.confidence:.2f})"
                    )

            except KoreShieldError:
                raise  # Re-raise security errors
            except Exception as e:
                # Log but don't block on client errors
                print(f"Warning: KoreShield scan failed: {e}")

    async def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        """Called when LLM finishes processing (async)."""
        if not self.scan_responses:
            return

        for generation in response.generations:
            for gen in generation:
                if hasattr(gen, 'text') and gen.text:
                    try:
                        result = await self.client.scan_prompt(gen.text)
                        self.scan_results.append({
                            "type": "response",
                            "content": gen.text,
                            "result": result,
                            "timestamp": kwargs.get("run_id", None),
                        })

                        if self._should_block(result):
                            raise KoreShieldError(
                                f"Security threat detected in response: {result.threat_level.value} "
                                f"(confidence: {result.confidence:.2f})"
                            )

                    except KoreShieldError:
                        raise  # Re-raise security errors
                    except Exception as e:
                        # Log but don't block on client errors
                        print(f"Warning: KoreShield scan failed: {e}")

    def get_scan_results(self) -> List[Dict[str, Any]]:
        """Get all scan results from this handler."""
        return self.scan_results.copy()

    def clear_scan_results(self) -> None:
        """Clear stored scan results."""
        self.scan_results.clear()

    def _should_block(self, result: DetectionResult) -> bool:
        """Determine if a result should trigger blocking."""
        if not self.block_on_threat:
            return False

        threat_levels = {
            ThreatLevel.SAFE: 0,
            ThreatLevel.LOW: 1,
            ThreatLevel.MEDIUM: 2,
            ThreatLevel.HIGH: 3,
            ThreatLevel.CRITICAL: 4,
        }

        result_level = threat_levels.get(result.threat_level, 0)
        threshold_level = threat_levels.get(self.threat_threshold, 2)

        return result_level >= threshold_level


# Convenience functions for easy integration
def create_koreshield_callback(
    api_key: str,
    block_on_threat: bool = False,
    threat_threshold: ThreatLevel = ThreatLevel.MEDIUM,
    **kwargs
) -> KoreShieldCallbackHandler:
    """Create a KoreShield callback handler for LangChain.

    Args:
        api_key: KoreShield API key
        block_on_threat: Whether to block on detected threats
        threat_threshold: Minimum threat level for blocking
        **kwargs: Additional arguments for KoreShieldClient

    Returns:
        Configured KoreShieldCallbackHandler
    """
    return KoreShieldCallbackHandler(
        api_key=api_key,
        block_on_threat=block_on_threat,
        threat_threshold=threat_threshold,
        **kwargs
    )


def create_async_koreshield_callback(
    api_key: str,
    block_on_threat: bool = False,
    threat_threshold: ThreatLevel = ThreatLevel.MEDIUM,
    **kwargs
) -> AsyncKoreShieldCallbackHandler:
    """Create an async KoreShield callback handler for LangChain.

    Args:
        api_key: KoreShield API key
        block_on_threat: Whether to block on detected threats
        threat_threshold: Minimum threat level for blocking
        **kwargs: Additional arguments for AsyncKoreShieldClient

    Returns:
        Configured AsyncKoreShieldCallbackHandler
    """
    return AsyncKoreShieldCallbackHandler(
        api_key=api_key,
        block_on_threat=block_on_threat,
        threat_threshold=threat_threshold,
        **kwargs
    )


# RAG Document Scanning Support

class SecureRetriever:
    """Wrapper for LangChain retrievers that adds automatic RAG security scanning.
    
    This class wraps any LangChain retriever and automatically scans retrieved
    documents for indirect prompt injection attacks before returning them.
    
    Example:
        ```python
        from langchain.vectorstores import Chroma
        from koreshield_sdk.integrations.langchain import SecureRetriever
        
        # Original retriever
        base_retriever = vectorstore.as_retriever()
        
        # Wrap with security
        secure_retriever = SecureRetriever(
            retriever=base_retriever,
            koreshield_api_key="your-key",
            block_threats=True,
            min_confidence=0.3
        )
        
        # Use as normal - automatic scanning
        docs = secure_retriever.get_relevant_documents("user query")
        # Threatening documents are automatically filtered
        ```
    """
    
    def __init__(
        self,
        retriever: Any,
        koreshield_api_key: str,
        koreshield_base_url: str = "http://localhost:8000",
        block_threats: bool = True,
        min_confidence: float = 0.3,
        enable_cross_document_analysis: bool = True,
        log_threats: bool = True,
    ):
        """Initialize secure retriever.
        
        Args:
            retriever: Base LangChain retriever to wrap
            koreshield_api_key: KoreShield API key
            koreshield_base_url: API base URL
            block_threats: Whether to filter threatening documents
            min_confidence: Threat confidence threshold (0.0-1.0)
            enable_cross_document_analysis: Enable multi-doc threat detection
            log_threats: Log detected threats
        """
        self.retriever = retriever
        self.koreshield = KoreShieldClient(
            api_key=koreshield_api_key,
            base_url=koreshield_base_url
        )
        self.block_threats = block_threats
        self.min_confidence = min_confidence
        self.enable_cross_document_analysis = enable_cross_document_analysis
        self.log_threats = log_threats
        
        # Statistics
        self.total_scans = 0
        self.total_threats_detected = 0
        self.total_documents_blocked = 0
    
    def get_relevant_documents(self, query: str) -> List[Any]:
        """Retrieve and scan documents.
        
        Args:
            query: User's query
            
        Returns:
            List of LangChain documents (threats filtered if enabled)
        """
        # Retrieve documents
        documents = self.retriever.get_relevant_documents(query)
        
        if not documents:
            return documents
        
        # Convert to RAG documents
        rag_documents = []
        for idx, doc in enumerate(documents):
            rag_doc = RAGDocument(
                id=doc.metadata.get("id", f"doc_{idx}"),
                content=doc.page_content,
                metadata=doc.metadata
            )
            rag_documents.append(rag_doc)
        
        # Scan with KoreShield
        config = RAGScanConfig(
            min_confidence=self.min_confidence,
            enable_cross_document_analysis=self.enable_cross_document_analysis
        )
        
        result = self.koreshield.scan_rag_context(
            user_query=query,
            documents=rag_documents,
            config=config
        )
        
        self.total_scans += 1
        
        # Handle threats
        if not result.is_safe:
            self.total_threats_detected += 1
            
            if self.log_threats:
                print(f"[KoreShield] RAG threat detected: {result.overall_severity}")
                print(f"[KoreShield] Confidence: {result.overall_confidence:.2f}")
                print(f"[KoreShield] Vectors: {result.taxonomy.injection_vectors}")
            
            if self.block_threats:
                # Filter out threatening documents
                safe_rag_docs = result.get_safe_documents(rag_documents)
                safe_ids = {doc.id for doc in safe_rag_docs}
                
                filtered_docs = [
                    doc for idx, doc in enumerate(documents)
                    if rag_documents[idx].id in safe_ids
                ]
                
                blocked_count = len(documents) - len(filtered_docs)
                self.total_documents_blocked += blocked_count
                
                if self.log_threats:
                    print(f"[KoreShield] Filtered {blocked_count} threatening documents")
                
                return filtered_docs
        
        return documents
    
    def get_stats(self) -> Dict[str, Any]:
        """Get retriever statistics.
        
        Returns:
            Dictionary with scan statistics
        """
        return {
            "total_scans": self.total_scans,
            "total_threats_detected": self.total_threats_detected,
            "total_documents_blocked": self.total_documents_blocked,
            "threat_detection_rate": (
                self.total_threats_detected / self.total_scans
                if self.total_scans > 0 else 0.0
            )
        }


def secure_retriever(
    retriever: Any,
    api_key: str,
    base_url: str = "http://localhost:8000",
    **kwargs
) -> SecureRetriever:
    """Create a secure retriever from any LangChain retriever.
    
    Args:
        retriever: Base LangChain retriever
        api_key: KoreShield API key
        base_url: KoreShield API base URL
        **kwargs: Additional SecureRetriever arguments
        
    Returns:
        SecureRetriever instance
    
    Example:
        ```python
        from koreshield_sdk.integrations.langchain import secure_retriever
        
        safe_retriever = secure_retriever(
            vectorstore.as_retriever(),
            api_key="your-key",
            block_threats=True
        )
        
        docs = safe_retriever.get_relevant_documents("user query")
        ```
    """
    return SecureRetriever(
        retriever,
        koreshield_api_key=api_key,
        koreshield_base_url=base_url,
        **kwargs
    )