/**
 * KoreShield Core Client
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  KoreShieldConfig,
  SecurityOptions,
  ChatCompletionRequest,
  ChatCompletionResponse,
  SecurityEvent,
  MetricsResponse,
  KoreShieldError
} from '../types';
import { validateConfig } from '../utils';

export class KoreShieldClient {
  private client: AxiosInstance;
  private config: Required<KoreShieldConfig>;

  constructor(config: KoreShieldConfig) {
    const validation = validateConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    this.config = {
      baseURL: config.baseURL,
      apiKey: config.apiKey || process.env.KORESHIELD_API_KEY || '',
      timeout: config.timeout || 30000,
      debug: config.debug || false,
      headers: config.headers || {}
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'KoreShield-JS/0.1.0',
        ...this.config.headers
      }
    });

    // Add API key to requests if provided
    if (this.config.apiKey) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    // Add request/response interceptors for debugging
    if (this.config.debug) {
      this.client.interceptors.request.use(
        (config) => {
          console.log('[KoreShield] Request:', config.method?.toUpperCase(), config.url);
          return config;
        },
        (error) => {
          console.error('[KoreShield] Request Error:', error);
          return Promise.reject(error);
        }
      );

      this.client.interceptors.response.use(
        (response) => {
          console.log('[KoreShield] Response:', response.status, response.config.url);
          return response;
        },
        (error) => {
          console.error('[KoreShield] Response Error:', error.response?.status, error.response?.data);
          return Promise.reject(error);
        }
      );
    }
  }

  /**
   * Create a chat completion request through KoreShield
   */
  async createChatCompletion(
    request: ChatCompletionRequest,
    securityOptions?: SecurityOptions
  ): Promise<ChatCompletionResponse> {
    try {
      const payload = {
        ...request,
        security: securityOptions
      };

      const response: AxiosResponse<ChatCompletionResponse> = await this.client.post(
        '/v1/chat/completions',
        payload
      );

      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get security events/logs
   */
  async getSecurityEvents(
    limit: number = 50,
    offset: number = 0,
    type?: string,
    severity?: string
  ): Promise<SecurityEvent[]> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      });

      if (type) params.append('type', type);
      if (severity) params.append('severity', severity);

      const response: AxiosResponse<SecurityEvent[]> = await this.client.get(
        `/api/security/events?${params}`
      );

      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get metrics and statistics
   */
  async getMetrics(): Promise<MetricsResponse> {
    try {
      const response: AxiosResponse<MetricsResponse> = await this.client.get('/api/metrics');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Prometheus metrics in text format
   */
  async getPrometheusMetrics(): Promise<string> {
    try {
      const response: AxiosResponse<string> = await this.client.get('/metrics', {
        headers: { 'Accept': 'text/plain' }
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Health check
   */
  async health(): Promise<{ status: string; version: string; uptime: number }> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Update security configuration
   */
  async updateSecurityConfig(options: SecurityOptions): Promise<void> {
    try {
      await this.client.put('/api/config/security', options);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Test connection to KoreShield
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.health();
      return true;
    } catch {
      return false;
    }
  }

  private handleError(error: any): KoreShieldError {
    const koreShieldError: KoreShieldError = new Error(
      error.response?.data?.message || error.message || 'Unknown error'
    ) as KoreShieldError;

    koreShieldError.code = error.response?.data?.code || 'UNKNOWN_ERROR';
    koreShieldError.statusCode = error.response?.status;
    koreShieldError.details = error.response?.data;

    return koreShieldError;
  }
}