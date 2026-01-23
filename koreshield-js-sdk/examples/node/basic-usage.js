/**
 * Node.js Example: Basic Chat Completion with KoreShield
 *
 * This example demonstrates how to use KoreShield to securely proxy
 * OpenAI API calls with built-in security features.
 */

import { createClient, KoreShieldOpenAI } from 'koreshield-js';

async function main() {
  // Initialize KoreShield client
  const client = createClient({
    baseURL: 'http://localhost:8000', // Your KoreShield proxy URL
    apiKey: process.env.KORESHIELD_API_KEY,
    debug: true
  });

  // Test connection
  console.log('Testing KoreShield connection...');
  const isConnected = await client.testConnection();
  if (!isConnected) {
    console.error('❌ Cannot connect to KoreShield proxy');
    process.exit(1);
  }
  console.log('✅ Connected to KoreShield');

  // Example 1: Basic chat completion
  console.log('\n📝 Example 1: Basic Chat Completion');
  try {
    const response = await client.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello! How are you today?' }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    console.log('Response:', response.choices[0].message.content);
  } catch (error) {
    console.error('Error:', error);
  }

  // Example 2: Using OpenAI-compatible wrapper
  console.log('\n🤖 Example 2: OpenAI-Compatible API');
  try {
    const openai = new KoreShieldOpenAI({
      baseURL: 'http://localhost:8000',
      apiKey: process.env.KORESHIELD_API_KEY
    });

    const chat = await openai.chat({});
    const response = await chat.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: 'What is KoreShield?' }
      ]
    });

    console.log('Response:', response.choices[0].message.content);
  } catch (error) {
    console.error('Error:', error);
  }

  // Example 3: Security monitoring
  console.log('\n🛡️ Example 3: Security Monitoring');
  try {
    const metrics = await client.getMetrics();
    console.log('Security Metrics:', {
      totalRequests: metrics.requests_total,
      blockedRequests: metrics.requests_blocked,
      attacksDetected: metrics.attacks_detected,
      avgResponseTime: `${metrics.avg_response_time}ms`
    });

    // Get recent security events
    const events = await client.getSecurityEvents(5);
    console.log(`Recent security events: ${events.length}`);
    events.forEach(event => {
      console.log(`- ${event.type}: ${event.description} (${event.severity})`);
    });
  } catch (error) {
    console.error('Error:', error);
  }

  // Example 4: Custom security options
  console.log('\n⚙️ Example 4: Custom Security Options');
  try {
    const response = await client.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: 'Tell me about cybersecurity best practices.' }
      ]
    }, {
      sensitivity: 'high',
      defaultAction: 'block',
      features: {
        sanitization: true,
        detection: true,
        policyEnforcement: true
      }
    });

    console.log('Response:', response.choices[0].message.content);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

main().catch(console.error);