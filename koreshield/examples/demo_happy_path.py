"""
KoreShield Happy-Path Demo
==========================

Exercises the full golden path:

  signup → login → create API key → send allowed chat completion → inspect audit log

Prerequisites:
  - KoreShield running at KORESHIELD_URL (default http://localhost:8000)
  - A real or test database configured
  - JWT_SECRET / JWT_ISSUER / JWT_AUDIENCE env vars set

Run:
  python examples/demo_happy_path.py
"""

import os
import sys
import json
import uuid
import requests

KORESHIELD_URL = os.getenv("KORESHIELD_URL", "http://localhost:8000")
BASE = KORESHIELD_URL.rstrip("/")

DEMO_EMAIL = f"demo-{uuid.uuid4().hex[:8]}@example.com"
DEMO_PASSWORD = "Demo-Password-12345!"
DEMO_NAME = "Happy Path Demo User"

DIVIDER = "─" * 60


def _pretty(obj):
    return json.dumps(obj, indent=2)


def _check(step: str, r: requests.Response, expected: int):
    if r.status_code != expected:
        print(f"\n✗  {step} failed — HTTP {r.status_code}")
        try:
            print(_pretty(r.json()))
        except Exception:
            print(r.text)
        sys.exit(1)
    print(f"✓  {step} — HTTP {r.status_code}")
    return r.json()


# ── Step 1: Health check ────────────────────────────────────────────────────

print(DIVIDER)
print("KoreShield Happy-Path Demo")
print(DIVIDER)

r = requests.get(f"{BASE}/health")
data = _check("Health check", r, 200)
print(f"   status={data.get('status')}  version={data.get('version')}")

# ── Step 2: Signup ──────────────────────────────────────────────────────────

print()
r = requests.post(f"{BASE}/v1/management/signup", json={
    "email": DEMO_EMAIL,
    "password": DEMO_PASSWORD,
    "name": DEMO_NAME,
})
data = _check("Signup", r, 201)
user_id = data["user"]["id"]
print(f"   user_id={user_id}  email={data['user']['email']}")

# ── Step 3: Login ───────────────────────────────────────────────────────────

print()
r = requests.post(f"{BASE}/v1/management/login", json={
    "email": DEMO_EMAIL,
    "password": DEMO_PASSWORD,
})
data = _check("Login", r, 200)
jwt_token = data["token"]
role = data["user"]["role"]
print(f"   role={role}  token_prefix={jwt_token[:20]}…")

AUTH = {"Authorization": f"Bearer {jwt_token}"}

# ── Step 4: Create API key ──────────────────────────────────────────────────

print()
r = requests.post(f"{BASE}/v1/management/api-keys", json={
    "name": "happy-path-demo-key",
    "description": "Created by demo_happy_path.py",
}, headers=AUTH)
data = _check("Create API key", r, 201)
api_key = data.get("key") or data.get("api_key") or data.get("full_key")
key_id = data.get("id") or data.get("key_id")
print(f"   key_id={key_id}  key_prefix={str(api_key)[:12]}…")

X_API_KEY = {"X-API-Key": api_key}

# ── Step 5: Scan an allowed prompt ─────────────────────────────────────────

print()
r = requests.post(f"{BASE}/v1/scan", json={
    "prompt": "What is the capital of France?",
}, headers=X_API_KEY)
data = _check("Scan allowed prompt", r, 200)
print(f"   is_safe={data.get('is_safe')}  threat_level={data.get('threat_level')}")

# ── Step 6: Send a chat completion ─────────────────────────────────────────

print()
r = requests.post(f"{BASE}/v1/chat/completions", json={
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "What is the capital of France?"}],
}, headers=X_API_KEY)
# 200 if a real upstream is configured; 502 if upstream unavailable — both are valid for demo
if r.status_code in (200, 502, 503):
    print(f"✓  Chat completion — HTTP {r.status_code} (upstream may not be configured in dev)")
else:
    data = _check("Chat completion", r, 200)
    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    print(f"   response_prefix={content[:60]!r}…")

# ── Step 7: Inspect audit logs ─────────────────────────────────────────────

print()
r = requests.get(f"{BASE}/v1/management/logs?limit=5", headers=AUTH)
# Logs require admin; a freshly signed-up user is "user" role, so 403 is expected
if r.status_code == 403:
    print("✓  Audit log access — HTTP 403 (user role cannot read admin logs — correct)")
elif r.status_code == 200:
    data = _check("Audit logs", r, 200)
    entries = data.get("logs") or data.get("entries") or []
    print(f"   log_count={len(entries)}")
    for e in entries[:3]:
        msg = e.get("message") or e.get("event") or str(e)
        print(f"   · {e.get('level','?')} — {msg[:80]}")
else:
    _check("Audit logs", r, 200)

# ── Step 8: Revoke API key ──────────────────────────────────────────────────

print()
r = requests.delete(f"{BASE}/v1/management/api-keys/{key_id}", headers=AUTH)
if r.status_code in (200, 204):
    print(f"✓  Revoke API key — HTTP {r.status_code}")
else:
    print(f"!  Revoke API key — HTTP {r.status_code} (non-fatal)")

# ── Done ────────────────────────────────────────────────────────────────────

print()
print(DIVIDER)
print("Happy path complete. All core platform steps executed successfully.")
print(DIVIDER)
