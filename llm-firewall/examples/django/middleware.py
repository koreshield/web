
import asyncio
import json
from django.http import JsonResponse
from django.conf import settings
from koreshield.client import KoreShieldClient

class KoreShieldMiddleware:
    """
    Django Middleware to protect views from malicious LLM prompts.
    
    Configuration in settings.py:
    KORESHIELD_URL = "http://localhost:8000"
    KORESHIELD_PROTECTED_PATHS = ["/api/chat", "/api/generate"]
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.client = KoreShieldClient(
            base_url=getattr(settings, "KORESHIELD_URL", "http://localhost:8000")
        )
        self.protected_paths = getattr(settings, "KORESHIELD_PROTECTED_PATHS", [])

    def __call__(self, request):
        if request.path in self.protected_paths and request.method == "POST":
            # Check body for prompt
            try:
                body = json.loads(request.body)
                prompt = body.get("message") or body.get("prompt")
                
                if prompt:
                    # Run async check in sync middleware
                    # Note: In async Django views, you would use an AsyncMiddleware
                    is_safe = asyncio.run(self._check_safety(prompt))
                    
                    if not is_safe["is_safe"]:
                        return JsonResponse({
                            "error": "Blocked by KoreShield",
                            "reason": is_safe["reason"],
                            "details": is_safe["details"]
                        }, status=403)
                        
            except Exception as e:
                # Log error but maybe allow fail-open or fail-closed based on policy
                pass

        response = self.get_response(request)
        return response

    async def _check_safety(self, prompt):
        result = await self.client.guard(prompt)
        return {
            "is_safe": result.is_safe,
            "reason": result.reason,
            "details": result.details
        }
