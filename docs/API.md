# API Reference

## Endpoints

### Health Check

**GET** `/health`

Check if the KoreShield is running.

**Response:**
```json
{
  "status": "healthy",
  "version": "0.1.0"
}
```

### Chat Completions (OpenAI Compatible)

**POST** `/v1/chat/completions`

Proxy endpoint for OpenAI chat completions with security checks.

**Request Body:**
```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {"role": "user", "content": "Your message here"}
  ],
  "temperature": 0.7,
  "max_tokens": 100
}
```

**Success Response (200):**
Returns the OpenAI API response directly.

**Blocked Response (403):**
```json
{
  "error": {
    "message": "Request blocked: Potential prompt injection detected",
    "type": "security_error",
    "code": "prompt_injection_blocked",
    "request_id": "uuid-here"
  }
}
```

**Error Responses:**
- `400`: Bad Request (invalid JSON, missing fields)
- `500`: Internal Server Error
- `503`: Provider Unavailable

## Security Features

The KoreShield automatically:
1. **Sanitizes** all user prompts for injection patterns
2. **Detects** attack attempts using heuristics
3. **Evaluates** requests against security policies
4. **Blocks** malicious requests before they reach the LLM
5. **Logs** all requests, attacks, and blocks

## Configuration

See [Configuration Guide](configuration.md) for details on configuring security policies, sensitivity levels, and provider settings.

