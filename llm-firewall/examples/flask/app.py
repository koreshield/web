
import os
from flask import Flask, request, jsonify
from koreshield.client import KoreShieldClient
from functools import wraps

app = Flask(__name__)

# Initialize KoreShield Client
KORESHIELD_URL = os.getenv("KORESHIELD_URL", "http://localhost:8000")
client = KoreShieldClient(base_url=KORESHIELD_URL)

def koreshield_protect(f):
    """
    Decorator to protect Flask routes with KoreShield.
    Expects JSON input with a 'message' or 'prompt' field.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not request.is_json:
            return jsonify({"error": "Content-Type must be application/json"}), 400
            
        data = request.get_json()
        prompt = data.get("message") or data.get("prompt")
        
        if not prompt:
            # If no prompt found, you might want to allow or block depending on policy
            return f(*args, **kwargs)
            
        # Check with KoreShield
        try:
            # Synchronous check (using asyncio.run internally or sync client if available)
            # For simplicity in this example we rely on the client's async guard method
            # In production Flask (sync), you'd use a sync client or run_until_complete
            import asyncio
            guard_result = asyncio.run(client.guard(prompt))
            
            if not guard_result.is_safe:
                return jsonify({
                    "error": "Blocked by KoreShield",
                    "reason": guard_result.reason,
                    "details": guard_result.details
                }), 403
                
        except Exception as e:
            return jsonify({"error": str(e)}), 500

        return f(*args, **kwargs)
    return decorated_function

@app.route("/chat", methods=["POST"])
@koreshield_protect
def chat():
    data = request.get_json()
    return jsonify({
        "response": f"Processed safe message: {data.get('message')}",
        "status": "success"
    })

if __name__ == "__main__":
    app.run(port=8081, debug=True)
