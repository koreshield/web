import type { ChatCompletionRequest, ChatCompletionResponse, HealthCheckResponse, AttackStats } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.koreshield.com';

class ApiClient {
    private baseUrl: string;
    private apiKey?: string;

    constructor() {
        this.baseUrl = API_BASE_URL;
        this.apiKey = import.meta.env.VITE_API_KEY;
    }

    private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
            ...options.headers,
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Request failed: ${endpoint}`, error);
            throw error;
        }
    }

    async chatCompletion(payload: ChatCompletionRequest): Promise<ChatCompletionResponse> {
        // Check if we should use simulation mode (for demo purposes if no API key)
        if (!this.apiKey && import.meta.env.VITE_USE_SIMULATED_API === 'true') {
            return this.simulateChatCompletion(payload);
        }

        return this.fetch<ChatCompletionResponse>('/v1/chat/completions', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async getHealth(): Promise<HealthCheckResponse> {
        if (!this.apiKey && import.meta.env.VITE_USE_SIMULATED_API === 'true') {
            return this.simulateHealth();
        }
        return this.fetch<HealthCheckResponse>('/health');
    }

    async getStats(): Promise<AttackStats> {
        if (!this.apiKey && import.meta.env.VITE_USE_SIMULATED_API === 'true') {
            return this.simulateStats();
        }
        return this.fetch<AttackStats>('/api/admin/stats');
    }

    // Simulations for pure frontend demos
    private async simulateChatCompletion(payload: ChatCompletionRequest): Promise<ChatCompletionResponse> {
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1000));

        const lastMessage = payload.messages[payload.messages.length - 1].content.toLowerCase();
        const isAttack =
            lastMessage.includes('ignore previous instructions') ||
            lastMessage.includes('drop table') ||
            lastMessage.includes('password') ||
            lastMessage.includes('system prompt');

        if (isAttack) {
            return {
                id: `chatcmpl-${Math.random().toString(36).substring(7)}`,
                object: 'chat.completion',
                created: Date.now(),
                model: payload.model,
                choices: [{
                    index: 0,
                    message: {
                        role: 'assistant',
                        content: "I cannot comply with that request due to security policies."
                    },
                    finish_reason: 'stop'
                }],
                koreshield_blocked: true,
                koreshield_policy_violation: true,
                koreshield_audit_log_id: `log-${Math.random().toString(36).substring(7)}`,
                koreshield_latency_ms: 45
            };
        }

        return {
            id: `chatcmpl-${Math.random().toString(36).substring(7)}`,
            object: 'chat.completion',
            created: Date.now(),
            model: payload.model,
            choices: [{
                index: 0,
                message: {
                    role: 'assistant',
                    content: "This is a simulated response from the Koreshield demo API."
                },
                finish_reason: 'stop'
            }],
            koreshield_blocked: false,
            koreshield_latency_ms: 120
        };
    }

    private async simulateHealth(): Promise<HealthCheckResponse> {
        return {
            status: 'ok',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            services: {
                database: 'up',
                redis: 'up',
                openai_api: 'up',
                anthropic_api: 'up'
            }
        };
    }

    private async simulateStats(): Promise<AttackStats> {
        return {
            total_requests: 10000 + Math.floor(Math.random() * 500),
            blocked_requests: 120 + Math.floor(Math.random() * 10),
            attack_types: {
                'Prompt Injection': 45,
                'Jailbreak': 30,
                'PII Leakage': 15,
                'SQL Injection': 10
            },
            latency_p95: 150,
            active_threats: 2
        };
    }
}

export const api = new ApiClient();
