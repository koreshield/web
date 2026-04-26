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
    status: string;
    version: string;
}

export interface AttackStats {
    status: string;
    version: string;
    statistics: {
        requests_total: number;
        requests_allowed: number;
        requests_blocked: number;
        attacks_detected: number;
        errors: number;
    };
    providers: Record<string, {
        configured: boolean;
        priority: number;
        type: string | null;
    }>;
    total_providers: number;
}
