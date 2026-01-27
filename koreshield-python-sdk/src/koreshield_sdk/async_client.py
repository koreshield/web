"""Asynchronous KoreShield client with enhanced features."""

import asyncio
import time
import json
from typing import Dict, List, Optional, Any, Union, AsyncGenerator, Callable
from contextlib import asynccontextmanager
import httpx

from .types import (
    AuthConfig,
    ScanRequest,
    ScanResponse,
    BatchScanRequest,
    BatchScanResponse,
    DetectionResult,
    StreamingScanRequest,
    StreamingScanResponse,
    SecurityPolicy,
    PerformanceMetrics,
)
from .exceptions import (
    KoreShieldError,
    AuthenticationError,
    ValidationError,
    RateLimitError,
    ServerError,
    NetworkError,
    TimeoutError,
)


class AsyncKoreShieldClient:
    """Asynchronous KoreShield API client with enhanced features."""

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.koreshield.com",
        timeout: float = 30.0,
        retry_attempts: int = 3,
        retry_delay: float = 1.0,
        enable_metrics: bool = True,
        security_policy: Optional[SecurityPolicy] = None,
        connection_pool_limits: Optional[Dict[str, int]] = None,
    ):
        """Initialize the async KoreShield client.

        Args:
            api_key: Your KoreShield API key
            base_url: Base URL for the API (default: production)
            timeout: Request timeout in seconds
            retry_attempts: Number of retry attempts
            retry_delay: Delay between retries in seconds
            enable_metrics: Whether to collect performance metrics
            security_policy: Custom security policy configuration
            connection_pool_limits: HTTP connection pool limits
        """
        self.auth_config = AuthConfig(
            api_key=api_key,
            base_url=base_url.rstrip("/"),
            timeout=timeout,
            retry_attempts=retry_attempts,
            retry_delay=retry_delay,
        )

        # Performance monitoring
        self.enable_metrics = enable_metrics
        self.metrics = PerformanceMetrics()
        self._start_time = time.time()
        self._request_count = 0

        # Security policy
        self.security_policy = security_policy or SecurityPolicy(name="default")

        # Connection pool configuration
        pool_limits = connection_pool_limits or {
            "max_keepalive_connections": 20,
            "max_connections": 100,
            "keepalive_expiry": 30.0,
        }

        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(timeout, connect=10.0),
            limits=httpx.Limits(**pool_limits),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": f"koreshield-python-sdk/0.2.0",
            },
        )

    async def __aenter__(self):
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()

    async def scan_prompt(self, prompt: str, **kwargs) -> DetectionResult:
        """Scan a single prompt for security threats asynchronously with enhanced features.

        Args:
            prompt: The prompt text to scan
            **kwargs: Additional context (user_id, session_id, metadata, etc.)

        Returns:
            DetectionResult with security analysis

        Raises:
            AuthenticationError: If API key is invalid
            ValidationError: If request is malformed
            RateLimitError: If rate limit exceeded
            ServerError: If server error occurs
            NetworkError: If network error occurs
            TimeoutError: If request times out
        """
        start_time = time.time()

        # Apply security policy filtering
        if not self._passes_security_policy(prompt):
            # Create blocked result based on policy
            processing_time = time.time() - start_time
            self._update_metrics(processing_time)

            return DetectionResult(
                is_safe=False,
                threat_level=self.security_policy.threat_threshold,
                confidence=1.0,
                indicators=[DetectionIndicator(
                    type=DetectionType.RULE,
                    severity=self.security_policy.threat_threshold,
                    confidence=1.0,
                    description="Blocked by security policy",
                    metadata={"policy_name": self.security_policy.name}
                )],
                processing_time_ms=processing_time * 1000,
                scan_id=f"policy_block_{int(time.time())}",
                metadata={"blocked_by_policy": True}
            )

        request = ScanRequest(prompt=prompt, **kwargs)

        for attempt in range(self.auth_config.retry_attempts + 1):
            try:
                response = await self._make_request("POST", "/v1/scan", request.dict())
                scan_response = ScanResponse(**response)

                processing_time = time.time() - start_time
                self._update_metrics(processing_time)

                return scan_response.result

            except (RateLimitError, ServerError, NetworkError) as e:
                if attempt == self.auth_config.retry_attempts:
                    processing_time = time.time() - start_time
                    self._update_metrics(processing_time, is_error=True)
                    raise e
                await asyncio.sleep(self.auth_config.retry_delay * (2 ** attempt))

    def _passes_security_policy(self, prompt: str) -> bool:
        """Check if prompt passes the current security policy.

        Args:
            prompt: The prompt to check

        Returns:
            True if prompt passes policy, False if blocked
        """
        # Check allowlist patterns
        for pattern in self.security_policy.allowlist_patterns:
            if pattern.lower() in prompt.lower():
                return True

        # Check blocklist patterns
        for pattern in self.security_policy.blocklist_patterns:
            if pattern.lower() in prompt.lower():
                return False

        return True

    async def scan_batch(
        self,
        prompts: List[str],
        parallel: bool = True,
        max_concurrent: int = 10,
        batch_size: int = 50,
        progress_callback: Optional[Callable[[int, int], None]] = None,
        **kwargs
    ) -> List[DetectionResult]:
        """Scan multiple prompts for security threats asynchronously with enhanced features.

        Args:
            prompts: List of prompt texts to scan
            parallel: Whether to process in parallel (default: True)
            max_concurrent: Maximum concurrent requests (default: 10)
            batch_size: Size of each batch for processing (default: 50)
            progress_callback: Optional callback for progress updates (current, total)
            **kwargs: Additional context for all requests

        Returns:
            List of DetectionResult objects
        """
        start_time = time.time()
        total_prompts = len(prompts)
        all_results = []

        if not parallel or total_prompts == 1:
            # Sequential processing
            for i, prompt in enumerate(prompts):
                result = await self.scan_prompt(prompt, **kwargs)
                all_results.append(result)
                if progress_callback:
                    progress_callback(i + 1, total_prompts)
            processing_time = time.time() - start_time
            self._update_batch_metrics(total_prompts, processing_time, len(all_results))
            return all_results

        # Parallel processing with batching for better performance
        semaphore = asyncio.Semaphore(max_concurrent)
        completed = 0

        async def scan_with_semaphore(prompt: str) -> DetectionResult:
            nonlocal completed
            async with semaphore:
                result = await self.scan_prompt(prompt, **kwargs)
                completed += 1
                if progress_callback:
                    progress_callback(completed, total_prompts)
                return result

        # Process in batches to avoid overwhelming the server
        for i in range(0, total_prompts, batch_size):
            batch = prompts[i:i + batch_size]
            tasks = [scan_with_semaphore(prompt) for prompt in batch]
            batch_results = await asyncio.gather(*tasks)
            all_results.extend(batch_results)

        processing_time = time.time() - start_time
        self._update_batch_metrics(total_prompts, processing_time, len(all_results))
        return all_results

    async def scan_stream(
        self,
        content: str,
        chunk_size: int = 1000,
        overlap: int = 100,
        **kwargs
    ) -> StreamingScanResponse:
        """Scan long content in streaming chunks for real-time security analysis.

        Args:
            content: The long content to scan in chunks
            chunk_size: Size of each chunk in characters (default: 1000)
            overlap: Overlap between chunks in characters (default: 100)
            **kwargs: Additional context for the scan

        Returns:
            StreamingScanResponse with chunk-by-chunk results
        """
        start_time = time.time()

        # Create overlapping chunks
        chunks = self._create_overlapping_chunks(content, chunk_size, overlap)
        chunk_results = []

        # Process chunks concurrently for better performance
        semaphore = asyncio.Semaphore(5)  # Limit concurrent chunk processing

        async def scan_chunk(chunk: str, chunk_index: int) -> DetectionResult:
            async with semaphore:
                # Add chunk context
                chunk_kwargs = {
                    **kwargs,
                    "chunk_index": chunk_index,
                    "total_chunks": len(chunks),
                    "chunk_metadata": {
                        "start_pos": chunk_index * (chunk_size - overlap),
                        "end_pos": min((chunk_index + 1) * (chunk_size - overlap) + chunk_size, len(content)),
                        "overlap": overlap if chunk_index > 0 else 0
                    }
                }
                result = await self.scan_prompt(chunk, **chunk_kwargs)
                self.metrics.streaming_chunks_processed += 1
                return result

        # Process all chunks
        tasks = [scan_chunk(chunk, i) for i, chunk in enumerate(chunks)]
        chunk_results = await asyncio.gather(*tasks)

        # Aggregate overall result
        overall_threat_level = max((r.threat_level for r in chunk_results),
                                   key=lambda x: ["safe", "low", "medium", "high", "critical"].index(x.value))
        overall_confidence = sum(r.confidence for r in chunk_results) / len(chunk_results)
        overall_safe = all(r.is_safe for r in chunk_results)

        # Create aggregate indicators
        all_indicators = []
        for i, result in enumerate(chunk_results):
            for indicator in result.indicators:
                # Add chunk information to indicators
                enhanced_indicator = DetectionIndicator(
                    **indicator.model_dump(),
                    metadata={
                        **(indicator.metadata or {}),
                        "chunk_index": i
                    }
                )
                all_indicators.append(enhanced_indicator)

        overall_result = DetectionResult(
            is_safe=overall_safe,
            threat_level=overall_threat_level,
            confidence=overall_confidence,
            indicators=all_indicators,
            processing_time_ms=time.time() - start_time,
            scan_id=f"stream_{int(time.time())}",
            metadata={
                "total_chunks": len(chunks),
                "chunk_size": chunk_size,
                "overlap": overlap,
                "content_length": len(content)
            }
        )

        processing_time = time.time() - start_time
        self._update_metrics(processing_time)

        return StreamingScanResponse(
            chunk_results=chunk_results,
            overall_result=overall_result,
            total_chunks=len(chunks),
            processing_time_ms=processing_time * 1000,
            request_id=f"stream_{int(time.time())}",
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            version="0.2.0"
        )

    def _create_overlapping_chunks(self, content: str, chunk_size: int, overlap: int) -> List[str]:
        """Create overlapping chunks from content for streaming analysis."""
        if len(content) <= chunk_size:
            return [content]

        chunks = []
        start = 0

        while start < len(content):
            end = min(start + chunk_size, len(content))
            chunk = content[start:end]
            chunks.append(chunk)

            # Move start position with overlap, but ensure progress
            start += chunk_size - overlap
            if start >= end:  # Prevent infinite loop
                break

        return chunks

    async def get_performance_metrics(self) -> PerformanceMetrics:
        """Get current performance and usage metrics.

        Returns:
            PerformanceMetrics object with current statistics
        """
        self.metrics.uptime_seconds = time.time() - self._start_time

        if self.metrics.total_requests > 0:
            self.metrics.average_response_time_ms = (
                self.metrics.total_processing_time_ms / self.metrics.total_requests
            )
            self.metrics.requests_per_second = (
                self.metrics.total_requests / self.metrics.uptime_seconds
            )

        return self.metrics

    async def reset_metrics(self) -> None:
        """Reset performance metrics."""
        self.metrics = PerformanceMetrics()
        self._start_time = time.time()
        self._request_count = 0

    async def apply_security_policy(self, policy: SecurityPolicy) -> None:
        """Apply a custom security policy to the client.

        Args:
            policy: SecurityPolicy configuration to apply
        """
        self.security_policy = policy

    async def get_security_policy(self) -> SecurityPolicy:
        """Get the current security policy.

        Returns:
            Current SecurityPolicy configuration
        """
        return self.security_policy

    def _update_metrics(self, processing_time: float, is_error: bool = False) -> None:
        """Update internal performance metrics."""
        if not self.enable_metrics:
            return

        self.metrics.total_requests += 1
        self.metrics.total_processing_time_ms += processing_time * 1000

        if is_error:
            self.metrics.error_count += 1

    def _update_batch_metrics(self, total_prompts: int, processing_time: float, results_count: int) -> None:
        """Update batch processing metrics."""
        if not self.enable_metrics:
            return

        self.metrics.batch_efficiency = results_count / total_prompts if total_prompts > 0 else 0
        self._update_metrics(processing_time)

    async def get_scan_history(self, limit: int = 50, offset: int = 0, **filters) -> Dict[str, Any]:
        """Get scan history with optional filters asynchronously.

        Args:
            limit: Maximum number of results (default: 50)
            offset: Offset for pagination (default: 0)
            **filters: Additional filters (user_id, threat_level, etc.)

        Returns:
            Dictionary with scan history and pagination info
        """
        params = {"limit": limit, "offset": offset, **filters}
        return await self._make_request("GET", "/v1/scans", params=params)

    async def get_scan_details(self, scan_id: str) -> Dict[str, Any]:
        """Get detailed information about a specific scan asynchronously.

        Args:
            scan_id: The scan ID to retrieve

        Returns:
            Dictionary with scan details
        """
        return await self._make_request("GET", f"/v1/scans/{scan_id}")

    async def health_check(self) -> Dict[str, Any]:
        """Check API health and version information asynchronously.

        Returns:
            Dictionary with health status and version info
        """
        return await self._make_request("GET", "/health")

    async def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        params: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Make an asynchronous HTTP request to the API.

        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint
            data: Request body data
            params: Query parameters

        Returns:
            Parsed JSON response

        Raises:
            Various KoreShieldError subclasses based on response
        """
        url = f"{self.auth_config.base_url}{endpoint}"

        try:
            response = await self.client.request(
                method=method,
                url=url,
                json=data,
                params=params,
            )

            return self._handle_response(response)

        except httpx.TimeoutException:
            raise TimeoutError("Request timed out")
        except httpx.ConnectError:
            raise NetworkError("Network connection failed")
        except httpx.RequestError as e:
            raise NetworkError(f"Request failed: {str(e)}")

    def _handle_response(self, response: httpx.Response) -> Dict[str, Any]:
        """Handle API response and raise appropriate exceptions.

        Args:
            response: The HTTP response object

        Returns:
            Parsed JSON response data

        Raises:
            Various KoreShieldError subclasses
        """
        try:
            data = response.json() if response.content else {}
        except ValueError:
            data = {"message": "Invalid JSON response"}

        if response.status_code == 200:
            return data
        elif response.status_code == 401:
            raise AuthenticationError(
                data.get("message", "Authentication failed"),
                status_code=response.status_code,
                response_data=data,
            )
        elif response.status_code == 400:
            raise ValidationError(
                data.get("message", "Validation failed"),
                status_code=response.status_code,
                response_data=data,
            )
        elif response.status_code == 429:
            raise RateLimitError(
                data.get("message", "Rate limit exceeded"),
                status_code=response.status_code,
                response_data=data,
            )
        elif response.status_code >= 500:
            raise ServerError(
                data.get("message", "Server error"),
                status_code=response.status_code,
                response_data=data,
            )
        else:
            raise KoreShieldError(
                data.get("message", f"Unexpected error: {response.status_code}"),
                status_code=response.status_code,
                response_data=data,
            )