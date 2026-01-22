#!/usr/bin/env python3
"""
FastAPI integration example for KoreShield Python SDK.

This example demonstrates how to integrate KoreShield security scanning
into a FastAPI application for protecting LLM-based chat endpoints.
"""

import os
import time
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import uvicorn

from koreshield_sdk import KoreShieldClient
from koreshield_sdk.exceptions import KoreShieldError
from koreshield_sdk.types import ThreatLevel


# Pydantic models for API
class ChatRequest(BaseModel):
    """Chat request model."""
    message: str = Field(..., min_length=1, max_length=10000)
    user_id: str = Field(None, max_length=100)
    session_id: str = Field(None, max_length=100)
    context: Dict[str, Any] = Field(default_factory=dict)


class ChatResponse(BaseModel):
    """Chat response model."""
    response: str
    safety_check: Dict[str, Any]
    processing_time_ms: float
    request_id: str


class BatchScanRequest(BaseModel):
    """Batch scan request model."""
    messages: List[str] = Field(..., min_items=1, max_items=100)
    user_id: str = Field(None)


class BatchScanResponse(BaseModel):
    """Batch scan response model."""
    results: List[Dict[str, Any]]
    summary: Dict[str, int]
    processing_time_ms: float


# Global client instance
koreshield_client = None


def get_koreshield_client() -> KoreShieldClient:
    """Get or create KoreShield client instance."""
    global koreshield_client
    if koreshield_client is None:
        api_key = os.getenv("KORESHIELD_API_KEY")
        if not api_key:
            raise RuntimeError("KORESHIELD_API_KEY environment variable not set")
        koreshield_client = KoreShieldClient(api_key=api_key)
    return koreshield_client


# FastAPI app
app = FastAPI(
    title="KoreShield Protected Chat API",
    description="A FastAPI application with KoreShield LLM security protection",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "KoreShield Protected Chat API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        client = get_koreshield_client()
        koreShield_health = client.health_check()
        return {
            "status": "healthy",
            "koreshield": koreShield_health,
            "timestamp": time.time()
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")


@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, background_tasks: BackgroundTasks):
    """Protected chat endpoint with KoreShield scanning."""
    start_time = time.time()

    try:
        client = get_koreshield_client()

        # Scan the user input
        scan_result = client.scan_prompt(
            request.message,
            user_id=request.user_id,
            session_id=request.session_id,
            **request.context
        )

        # Check threat level and decide whether to proceed
        threat_level = scan_result.threat_level
        is_blocked = False

        if threat_level in [ThreatLevel.CRITICAL]:
            # Always block critical threats
            is_blocked = True
        elif threat_level in [ThreatLevel.HIGH]:
            # Block high threats unless explicitly allowed
            is_blocked = True
        elif threat_level in [ThreatLevel.MEDIUM]:
            # Log medium threats but allow
            print(f"⚠️  Medium threat detected: {scan_result.confidence}")
        # Low threats and safe content proceed normally

        if is_blocked:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Unsafe content detected",
                    "threat_level": threat_level.value,
                    "confidence": scan_result.confidence,
                    "message": "Your message contains potentially harmful content and has been blocked."
                }
            )

        # Simulate LLM response (replace with actual LLM call)
        llm_response = generate_mock_response(request.message)

        # Optionally scan the response as well
        response_scan = client.scan_prompt(llm_response)
        if not response_scan.is_safe and response_scan.threat_level in [ThreatLevel.HIGH, ThreatLevel.CRITICAL]:
            # If our response would be unsafe, return a safe alternative
            llm_response = "I'm sorry, but I can't provide that information."

        processing_time = (time.time() - start_time) * 1000

        return ChatResponse(
            response=llm_response,
            safety_check={
                "input_safe": scan_result.is_safe,
                "input_threat_level": scan_result.threat_level.value,
                "input_confidence": scan_result.confidence,
                "response_safe": response_scan.is_safe,
                "response_threat_level": response_scan.threat_level.value,
                "response_confidence": response_scan.confidence,
            },
            processing_time_ms=processing_time,
            request_id=scan_result.scan_id or f"req_{int(time.time())}",
        )

    except KoreShieldError as e:
        raise HTTPException(status_code=503, detail=f"Security service error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/api/scan/batch", response_model=BatchScanResponse)
async def batch_scan_endpoint(request: BatchScanRequest):
    """Batch scanning endpoint."""
    start_time = time.time()

    try:
        client = get_koreshield_client()

        # Scan all messages
        results = client.scan_batch(request.messages)

        # Build response
        response_results = []
        summary = {"safe": 0, "unsafe": 0, "total": len(results)}

        for message, result in zip(request.messages, results):
            response_results.append({
                "message": message,
                "safe": result.is_safe,
                "threat_level": result.threat_level.value,
                "confidence": result.confidence,
                "indicators": len(result.indicators),
            })

            if result.is_safe:
                summary["safe"] += 1
            else:
                summary["unsafe"] += 1

        processing_time = (time.time() - start_time) * 1000

        return BatchScanResponse(
            results=response_results,
            summary=summary,
            processing_time_ms=processing_time,
        )

    except KoreShieldError as e:
        raise HTTPException(status_code=503, detail=f"Security service error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/scans/history")
async def scan_history(limit: int = 50, offset: int = 0, threat_level: str = None):
    """Get scan history."""
    try:
        client = get_koreshield_client()
        filters = {}
        if threat_level:
            filters["threat_level"] = threat_level

        history = client.get_scan_history(limit=limit, offset=offset, **filters)
        return history

    except KoreShieldError as e:
        raise HTTPException(status_code=503, detail=f"Security service error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Custom HTTP exception handler."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "type": "http_exception",
            "timestamp": time.time()
        }
    )


def generate_mock_response(message: str) -> str:
    """Generate a mock LLM response for demonstration."""
    responses = {
        "hello": "Hello! How can I help you today?",
        "how are you": "I'm doing well, thank you for asking! How are you?",
        "what is": "That's an interesting question! Let me explain...",
        "tell me": "I'd be happy to share that information with you.",
        "help": "I'm here to help! What do you need assistance with?",
    }

    message_lower = message.lower()
    for key, response in responses.items():
        if key in message_lower:
            return response

    return f"I understand you're asking about: {message[:50]}... Let me provide a helpful response."


if __name__ == "__main__":
    print("🚀 Starting KoreShield Protected FastAPI Server")
    print("📖 API Documentation: http://localhost:8000/docs")
    print("🔍 Health Check: http://localhost:8000/health")

    uvicorn.run(
        "fastapi_integration:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )