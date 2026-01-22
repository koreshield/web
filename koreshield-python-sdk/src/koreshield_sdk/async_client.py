"""Asynchronous KoreShield client."""

import asyncio
import time
from typing import Dict, List, Optional, Any, Union
import httpx

from .types import (
    AuthConfig,
    ScanRequest,
    ScanResponse,
    BatchScanRequest,
    BatchScanResponse,
    DetectionResult,
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
    """Asynchronous KoreShield API client."""

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.koreshield.com",
        timeout: float = 30.0,
        retry_attempts: int = 3,
        retry_delay: float = 1.0,
    ):
        """Initialize the async KoreShield client.

        Args:
            api_key: Your KoreShield API key
            base_url: Base URL for the API (default: production)
            timeout: Request timeout in seconds
            retry_attempts: Number of retry attempts
            retry_delay: Delay between retries in seconds
        """
        self.auth_config = AuthConfig(
            api_key=api_key,
            base_url=base_url.rstrip("/"),
            timeout=timeout,
            retry_attempts=retry_attempts,
            retry_delay=retry_delay,
        )

        self.client = httpx.AsyncClient(
            timeout=timeout,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": f"koreshield-python-sdk/0.1.0",
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
        """Scan a single prompt for security threats asynchronously.

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
        request = ScanRequest(prompt=prompt, **kwargs)

        for attempt in range(self.auth_config.retry_attempts + 1):
            try:
                response = await self._make_request("POST", "/v1/scan", request.dict())
                scan_response = ScanResponse(**response)
                return scan_response.result
            except (RateLimitError, ServerError, NetworkError) as e:
                if attempt == self.auth_config.retry_attempts:
                    raise e
                await asyncio.sleep(self.auth_config.retry_delay * (2 ** attempt))

    async def scan_batch(
        self,
        prompts: List[str],
        parallel: bool = True,
        max_concurrent: int = 10,
        **kwargs
    ) -> List[DetectionResult]:
        """Scan multiple prompts for security threats asynchronously.

        Args:
            prompts: List of prompt texts to scan
            parallel: Whether to process in parallel (default: True)
            max_concurrent: Maximum concurrent requests (default: 10)
            **kwargs: Additional context for all requests

        Returns:
            List of DetectionResult objects
        """
        if not parallel:
            # Sequential processing
            results = []
            for prompt in prompts:
                result = await self.scan_prompt(prompt, **kwargs)
                results.append(result)
            return results

        # Parallel processing with semaphore for concurrency control
        semaphore = asyncio.Semaphore(max_concurrent)

        async def scan_with_semaphore(prompt: str) -> DetectionResult:
            async with semaphore:
                return await self.scan_prompt(prompt, **kwargs)

        tasks = [scan_with_semaphore(prompt) for prompt in prompts]
        return await asyncio.gather(*tasks)

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