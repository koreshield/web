# Error Codes and Standardized Responses

This document outlines the standardized error codes and response formats used by KoreShield.

## Error Response Format

All API errors follow a consistent JSON structure:

```json
{
  "error": {
    "message": "Human-readable error description",
    "type": "error_category",
    "code": "ERROR_CODE",
    "request_id": "uuid4-request-identifier",
    "details": {
      "additional_context": "optional additional information"
    }
  }
}
```

## Error Categories

### Authentication Errors (4xx)

| Code | HTTP Status | Description | Example |
|------|-------------|-------------|---------|
| `INVALID_CREDENTIALS` | 401 | Invalid username/password or API key | Login failures |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required permissions | Admin-only endpoints |
| `TOKEN_EXPIRED` | 401 | JWT token has expired | Session timeout |
| `TOKEN_INVALID` | 401 | JWT token is malformed or invalid | Corrupted tokens |

### Request Validation Errors (4xx)

| Code | HTTP Status | Description | Example |
|------|-------------|-------------|---------|
| `INVALID_JSON` | 400 | Request body is not valid JSON | Malformed JSON |
| `MISSING_REQUIRED_FIELD` | 400 | Required field is missing | Empty messages array |
| `INVALID_FIELD_FORMAT` | 400 | Field has wrong type/format | Non-array messages |
| `INVALID_PARAMETER_VALUE` | 400 | Parameter value is invalid | Invalid sensitivity level |

### Security Errors (4xx)

| Code | HTTP Status | Description | Example |
|------|-------------|-------------|---------|
| `PROMPT_INJECTION_BLOCKED` | 403 | Request blocked due to security policy | Injection attempts |
| `CONTENT_VIOLATION` | 403 | Content violates security rules | Harmful content |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests in time window | API abuse |
| `IP_BLOCKED` | 403 | IP address is blocked | Blacklisted IPs |

### Service Errors (5xx)

| Code | HTTP Status | Description | Example |
|------|-------------|-------------|---------|
| `PROVIDER_UNAVAILABLE` | 503 | LLM provider is down/unreachable | OpenAI outage |
| `PROVIDER_ERROR` | 502 | LLM provider returned an error | API key issues |
| `INTERNAL_ERROR` | 500 | Unexpected server error | Code exceptions |
| `SERVICE_OVERLOADED` | 503 | Server is overloaded | High traffic |

### Configuration Errors (5xx)

| Code | HTTP Status | Description | Example |
|------|-------------|-------------|---------|
| `CONFIG_NOT_AVAILABLE` | 500 | Configuration is not loaded | Missing config file |
| `PROVIDER_NOT_CONFIGURED` | 500 | No LLM providers configured | Missing API keys |
| `FEATURE_DISABLED` | 501 | Requested feature is disabled | Experimental features |

## Error Code Reference

### Chat Completions API

#### Request Validation
- `INVALID_JSON`: Request body is not valid JSON
- `MISSING_MESSAGES`: The `messages` field is required
- `INVALID_MESSAGES_FORMAT`: Messages must be a non-empty array
- `INVALID_MESSAGE_FORMAT`: Each message must have required fields

#### Security Blocking
- `PROMPT_INJECTION_BLOCKED`: Request blocked due to prompt injection detection
- `CONTENT_POLICY_VIOLATION`: Content violates configured policies
- `SANITIZATION_FAILED`: Content sanitization failed

#### Provider Errors
- `PROVIDER_UNAVAILABLE`: No healthy LLM providers available
- `PROVIDER_TIMEOUT`: Provider request timed out
- `PROVIDER_RATE_LIMITED`: Provider returned rate limit error

### Management API

#### Authentication
- `INVALID_CREDENTIALS`: Invalid email/password combination
- `INSUFFICIENT_PERMISSIONS`: User lacks admin privileges
- `SESSION_EXPIRED`: Admin session has expired

#### Configuration
- `INVALID_CONFIG_VALUE`: Configuration value is invalid
- `CONFIG_UPDATE_FAILED`: Configuration update failed
- `UNSUPPORTED_CONFIG`: Configuration option not supported

#### Policy Management
- `POLICY_NOT_FOUND`: Requested policy does not exist
- `POLICY_ALREADY_EXISTS`: Policy ID already in use
- `INVALID_POLICY_FORMAT`: Policy format is invalid

## Error Handling Best Practices

### Client-Side Error Handling

```javascript
try {
  const response = await client.createChatCompletion(request);
} catch (error) {
  switch (error.code) {
    case 'PROMPT_INJECTION_BLOCKED':
      // Handle security blocking
      showSecurityWarning(error.message);
      break;
    case 'RATE_LIMIT_EXCEEDED':
      // Handle rate limiting
      await delay(error.retryAfter);
      retryRequest();
      break;
    case 'PROVIDER_UNAVAILABLE':
      // Handle provider issues
      showProviderError();
      break;
    default:
      // Handle other errors
      showGenericError(error.message);
  }
}
```

### Server-Side Error Handling

```python
from fastapi import HTTPException

def handle_security_error(reason: str, request_id: str):
    return JSONResponse(
        status_code=403,
        content={
            "error": {
                "message": f"Request blocked: {reason}",
                "type": "security_error",
                "code": "PROMPT_INJECTION_BLOCKED",
                "request_id": request_id,
            }
        }
    )
```

## Monitoring and Alerting

Error codes are tracked in metrics and can trigger alerts:

- `PROMPT_INJECTION_BLOCKED`: High frequency may indicate attack
- `PROVIDER_UNAVAILABLE`: May require provider failover
- `RATE_LIMIT_EXCEEDED`: May indicate abuse or misconfiguration
- `INTERNAL_ERROR`: Requires immediate investigation

## Localization

Error messages are currently in English. Future versions may support:

- Message localization (i18n)
- Error code constants for programmatic handling
- Custom error message templates

## Version History

- **v0.1.0**: Initial error code standardization
- **Future**: Enhanced error details and internationalization