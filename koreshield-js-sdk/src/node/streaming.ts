/**
 * Node.js Streaming Support for KoreShield
 */

import { Readable, Transform } from 'stream';
import axios, { AxiosInstance } from 'axios';
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  SecurityOptions,
  KoreShieldConfig
} from '../types';

export interface StreamOptions {
  /** Callback for each chunk received */
  onChunk?: (chunk: ChatCompletionResponse) => void;
  /** Callback for stream completion */
  onComplete?: () => void;
  /** Callback for errors */
  onError?: (error: Error) => void;
}

export class StreamingClient {
  private client: AxiosInstance;
  private config: Required<KoreShieldConfig>;

  constructor(config: KoreShieldConfig) {
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
        'User-Agent': 'KoreShield-JS-Node/0.3.2',
        ...this.config.headers
      }
    });

    if (this.config.apiKey) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.config.apiKey}`;
    }
  }

  /**
   * Stream chat completion as a Node.js Readable stream
   */
  async streamChatCompletion(
    request: ChatCompletionRequest,
    securityOptions?: SecurityOptions
  ): Promise<Readable> {
    const payload = {
      ...request,
      stream: true,
      security: securityOptions
    };

    const response = await this.client.post('/v1/chat/completions', payload, {
      responseType: 'stream'
    });

    return response.data;
  }

  /**
   * Stream with event handlers
   */
  async streamWithHandlers(
    request: ChatCompletionRequest,
    options: StreamOptions,
    securityOptions?: SecurityOptions
  ): Promise<void> {
    const stream = await this.streamChatCompletion(request, securityOptions);
    
    let buffer = '';

    stream.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            options.onComplete?.();
            return;
          }

          try {
            const parsed = JSON.parse(data);
            options.onChunk?.(parsed);
          } catch (e) {
            if (this.config.debug) {
              console.error('[KoreShield] Failed to parse SSE data:', e);
            }
          }
        }
      }
    });

    stream.on('error', (error: Error) => {
      options.onError?.(error);
    });

    stream.on('end', () => {
      options.onComplete?.();
    });
  }

  /**
   * Create a transform stream for processing chunks
   */
  createTransformStream<T = ChatCompletionResponse>(
    transformer: (chunk: ChatCompletionResponse) => T
  ): Transform {
    let buffer = '';

    return new Transform({
      objectMode: true,
      transform(chunk: Buffer, encoding: string, callback: Function) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              callback();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const transformed = transformer(parsed);
              this.push(transformed);
            } catch (e) {
              callback(e as Error);
              return;
            }
          }
        }

        callback();
      }
    });
  }

  /**
   * Async iterator for streaming
   */
  async *streamAsyncIterator(
    request: ChatCompletionRequest,
    securityOptions?: SecurityOptions
  ): AsyncGenerator<ChatCompletionResponse, void, unknown> {
    const stream = await this.streamChatCompletion(request, securityOptions);
    
    let buffer = '';

    for await (const chunk of stream) {
      buffer += chunk.toString();
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
  }
}
