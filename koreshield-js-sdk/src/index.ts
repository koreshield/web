/**
 * KoreShield JavaScript/TypeScript SDK
 *
 * A comprehensive SDK for integrating with KoreShield LLM Security Proxy
 *
 * @packageDocumentation
 */

// Core exports
export { KoreShieldClient } from './core/client';

// Provider wrappers
export { KoreShieldOpenAI, createKoreShieldOpenAI } from './providers/openai';

// Utility functions
export {
  validateConfig,
  createClient,
  sanitizeInput,
  checkResponseSafety,
  formatMessages,
  sleep,
  retry
} from './utils';

// Types
export type {
  KoreShieldConfig,
  SecurityOptions,
  ChatCompletionRequest,
  ChatCompletionResponse,
  SecurityEvent,
  MetricsResponse,
  KoreShieldError,
  ProviderType,
  ProviderConfig
} from './types';

// Default export
export { KoreShieldClient as default } from './core/client';