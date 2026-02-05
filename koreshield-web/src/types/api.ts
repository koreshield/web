export interface ChatCompletionRequest {
    model: string;
    messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>;
    stream?: boolean;
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
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    // KoreShield specific fields
    koreshield_audit_log_id?: string;
    koreshield_policy_violation?: boolean;
    koreshield_blocked?: boolean;
    koreshield_latency_ms?: number;
}

export interface HealthCheckResponse {
    status: 'ok' | 'error' | 'maintenance';
    version: string;
    timestamp: string;
    services: {
        database: 'up' | 'down';
        redis: 'up' | 'down';
        openai_api: 'up' | 'down';
        anthropic_api: 'up' | 'down';
    };
}

export interface AttackStats {
    total_requests: number;
    blocked_requests: number;
    attack_types: Record<string, number>;
    latency_p95: number;
    active_threats: number;
}
