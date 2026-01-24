# KoreShield JavaScript/TypeScript SDK

[![npm version](https://badge.fury.io/js/koreshield-js.svg)](https://badge.fury.io/js/koreshield-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

A comprehensive JavaScript/TypeScript SDK for integrating with [KoreShield](https://koreshield.com) LLM Security Proxy. Provides secure, monitored access to AI models with built-in security features, threat detection, and compliance monitoring.

## Features

- **Security First**: Built-in input sanitization, attack detection, and response filtering
- **Monitoring**: Real-time metrics and security event tracking
- **OpenAI Compatible**: Drop-in replacement for OpenAI SDK
- **Universal**: Works in Node.js, browsers, and edge environments
- **TypeScript**: Full TypeScript support with comprehensive type definitions
- **Configurable**: Fine-grained security controls and monitoring options
- **Production Ready**: Error handling, retries, and connection management

## Installation

```bash
# npm
npm install koreshield

# yarn
yarn add koreshield

# pnpm
pnpm add koreshield
```

## Quick Start

### Node.js

```javascript
import { createClient } from 'koreshield';

const client = createClient({
    baseURL: 'https://your-koreshield-instance.com', // Required
    apiKey: 'your-koreshield-api-key' // Optional, can use KORESHIELD_API_KEY env var
});

// Secure chat completion
const response = await client.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
        { role: 'user', content: 'Hello, how are you?' }
    ]
});

console.log(response.choices[0].message.content);
```

### Browser

```html
<script type="module">
    import { createClient } from './koreshield-js.browser.js';

    const client = createClient({
        baseURL: 'https://your-koreshield-proxy.com'
    });

    // Use the client...
</script>
```

### OpenAI-Compatible API

```javascript
import { createKoreShieldOpenAI } from 'koreshield-js';

const openai = createKoreShieldOpenAI({
    baseURL: 'http://localhost:8000',
    apiKey: 'your-api-key'
});

// Use like regular OpenAI SDK
const chat = await openai.chat({});
const response = await chat.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello!' }]
});
```

## Configuration

### Environment Variables

```bash
KORESHIELD_BASE_URL=http://localhost:8000
KORESHIELD_API_KEY=your-api-key
KORESHIELD_TIMEOUT=30000
KORESHIELD_DEBUG=true
```

### Programmatic Configuration

```typescript
const client = createClient({
    baseURL: 'https://your-proxy.koreshield.com',
    apiKey: 'your-api-key',
    timeout: 30000,
    debug: false,
    headers: {
        'X-Custom-Header': 'value'
    }
});
```

## Security Features

### Input Sanitization

```typescript
import { sanitizeInput, formatMessages } from 'koreshield-js';

// Sanitize individual input
const safeInput = sanitizeInput('<script>alert("xss")</script>Hello!');

// Format and sanitize chat messages
const messages = formatMessages([
    { role: 'user', content: unsafeInput }
]);
```

### Response Safety Checking

```typescript
import { checkResponseSafety } from 'koreshield-js';

const safetyCheck = checkResponseSafety(aiResponse);
if (!safetyCheck.safe) {
    console.log('Issues found:', safetyCheck.issues);
    console.log('Severity:', safetyCheck.severity);
}
```

### Custom Security Options

```typescript
const response = await client.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: messages
}, {
    sensitivity: 'high', // 'low', 'medium', 'high'
    defaultAction: 'block', // 'allow', 'warn', 'block'
    features: {
        sanitization: true,
        detection: true,
        policyEnforcement: true
    }
});
```

## Monitoring & Analytics

### Get Security Metrics

```typescript
const metrics = await client.getMetrics();
console.log({
    totalRequests: metrics.requests_total,
    blockedRequests: metrics.requests_blocked,
    attacksDetected: metrics.attacks_detected,
    avgResponseTime: metrics.avg_response_time,
    activeConnections: metrics.active_connections
});
```

### Security Events

```typescript
// Get recent security events
const events = await client.getSecurityEvents(50, 0, 'attack_detected', 'high');

events.forEach(event => {
    console.log(`${event.type}: ${event.description} (${event.severity})`);
    console.log(`Time: ${new Date(event.timestamp).toLocaleString()}`);
});
```

### Prometheus Metrics

```typescript
const prometheusMetrics = await client.getPrometheusMetrics();
console.log(prometheusMetrics);
```

## Advanced Usage

### Error Handling & Retries

```typescript
import { retry } from 'koreshield-js';

const response = await retry(
    () => client.createChatCompletion(request),
    3, // max retries
    1000 // base delay in ms
);
```

### Custom Error Handling

```typescript
try {
    const response = await client.createChatCompletion(request);
} catch (error) {
    if (error.code === 'SECURITY_VIOLATION') {
        console.log('Security violation detected:', error.details);
    } else if (error.statusCode === 429) {
        console.log('Rate limited, retrying...');
    } else {
        console.error('API Error:', error.message);
    }
}
```

### Connection Testing

```typescript
const isConnected = await client.testConnection();
const health = await client.health();

console.log('Connected:', isConnected);
console.log('Status:', health.status);
console.log('Version:', health.version);
console.log('Uptime:', health.uptime);
```

## API Reference

### KoreShieldClient

Main client class for interacting with KoreShield proxy.

#### Methods

- `createChatCompletion(request, securityOptions?)` - Create chat completion
- `getSecurityEvents(limit?, offset?, type?, severity?)` - Get security events
- `getMetrics()` - Get security metrics
- `getPrometheusMetrics()` - Get Prometheus metrics
- `health()` - Health check
- `updateSecurityConfig(options)` - Update security configuration
- `testConnection()` - Test connection

### Utility Functions

- `validateConfig(config)` - Validate configuration
- `createClient(config?)` - Create client with defaults
- `sanitizeInput(input)` - Sanitize user input
- `checkResponseSafety(response)` - Check response safety
- `formatMessages(messages)` - Format and sanitize messages
- `sleep(ms)` - Sleep utility
- `retry(fn, maxRetries?, baseDelay?)` - Retry with backoff

## Examples

See the `examples/` directory for comprehensive examples:

- `examples/node/basic-usage.js` - Basic Node.js usage
- `examples/node/advanced-usage.ts` - Advanced TypeScript features
- `examples/browser/index.html` - Browser usage with UI

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Development mode
npm run dev

# Generate docs
npm run docs

# Lint
npm run lint
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Building for Different Environments

### Node.js (CommonJS)
```javascript
const { createClient } = require('koreshield-js');
```

### Node.js (ES Modules)
```javascript
import { createClient } from 'koreshield-js';
```

### Browser (UMD)
```html
<script src="https://unpkg.com/koreshield-js@latest/dist/index.umd.js"></script>
<script>
    const client = KoreShield.createClient({ baseURL: '...' });
</script>
```

### Browser (ES Modules)
```html
<script type="module">
    import { createClient } from 'https://unpkg.com/koreshield-js@latest/dist/index.mjs';
</script>
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run the test suite
6. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- [Documentation](https://docs.koreshield.com)
- [Issues](https://github.com/koreshield/koreshield/issues)
- [Discussions](https://github.com/koreshield/koreshield/discussions)
- [Email Support](mailto:support@koreshield.com)

## Security

If you discover a security vulnerability, please email security@koreshield.com instead of creating a public issue.