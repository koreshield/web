
import os
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from koreshield.client import KoreShieldClient

# Initialize FastAPI app
app = FastAPI(title="KoreShield FastAPI Example")

# Initialize KoreShield Client (connects to KoreShield Proxy)
# Ensure KORESHIELD_URL is set (default: http://localhost:8000)
KORESHIELD_URL = os.getenv("KORESHIELD_URL", "http://localhost:8000")
client = KoreShieldClient(base_url=KORESHIELD_URL)

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Example chat endpoint protected by KoreShield.
    """
    try:
        # Step 1: Guard the input using KoreShield
        # This checks for prompt injection, PII, etc.
        guard_result = await client.guard(request.message)
        
        if not guard_result.is_safe:
            raise HTTPException(
                status_code=403, 
                detail=f"Blocked by KoreShield: {guard_result.reason}"
            )
            
        # Step 2: (Simulated) Process the safe prompt with LLM
        # In a real app, you would call OpenAI/Anthropic here
        return {
            "response": f"Processed safe message: {request.message}",
            "koreshield_analysis": guard_result.details
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
