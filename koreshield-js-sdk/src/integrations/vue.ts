/**
 * Vue 3 Composables for KoreShield
 */

import { ref, computed, onMounted, onUnmounted, watch, Ref } from 'vue';
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

/**
 * Main composable for KoreShield client
 */
export function useKoreShield(options: UseKoreShieldOptions) {
  const client = ref<KoreShieldClient | null>(null);
  const isConnected = ref(false);
  const error = ref<Error | null>(null);

  const connect = async () => {
    try {
      const newClient = new KoreShieldClient(options.config);
      const health = await newClient.health();
      
      if (health.status === 'ok') {
        client.value = newClient;
        isConnected.value = true;
        error.value = null;
      }
    } catch (err) {
      error.value = err as Error;
      isConnected.value = false;
    }
  };

  const disconnect = () => {
    client.value = null;
    isConnected.value = false;
  };

  onMounted(() => {
    if (options.autoConnect !== false) {
      connect();
    }
  });

  return {
    client,
    isConnected,
    error,
    connect,
    disconnect
  };
}

/**
 * Composable for chat completions
 */
export interface UseChatCompletionOptions {
  client: Ref<KoreShieldClient | null>;
  request?: ChatCompletionRequest;
  securityOptions?: SecurityOptions;
  autoExecute?: boolean;
}

export function useChatCompletion(options: UseChatCompletionOptions) {
  const response = ref<ChatCompletionResponse | null>(null);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  const execute = async (req?: ChatCompletionRequest) => {
    if (!options.client.value) {
      error.value = new Error('KoreShield client not initialized');
      return;
    }

    const request = req || options.request;
    if (!request) {
      error.value = new Error('No request provided');
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const result = await options.client.value.createChatCompletion(
        request,
        options.securityOptions
      );
      response.value = result;
    } catch (err) {
      error.value = err as Error;
    } finally {
      isLoading.value = false;
    }
  };

  const reset = () => {
    response.value = null;
    error.value = null;
    isLoading.value = false;
  };

  watch(
    () => options.request,
    (newRequest: ChatCompletionRequest | undefined) => {
      if (options.autoExecute && newRequest) {
        execute();
      }
    },
    { immediate: options.autoExecute }
  );

  return {
    response,
    isLoading,
    error,
    execute,
    reset
  };
}

/**
 * Composable for streaming chat completions
 */
export interface UseStreamingChatOptions {
  client: Ref<KoreShieldClient | null>;
  request?: ChatCompletionRequest;
  securityOptions?: SecurityOptions;
}

export function useStreamingChat(options: UseStreamingChatOptions) {
  const chunks = ref<ChatCompletionResponse[]>([]);
  const isStreaming = ref(false);
  const error = ref<Error | null>(null);
  let abortController: AbortController | null = null;

  const start = async (req?: ChatCompletionRequest) => {
    if (!options.client.value) {
      error.value = new Error('KoreShield client not initialized');
      return;
    }

    const request = req || options.request;
    if (!request) {
      error.value = new Error('No request provided');
      return;
    }

    isStreaming.value = true;
    error.value = null;
    chunks.value = [];
    abortController = new AbortController();

    try {
      const response = await options.client.value.createChatCompletion(
        { ...request, stream: true },
        options.securityOptions
      );
      
      chunks.value.push(response);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        error.value = err;
      }
    } finally {
      isStreaming.value = false;
      abortController = null;
    }
  };

  const stop = () => {
    if (abortController) {
      abortController.abort();
    }
    isStreaming.value = false;
  };

  const reset = () => {
    chunks.value = [];
    error.value = null;
    isStreaming.value = false;
  };

  onUnmounted(() => {
    if (abortController) {
      abortController.abort();
    }
  });

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
 * Composable for security events
 */
export interface UseSecurityEventsOptions {
  client: Ref<KoreShieldClient | null>;
  limit?: number;
  autoFetch?: boolean;
  refreshInterval?: number;
}

export function useSecurityEvents(options: UseSecurityEventsOptions) {
  const events = ref<SecurityEvent[]>([]);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  let intervalId: NodeJS.Timeout | null = null;

  const refresh = async () => {
    if (!options.client.value) {
      error.value = new Error('KoreShield client not initialized');
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const data = await options.client.value.getSecurityEvents(options.limit || 50);
      events.value = data;
    } catch (err) {
      error.value = err as Error;
    } finally {
      isLoading.value = false;
    }
  };

  onMounted(() => {
    if (options.autoFetch !== false) {
      refresh();
    }

    if (options.refreshInterval) {
      intervalId = setInterval(refresh, options.refreshInterval);
    }
  });

  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });

  return {
    events,
    isLoading,
    error,
    refresh
  };
}

/**
 * Composable for metrics
 */
export interface UseMetricsOptions {
  client: Ref<KoreShieldClient | null>;
  autoFetch?: boolean;
  refreshInterval?: number;
}

export function useMetrics(options: UseMetricsOptions) {
  const metrics = ref<MetricsResponse | null>(null);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  let intervalId: NodeJS.Timeout | null = null;

  const refresh = async () => {
    if (!options.client.value) {
      error.value = new Error('KoreShield client not initialized');
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const data = await options.client.value.getMetrics();
      metrics.value = data;
    } catch (err) {
      error.value = err as Error;
    } finally {
      isLoading.value = false;
    }
  };

  onMounted(() => {
    if (options.autoFetch !== false) {
      refresh();
    }

    if (options.refreshInterval) {
      intervalId = setInterval(refresh, options.refreshInterval);
    }
  });

  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });

  return {
    metrics,
    isLoading,
    error,
    refresh
  };
}
