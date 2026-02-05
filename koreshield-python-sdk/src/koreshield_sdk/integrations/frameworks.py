"""Framework-specific integration helpers for KoreShield SDK."""

from typing import Dict, List, Optional, Any, Callable, Union
from functools import wraps
import asyncio
import time

from ..async_client import AsyncKoreShieldClient
from ..types import DetectionResult, SecurityPolicy, ThreatLevel
from ..exceptions import KoreShieldError


class FastAPIIntegration:
    """FastAPI integration helper for KoreShield security middleware."""

    def __init__(
        self,
        client: AsyncKoreShieldClient,
        scan_request_body: bool = True,
        scan_response_body: bool = False,
        threat_threshold: ThreatLevel = ThreatLevel.MEDIUM,
        block_on_threat: bool = False,
        exclude_paths: Optional[List[str]] = None,
        custom_scanner: Optional[Callable] = None,
    ):
        """Initialize FastAPI integration.

        Args:
            client: AsyncKoreShieldClient instance
            scan_request_body: Whether to scan request bodies
            scan_response_body: Whether to scan response bodies
            threat_threshold: Minimum threat level to flag
            block_on_threat: Whether to block requests with threats
            exclude_paths: List of paths to exclude from scanning
            custom_scanner: Custom scanning function
        """
        self.client = client
        self.scan_request_body = scan_request_body
        self.scan_response_body = scan_response_body
        self.threat_threshold = threat_threshold
        self.block_on_threat = block_on_threat
        self.exclude_paths = exclude_paths or ["/health", "/docs", "/openapi.json"]
        self.custom_scanner = custom_scanner

    def create_middleware(self):
        """Create FastAPI middleware for automatic security scanning."""
        from fastapi import Request, Response, HTTPException
        from fastapi.responses import JSONResponse
        import json

        async def koreshield_middleware(request: Request, call_next):
            # Skip excluded paths
            if request.url.path in self.exclude_paths:
                return await call_next(request)

            scan_results = []

            # Scan request body
            if self.scan_request_body and request.method in ["POST", "PUT", "PATCH"]:
                try:
                    body = await request.body()
                    if body:
                        # Try to parse as JSON for better scanning
                        try:
                            json_body = json.loads(body.decode())
                            # Extract text content from common fields
                            text_content = self._extract_text_from_request(json_body)
                            if text_content:
                                result = await self.client.scan_prompt(text_content)
                                scan_results.append(("request", result))
                        except (json.JSONDecodeError, UnicodeDecodeError):
                            # If not JSON, scan raw content
                            if len(body) < 10000:  # Limit scan size
                                result = await self.client.scan_prompt(body.decode(errors='ignore'))
                                scan_results.append(("request", result))
                except Exception as e:
                    # Log error but don't block request
                    print(f"KoreShield request scan error: {e}")

            # Check for threats in request
            for scan_type, result in scan_results:
                if not result.is_safe and self._is_above_threshold(result):
                    if self.block_on_threat:
                        return JSONResponse(
                            status_code=403,
                            content={
                                "error": "Security threat detected",
                                "threat_level": result.threat_level.value,
                                "confidence": result.confidence,
                                "scan_type": scan_type
                            }
                        )
                    else:
                        # Add security headers
                        request.state.koreshield_threat = result

            # Process response
            response = await call_next(request)

            # Scan response body if enabled
            if self.scan_response_body and hasattr(response, 'body'):
                try:
                    # This would need to be implemented based on response type
                    pass
                except Exception as e:
                    print(f"KoreShield response scan error: {e}")

            # Add security headers
            response.headers["X-KoreShield-Scanned"] = "true"
            if scan_results:
                threat_levels = [r.threat_level.value for _, r in scan_results]
                response.headers["X-KoreShield-Threat-Levels"] = ",".join(threat_levels)

            return response

        return koreshield_middleware

    def _extract_text_from_request(self, data: Any) -> str:
        """Extract text content from request data."""
        if isinstance(data, str):
            return data
        elif isinstance(data, dict):
            # Common text fields in APIs
            text_fields = ['prompt', 'message', 'content', 'text', 'query', 'input']
            texts = []
            for field in text_fields:
                if field in data and isinstance(data[field], str):
                    texts.append(data[field])
            return " ".join(texts)
        elif isinstance(data, list):
            return " ".join(str(item) for item in data if isinstance(item, str))
        return ""

    def _is_above_threshold(self, result: DetectionResult) -> bool:
        """Check if detection result is above threat threshold."""
        levels = [ThreatLevel.SAFE, ThreatLevel.LOW, ThreatLevel.MEDIUM, ThreatLevel.HIGH, ThreatLevel.CRITICAL]
        result_level_index = levels.index(result.threat_level)
        threshold_index = levels.index(self.threat_threshold)
        return result_level_index >= threshold_index


