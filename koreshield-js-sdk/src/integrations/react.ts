/**
 * React Hooks for KoreShield
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { KoreShieldClient } from '../core/client';
import {
  KoreShieldConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
  SecurityOptions,
  SecurityEvent,
  MetricsResponse
} from '../types';

export interface UseKoreShieldOptions {
  config: KoreShieldConfig;
  autoConnect?: boolean;
}

export interface UseKoreShieldReturn {
  client: KoreShieldClient | null;
  isConnected: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

/**
 * Main hook for KoreShield client
 */
export function useKoreShield(options: UseKoreShieldOptions): UseKoreShieldReturn {
  const [client, setClient] = useState<KoreShieldClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const connect = useCallback(async () => {
    try {
      const newClient = new KoreShieldClient(options.config);
      const health = await newClient.health();
      
      if (health.status === 'ok') {
        setClient(newClient);
        setIsConnected(true);
        setError(null);
      }
    } catch (err) {
      setError(err as Error);
      setIsConnected(false);
    }
  }, [options.config]);

  const disconnect = useCallback(() => {
    setClient(null);
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (options.autoConnect !== false) {
      connect();
    }
  }, [options.autoConnect, connect]);

  return {
    client,
    isConnected,
    error,
    connect,
    disconnect
  };
}

/**
 * Hook for chat completions
 */
export interface UseChatCompletionOptions {
  client: KoreShieldClient | null;
  request?: ChatCompletionRequest;
  securityOptions?: SecurityOptions;
  autoExecute?: boolean;
}

export interface UseChatCompletionReturn {
  response: ChatCompletionResponse | null;
  isLoading: boolean;
  error: Error | null;
  execute: (req?: ChatCompletionRequest) => Promise<void>;
  reset: () => void;
}

export function useChatCompletion(options: UseChatCompletionOptions): UseChatCompletionReturn {
  const [response, setResponse] = useState<ChatCompletionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (req?: ChatCompletionRequest) => {
    if (!options.client) {
      setError(new Error('KoreShield client not initialized'));
      return;
    }

    const request = req || options.request;
    if (!request) {
      setError(new Error('No request provided'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await options.client.createChatCompletion(
        request,
        options.securityOptions
      );
      setResponse(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [options.client, options.request, options.securityOptions]);

  const reset = useCallback(() => {
    setResponse(null);
    setError(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (options.autoExecute && options.request) {
      execute();
    }
  }, [options.autoExecute, options.request, execute]);

  return {
    response,
    isLoading,
    error,
    execute,
    reset
  };
}

/**
 * Hook for streaming chat completions
 */
export interface UseStreamingChatOptions {
  client: KoreShieldClient | null;
  request?: ChatCompletionRequest;
  securityOptions?: SecurityOptions;
}

export interface UseStreamingChatReturn {
  chunks: ChatCompletionResponse[];
  isStreaming: boolean;
  error: Error | null;
  start: (req?: ChatCompletionRequest) => Promise<void>;
  stop: () => void;
  reset: () => void;
}

export function useStreamingChat(options: UseStreamingChatOptions): UseStreamingChatReturn {
  const [chunks, setChunks] = useState<ChatCompletionResponse[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const start = useCallback(async (req?: ChatCompletionRequest) => {
    if (!options.client) {
      setError(new Error('KoreShield client not initialized'));
      return;
    }

    const request = req || options.request;
    if (!request) {
      setError(new Error('No request provided'));
      return;
    }

    setIsStreaming(true);
    setError(null);
    setChunks([]);
    abortControllerRef.current = new AbortController();

    try {
      // Note: Streaming requires browser client implementation
      // This is a placeholder for the streaming logic
      const response = await options.client.createChatCompletion(
        { ...request, stream: true },
        options.securityOptions
      );
      
      setChunks((prev: ChatCompletionResponse[]) => [...prev, response]);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [options.client, options.request, options.securityOptions]);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    setChunks([]);
    setError(null);
    setIsStreaming(false);
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    chunks,
    isStreaming,
    error,
    start,
    stop,
    reset
  };
}

/**
 * Hook for security events
 */
export interface UseSecurityEventsOptions {
  client: KoreShieldClient | null;
  limit?: number;
  autoFetch?: boolean;
  refreshInterval?: number;
}

export interface UseSecurityEventsReturn {
  events: SecurityEvent[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useSecurityEvents(options: UseSecurityEventsOptions): UseSecurityEventsReturn {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!options.client) {
      setError(new Error('KoreShield client not initialized'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await options.client.getSecurityEvents(options.limit || 50);
      setEvents(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [options.client, options.limit]);

  useEffect(() => {
    if (options.autoFetch !== false) {
      refresh();
    }

    if (options.refreshInterval) {
      const interval = setInterval(refresh, options.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [options.autoFetch, options.refreshInterval, refresh]);

  return {
    events,
    isLoading,
    error,
    refresh
  };
}

/**
 * Hook for metrics
 */
export interface UseMetricsOptions {
  client: KoreShieldClient | null;
  autoFetch?: boolean;
  refreshInterval?: number;
}

export interface UseMetricsReturn {
  metrics: MetricsResponse | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useMetrics(options: UseMetricsOptions): UseMetricsReturn {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!options.client) {
      setError(new Error('KoreShield client not initialized'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await options.client.getMetrics();
      setMetrics(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [options.client]);

  useEffect(() => {
    if (options.autoFetch !== false) {
      refresh();
    }

    if (options.refreshInterval) {
      const interval = setInterval(refresh, options.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [options.autoFetch, options.refreshInterval, refresh]);

  return {
    metrics,
    isLoading,
    error,
    refresh
  };
}
