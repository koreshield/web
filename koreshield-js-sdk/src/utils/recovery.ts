/**
 * Error Recovery and Retry Logic
 */

export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Initial delay in milliseconds */
  initialDelay?: number;
  /** Maximum delay in milliseconds */
  maxDelay?: number;
  /** Multiplier for exponential backoff */
  backoffMultiplier?: number;
  /** Status codes that should trigger a retry */
  retryableStatusCodes?: number[];
  /** Custom function to determine if an error is retryable */
  isRetryable?: (error: any) => boolean;
  /** Callback for retry attempts */
  onRetry?: (attempt: number, error: any) => void;
}

export interface CircuitBreakerOptions {
  /** Threshold for consecutive failures before opening circuit */
  failureThreshold?: number;
  /** Time in milliseconds to wait before attempting to close circuit */
  resetTimeout?: number;
  /** Time in milliseconds for request timeout */
  timeout?: number;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  isRetryable: (error) => true,
  onRetry: () => {}
};

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;
  let delay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if we should retry
      const shouldRetry = 
        attempt < opts.maxRetries &&
        opts.isRetryable(error) &&
        (error.statusCode 
          ? opts.retryableStatusCodes.includes(error.statusCode)
          : true);

      if (!shouldRetry) {
        throw error;
      }

      // Call retry callback
      opts.onRetry(attempt + 1, error);

      // Wait before retrying
      await sleep(delay);

      // Exponential backoff with jitter
      delay = Math.min(
        delay * opts.backoffMultiplier + Math.random() * 1000,
        opts.maxDelay
      );
    }
  }

  throw lastError;
}

/**
 * Circuit breaker pattern implementation
 */
export class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private nextAttempt = Date.now();
  private options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions = {}) {
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      resetTimeout: options.resetTimeout || 60000,
      timeout: options.timeout || 30000
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is open');
      }
      this.state = 'half-open';
    }

    try {
      const result = await this.executeWithTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Circuit breaker timeout')), this.options.timeout)
      )
    ]);
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= 2) {
        this.state = 'closed';
        this.successCount = 0;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.successCount = 0;

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = 'open';
      this.nextAttempt = Date.now() + this.options.resetTimeout;
    }
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }

  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
  }
}

/**
 * Fallback handler for multiple providers/endpoints
 */
export class FallbackHandler<T> {
  private providers: Array<() => Promise<T>>;
  private currentIndex = 0;

  constructor(providers: Array<() => Promise<T>>) {
    if (providers.length === 0) {
      throw new Error('At least one provider must be specified');
    }
    this.providers = providers;
  }

  async execute(): Promise<T> {
    const errors: Error[] = [];

    for (let i = 0; i < this.providers.length; i++) {
      const providerIndex = (this.currentIndex + i) % this.providers.length;
      const provider = this.providers[providerIndex];

      try {
        const result = await provider();
        // Update current index to successful provider
        this.currentIndex = providerIndex;
        return result;
      } catch (error) {
        errors.push(error as Error);
      }
    }

    // All providers failed
    const combinedError = new Error(
      `All providers failed: ${errors.map(e => e.message).join(', ')}`
    );
    (combinedError as any).errors = errors;
    throw combinedError;
  }

  reset(): void {
    this.currentIndex = 0;
  }
}

/**
 * Rate limiter for client-side request throttling
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per second

  constructor(maxTokens: number, refillRate: number) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
  }

  async acquire(tokens: number = 1): Promise<void> {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return;
    }

    // Wait until enough tokens are available
    const tokensNeeded = tokens - this.tokens;
    const waitTime = (tokensNeeded / this.refillRate) * 1000;
    await sleep(waitTime);

    this.refill();
    this.tokens -= tokens;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }

  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }
}

/**
 * Helper function for sleeping
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Batch request handler with concurrency control
 */
export class BatchHandler<T, R> {
  private readonly batchSize: number;
  private readonly concurrency: number;

  constructor(batchSize: number = 10, concurrency: number = 5) {
    this.batchSize = batchSize;
    this.concurrency = concurrency;
  }

  async execute(
    items: T[],
    handler: (item: T) => Promise<R>
  ): Promise<R[]> {
    const results: R[] = [];
    const batches: T[][] = [];

    // Create batches
    for (let i = 0; i < items.length; i += this.batchSize) {
      batches.push(items.slice(i, i + this.batchSize));
    }

    // Process batches with concurrency control
    for (let i = 0; i < batches.length; i += this.concurrency) {
      const batchPromises = batches
        .slice(i, i + this.concurrency)
        .map(batch => Promise.all(batch.map(handler)));

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.flat());
    }

    return results;
  }
}