class FlaskIntegration:
    """Flask integration helper for KoreShield security middleware."""

    def __init__(
        self,
        client: AsyncKoreShieldClient,
        scan_request_body: bool = True,
        threat_threshold: ThreatLevel = ThreatLevel.MEDIUM,
        block_on_threat: bool = False,
        exclude_paths: Optional[List[str]] = None,
    ):
        """Initialize Flask integration.

        Args:
            client: AsyncKoreShieldClient instance
            scan_request_body: Whether to scan request bodies
            threat_threshold: Minimum threat level to flag
            block_on_threat: Whether to block requests with threats
            exclude_paths: List of paths to exclude from scanning
        """
        self.client = client
        self.scan_request_body = scan_request_body
        self.threat_threshold = threat_threshold
        self.block_on_threat = block_on_threat
        self.exclude_paths = exclude_paths or ["/health", "/static"]

    def create_middleware(self):
        """Create Flask middleware for automatic security scanning."""
        from flask import request, jsonify, g
        import json

        def koreshield_middleware():
            # Skip excluded paths
            if request.path in self.exclude_paths:
                return None

            # Only scan POST/PUT/PATCH requests with bodies
            if request.method not in ["POST", "PUT", "PATCH"] or not request.is_json:
                return None

            try:
                data = request.get_json()
                text_content = self._extract_text_from_request(data)

                if text_content:
                    # Use asyncio to run async scan in sync context
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    try:
                        result = loop.run_until_complete(self.client.scan_prompt(text_content))
                        g.koreshield_result = result

                        if not result.is_safe and self._is_above_threshold(result):
                            if self.block_on_threat:
                                return jsonify({
                                    "error": "Security threat detected",
                                    "threat_level": result.threat_level.value,
                                    "confidence": result.confidence
                                }), 403
                    finally:
                        loop.close()

            except Exception as e:
                # Log error but don't block
                print(f"KoreShield middleware error: {e}")

            return None

        return koreshield_middleware

    def _extract_text_from_request(self, data: Any) -> str:
        """Extract text content from request data."""
        if isinstance(data, str):
            return data
        elif isinstance(data, dict):
            text_fields = ['prompt', 'message', 'content', 'text', 'query', 'input']
            texts = []
            for field in text_fields:
                if field in data and isinstance(data[field], str):
                    texts.append(data[field])
            return " ".join(texts)
        elif isinstance(data, list):
            return " ".join(str(item) for item in data if isinstance(item, str))
        return ""

    def _is_above_threshold(self, result: DetectionResult) -> bool:
        """Check if detection result is above threat threshold."""
        levels = [ThreatLevel.SAFE, ThreatLevel.LOW, ThreatLevel.MEDIUM, ThreatLevel.HIGH, ThreatLevel.CRITICAL]
        result_level_index = levels.index(result.threat_level)
        threshold_index = levels.index(self.threat_threshold)
        return result_level_index >= threshold_index


