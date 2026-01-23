/**
 * KoreShield Utility Functions
 */

import { KoreShieldClient } from '../core/client';
import { KoreShieldConfig } from '../types';

/**
 * Validate KoreShield configuration
 */
export function validateConfig(config: KoreShieldConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.baseURL) {
    errors.push('baseURL is required');
  } else {
    try {
      new URL(config.baseURL);
    } catch {
      errors.push('baseURL must be a valid URL');
    }
  }

  if (config.timeout && (config.timeout < 1000 || config.timeout > 300000)) {
    errors.push('timeout must be between 1000 and 300000 milliseconds');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create a KoreShield client with environment variable defaults
 */
export function createClient(config: Partial<KoreShieldConfig> = {}): KoreShieldClient {
  const baseURL = process.env.KORESHIELD_BASE_URL || config.baseURL;
  if (!baseURL) {
    throw new Error('baseURL is required. Set KORESHIELD_BASE_URL environment variable or pass baseURL in config.');
  }

  const defaultConfig: KoreShieldConfig = {
    baseURL,
    apiKey: process.env.KORESHIELD_API_KEY || config.apiKey,
    timeout: parseInt(process.env.KORESHIELD_TIMEOUT || '30000'),
    debug: process.env.KORESHIELD_DEBUG === 'true' || config.debug || false,
    ...config
  };

  const validation = validateConfig(defaultConfig);
  if (!validation.valid) {
    throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
  }

  return new KoreShieldClient(defaultConfig);
}

/**
 * Sanitize user input for safe LLM processing
 */
export function sanitizeInput(input: string): string {
  // Basic sanitization - remove potentially harmful patterns
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[SCRIPT REMOVED]')
    .replace(/javascript:/gi, '[JAVASCRIPT REMOVED]')
    .replace(/on\w+\s*=/gi, '[EVENT REMOVED]')
    .trim();
}

/**
 * Check if a response contains potentially unsafe content
 */
export function checkResponseSafety(response: string): {
  safe: boolean;
  issues: string[];
  severity: 'low' | 'medium' | 'high';
} {
  const issues: string[] = [];
  let severity: 'low' | 'medium' | 'high' = 'low';

  // Check for code injection patterns
  if (/<script/i.test(response)) {
    issues.push('Contains script tags');
    severity = 'high';
  }

  // Check for system prompt leakage
  if (/system prompt|you are an ai|as an ai assistant/i.test(response)) {
    issues.push('Potential system prompt leakage');
    severity = 'medium';
  }

  // Check for harmful instructions
  if (/how to|step by step|step \d+|instructions? for/i.test(response) &&
      /hack|exploit|attack|malware|virus/i.test(response)) {
    issues.push('Contains potentially harmful instructions');
    severity = 'high';
  }

  return {
    safe: issues.length === 0,
    issues,
    severity
  };
}

/**
 * Format chat messages for KoreShield
 */
export function formatMessages(messages: Array<{ role: string; content: string }>) {
  return messages.map(msg => ({
    role: msg.role,
    content: sanitizeInput(msg.content)
  }));
}

/**
 * Sleep utility for rate limiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry utility with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        break;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  throw lastError!;
}