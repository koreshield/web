/**
 * Node.js TypeScript Example: Advanced KoreShield Usage
 *
 * This example demonstrates advanced features including error handling,
 * retry logic, and custom security configurations.
 */

import { createClient, retry, checkResponseSafety, formatMessages } from 'koreshield-js';

async function main() {
    console.log('KoreShield TypeScript Example\n');

    // Initialize client with environment variables
    const client = createClient({
        debug: process.env.NODE_ENV === 'development'
    });

    // Test connection with retry
    console.log('Testing connection with retry...');
    const isConnected = await retry(
        () => client.testConnection(),
        3, // max retries
        1000 // base delay
    );

    if (!isConnected) {
        console.error('Cannot connect to KoreShield after retries');
        process.exit(1);
    }
    console.log('Connected successfully\n');

    // Example: Safe message handling
    console.log('Safe Message Processing:');
    const unsafeMessage = 'Hello! <script>alert("xss")</script> How are you?';
    const safeMessages = formatMessages([
        { role: 'user', content: unsafeMessage }
    ]);

    console.log('Original:', unsafeMessage);
    console.log('Sanitized:', safeMessages[0].content);
    console.log();

    // Example: Chat completion with security monitoring
    console.log('Secure Chat Completion:');
    try {
        const response = await client.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: safeMessages,
            temperature: 0.7,
            max_tokens: 100
        }, {
            sensitivity: 'medium',
            features: {
                sanitization: true,
                detection: true
            }
        });

        const content = response.choices[0].message.content;
        console.log('AI Response:', content);

        // Check response safety
        const safetyCheck = checkResponseSafety(content);
        console.log('Safety Check:', safetyCheck.safe ? 'Safe' : 'Issues detected');
        if (!safetyCheck.safe) {
            console.log('Issues:', safetyCheck.issues);
        }
        console.log();
    } catch (error) {
        console.error('Chat completion error:', error);
    }

    // Example: Monitoring and analytics
    console.log('Security Analytics:');
    try {
        const metrics = await client.getMetrics();
        console.log('Current Metrics:');
        console.log(`  - Total Requests: ${metrics.requests_total}`);
        console.log(`  - Blocked Requests: ${metrics.requests_blocked}`);
        console.log(`  - Attacks Detected: ${metrics.attacks_detected}`);
        console.log(`  - Avg Response Time: ${metrics.avg_response_time}ms`);
        console.log(`  - Active Connections: ${metrics.active_connections}`);
        console.log(`  - Uptime: ${Math.floor(metrics.uptime_seconds / 3600)}h ${Math.floor((metrics.uptime_seconds % 3600) / 60)}m`);
        console.log();

        // Get security events
        const events = await client.getSecurityEvents(10, 0, undefined, 'high');
        console.log(`High-severity security events (${events.length}):`);
        events.forEach((event, index) => {
            console.log(`  ${index + 1}. ${event.type}: ${event.description}`);
            console.log(`     Time: ${new Date(event.timestamp).toLocaleString()}`);
        });
    } catch (error) {
        console.error('Metrics error:', error);
    }

    // Example: Configuration management
    console.log('Configuration Management:');
    try {
        // Update security settings
        await client.updateSecurityConfig({
            sensitivity: 'high',
            defaultAction: 'warn',
            features: {
                sanitization: true,
                detection: true,
                policyEnforcement: true
            }
        });
        console.log('Security configuration updated');
    } catch (error) {
        console.error('Configuration error:', error);
    }

    console.log('\nExample completed successfully!');
}

// Error handling
process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});

main().catch((error) => {
    console.error('Main error:', error);
    process.exit(1);
});