class DjangoIntegration:
    """Django integration helper for KoreShield security middleware."""

    def __init__(
        self,
        client: AsyncKoreShieldClient,
        scan_request_body: bool = True,
        threat_threshold: ThreatLevel = ThreatLevel.MEDIUM,
        block_on_threat: bool = False,
        exclude_paths: Optional[List[str]] = None,
    ):
        """Initialize Django integration.

        Args:
            client: AsyncKoreShieldClient instance
            scan_request_body: Whether to scan request bodies
            threat_threshold: Minimum threat level to flag
            block_on_threat: Whether to block requests with threats
            exclude_paths: List of paths to exclude from scanning
        """
        self.client = client
        self.scan_request_body = scan_request_body
        self.threat_threshold = threat_threshold
        self.block_on_threat = block_on_threat
        self.exclude_paths = exclude_paths or ["/admin", "/static", "/media"]

    def create_middleware(self):
        """Create Django middleware for automatic security scanning."""
        from django.http import JsonResponse
        from django.core.exceptions import MiddlewareNotUsed
        import json
        import asyncio

        class KoreShieldMiddleware:
            def __init__(self, get_response):
                self.get_response = get_response

            def __call__(self, request):
                # Skip excluded paths
                if request.path in self.exclude_paths:
                    return self.get_response(request)

                # Only scan POST/PUT/PATCH requests
                if request.method not in ["POST", "PUT", "PATCH"]:
                    return self.get_response(request)

                # Scan request body
                if self.scan_request_body:
                    try:
                        if request.content_type == 'application/json':
                            data = json.loads(request.body.decode())
                            text_content = self._extract_text_from_request(data)

                            if text_content:
                                # Run async scan in sync context
                                loop = asyncio.new_event_loop()
                                asyncio.set_event_loop(loop)
                                try:
                                    result = loop.run_until_complete(self.client.scan_prompt(text_content))

                                    if not result.is_safe and self._is_above_threshold(result):
                                        if self.block_on_threat:
                                            return JsonResponse({
                                                "error": "Security threat detected",
                                                "threat_level": result.threat_level.value,
                                                "confidence": result.confidence
                                            }, status=403)
                                        else:
                                            # Store result for later use
                                            request.koreshield_result = result
                                finally:
                                    loop.close()

                    except Exception as e:
                        print(f"KoreShield middleware error: {e}")

                response = self.get_response(request)

                # Add security headers
                response["X-KoreShield-Scanned"] = "true"
                if hasattr(request, 'koreshield_result'):
                    response["X-KoreShield-Threat-Level"] = request.koreshield_result.threat_level.value

                return response

        return KoreShieldMiddleware

    def _extract_text_from_request(self, data: Any) -> str:
        """Extract text content from request data."""
        if isinstance(data, str):
            return data
        elif isinstance(data, dict):
            text_fields = ['prompt', 'message', 'content', 'text', 'query', 'input']
            texts = []
            for field in text_fields:
                if field in data and isinstance(data[field], str):
                    texts.append(data[field])
            return " ".join(texts)
        elif isinstance(data, list):
            return " ".join(str(item) for item in data if isinstance(item, str))
        return ""

    def _is_above_threshold(self, result: DetectionResult) -> bool:
        """Check if detection result is above threat threshold."""
        levels = [ThreatLevel.SAFE, ThreatLevel.LOW, ThreatLevel.MEDIUM, ThreatLevel.HIGH, ThreatLevel.CRITICAL]
        result_level_index = levels.index(result.threat_level)
        threshold_index = levels.index(self.threat_threshold)
        return result_level_index >= threshold_index


# Convenience functions for quick setup
def create_fastapi_middleware(client: AsyncKoreShieldClient, **kwargs):
    """Create FastAPI middleware for KoreShield."""
    integration = FastAPIIntegration(client, **kwargs)
    return integration.create_middleware()


def create_flask_middleware(client: AsyncKoreShieldClient, **kwargs):
    """Create Flask middleware for KoreShield."""
    integration = FlaskIntegration(client, **kwargs)
    return integration.create_middleware()


def create_django_middleware(client: AsyncKoreShieldClient, **kwargs):
    """Create Django middleware for KoreShield."""
    integration = DjangoIntegration(client, **kwargs)
    return integration.create_middleware()