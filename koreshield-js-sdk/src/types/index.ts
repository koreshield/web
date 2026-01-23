/**
 * KoreShield JavaScript/TypeScript SDK Types
 */

export interface KoreShieldConfig {
  /** KoreShield proxy base URL */
  baseURL: string;
  /** API key for authentication (optional, can be set via environment) */
  apiKey?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom headers to include in all requests */
  headers?: Record<string, string>;
}

export interface SecurityOptions {
  /** Sensitivity level: 'low', 'medium', 'high' */
  sensitivity?: 'low' | 'medium' | 'high';
  /** Action on detection: 'allow', 'warn', 'block' */
  defaultAction?: 'allow' | 'warn' | 'block';
  /** Enable/disable specific security features */
  features?: {
    sanitization?: boolean;
    detection?: boolean;
    policyEnforcement?: boolean;
  };
}

export interface ChatCompletionRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
  stream?: boolean;
  [key: string]: any;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: 'attack_detected' | 'request_blocked' | 'sanitization_applied';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details?: Record<string, any>;
  requestId?: string;
}

export interface MetricsResponse {
  requests_total: number;
  requests_blocked: number;
  attacks_detected: number;
  avg_response_time: number;
  active_connections: number;
  uptime_seconds: number;
}

export interface KoreShieldError extends Error {
  code: string;
  statusCode?: number;
  details?: Record<string, any>;
}

export type ProviderType = 'openai' | 'anthropic' | 'deepseek' | 'gemini' | 'azure';

export interface ProviderConfig {
  type: ProviderType;
  apiKey?: string;
  baseURL?: string;
  organization?: string;
  project?: string;
}