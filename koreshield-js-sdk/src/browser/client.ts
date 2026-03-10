/**
 * Browser-optimized KoreShield Client
 * 
 * Lightweight version for browser environments with minimal dependencies
 */

import {
  KoreShieldConfig,
  SecurityOptions,
  ChatCompletionRequest,
  ChatCompletionResponse,
  AuditLogResponse,
  AuditLogEntry,
  MetricsResponse,
  KoreShieldError
} from '../types';

export class BrowserKoreShieldClient {
  private config: Required<KoreShieldConfig>;
  private abortController?: AbortController;

  constructor(config: KoreShieldConfig) {
    this.config = {
      baseURL: config.baseURL,
      apiKey: config.apiKey || '',
      timeout: config.timeout || 30000,
      debug: config.debug || false,
      headers: config.headers || {}
    };
  }

  /**
   * Create a chat completion request through KoreShield
   */
  async createChatCompletion(
    request: ChatCompletionRequest,
    securityOptions?: SecurityOptions
  ): Promise<ChatCompletionResponse> {
    const payload = {
      ...request,
      security: securityOptions
    };

    return this.request<ChatCompletionResponse>('/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Stream chat completion with server-sent events
   */
  async *streamChatCompletion(
    request: ChatCompletionRequest,
    securityOptions?: SecurityOptions
  ): AsyncGenerator<ChatCompletionResponse, void, unknown> {
    const payload = {
      ...request,
      stream: true,
      security: securityOptions
    };

    const response = await fetch(`${this.config.baseURL}/v1/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      signal: this.abortController?.signal
    });

    if (!response.ok) {
      throw await this.handleError(response);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            
            try {
              const parsed = JSON.parse(data);
              yield parsed;
            } catch (e) {
              if (this.config.debug) {
                console.error('[KoreShield] Failed to parse SSE data:', e);
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Get security events/logs
   */
  async getAuditLogs(
    limit: number = 100,
    offset: number = 0,
    level?: string
  ): Promise<AuditLogResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });

    if (level) params.append('level', level);

    return this.request<AuditLogResponse>(`/v1/management/logs?${params}`);
  }

  /**
   * Backwards-compatible alias for audit logs
   */
  async getSecurityEvents(
    limit: number = 100,
    offset: number = 0,
    level?: string
  ): Promise<AuditLogEntry[]> {
    const response = await this.getAuditLogs(limit, offset, level);
    return response.logs;
  }

  /**
   * Get metrics and statistics
   */
  async getMetrics(): Promise<MetricsResponse> {
    return this.request<MetricsResponse>('/v1/management/stats');
  }

  /**
   * Health check
   */
  async health(): Promise<{ status: string; version: string; uptime: number }> {
    return this.request('/health');
  }

  /**
   * Cancel ongoing requests
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = undefined;
    }
  }

  /**
   * Generic request method with retry logic
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    this.abortController = new AbortController();
    
    const url = `${this.config.baseURL}${endpoint}`;
    const fetchOptions: RequestInit = {
      ...options,
      headers: this.getHeaders(options.headers as Record<string, string>),
      signal: this.abortController.signal
    };

    // Timeout handling
    const timeoutId = setTimeout(() => {
      this.abortController?.abort();
    }, this.config.timeout);

    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw await this.handleError(response);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout') as KoreShieldError;
        timeoutError.code = 'TIMEOUT';
        timeoutError.statusCode = 408;
        throw timeoutError;
      }
      
      throw error;
    }
  }

  private getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'KoreShield-JS-Browser/0.3.4',
      ...this.config.headers,
      ...customHeaders
    };

    if (this.config.apiKey && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }

  private async handleError(response: Response): Promise<KoreShieldError> {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    const error = new Error(
      errorData.message || `HTTP ${response.status}: ${response.statusText}`
    ) as KoreShieldError;

    error.code = errorData.code || 'HTTP_ERROR';
    error.statusCode = response.status;
    error.details = errorData;

    return error;
  }
}
