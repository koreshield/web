/**
 * TypeScript types for KoreShield API
 */

// Base API Response
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
}

export interface APIError {
  message: string;
  code: number;
  details?: any;
}

// Chat Completions (OpenAI-compatible)
export interface ChatCompletionRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  user?: string;
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  security?: {
    threat_detected: boolean;
    threat_type: string | null;
    confidence: number;
    patterns_matched: string[];
    action_taken: 'allowed' | 'blocked' | 'warned';
  };
}

// Health Check
export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  components: {
    database: ComponentHealth;
    redis: ComponentHealth;
    detection_engine: ComponentHealth;
    policy_engine: ComponentHealth;
  };
}

export interface ComponentHealth {
  status: 'operational' | 'degraded' | 'down';
  latency_ms?: number;
  error?: string;
}

// Metrics
export interface MetricsResponse {
  total_requests: number;
  threats_blocked: number;
  threats_warned: number;
  avg_latency_ms: number;
  uptime_percentage: number;
  requests_per_second: number;
  threat_types: Record<string, number>;
}

// Admin Stats
export interface AdminStatsResponse {
  overview: {
    total_requests: number;
    threats_blocked: number;
    threats_warned: number;
    uptime_percentage: number;
  };
  last_24h: {
    requests: number;
    threats: number;
    avg_latency_ms: number;
  };
  threat_breakdown: Record<string, number>;
  top_patterns: Array<{
    pattern: string;
    count: number;
  }>;
}

// Recent Attacks
export interface AdminAttacksResponse {
  attacks: Array<{
    id: string;
    timestamp: string;
    threat_type: string;
    confidence: number;
    content_preview: string;
    action_taken: 'blocked' | 'warned';
    user_id?: string;
    metadata?: Record<string, any>;
  }>;
  total: number;
}

// Provider Health
export interface ProviderHealthResponse {
  providers: {
    openai: ProviderStatus;
    anthropic: ProviderStatus;
    gemini: ProviderStatus;
    deepseek: ProviderStatus;
    azure: ProviderStatus;
  };
  overall_status: 'operational' | 'degraded' | 'down';
}

export interface ProviderStatus {
  status: 'operational' | 'degraded' | 'down';
  latency_ms: number;
  last_check: string;
  error_rate: number;
}
