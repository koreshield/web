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

export type SensitivityLevel = 'low' | 'medium' | 'high';
export type SecurityAction = 'allow' | 'warn' | 'block';

export interface SecurityFeatures {
  sanitization?: boolean;
  detection?: boolean;
  policyEnforcement?: boolean;
  rateLimiting?: boolean;
  anomalyDetection?: boolean;
}

export interface SecurityOptions {
  /** Sensitivity level: 'low', 'medium', 'high' */
  sensitivity?: SensitivityLevel;
  /** Action on detection: 'allow', 'warn', 'block' */
  defaultAction?: SecurityAction;
  /** Enable/disable specific security features */
  features?: SecurityFeatures;
  /** Custom security rules */
  customRules?: Array<{
    name: string;
    pattern: string;
    action: SecurityAction;
  }>;
}

export type ChatMessageRole = 'system' | 'user' | 'assistant' | 'function' | 'tool';

export interface ChatMessage {
  role: ChatMessageRole;
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
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
  object: 'chat.completion' | 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: 'stop' | 'length' | 'function_call' | 'content_filter' | 'null' | null;
    delta?: Partial<ChatMessage>; // For streaming
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