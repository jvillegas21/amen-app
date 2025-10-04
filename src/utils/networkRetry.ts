/**
 * Network Retry Utility
 * Provides robust retry logic with exponential backoff for network requests
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableStatuses?: number[];
  shouldRetry?: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  shouldRetry: () => true,
  onRetry: () => {},
};

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate delay with exponential backoff
 */
const calculateDelay = (
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number => {
  const delay = initialDelay * Math.pow(multiplier, attempt - 1);
  return Math.min(delay, maxDelay);
};

/**
 * Check if error is retryable
 */
const isRetryableError = (error: any, retryableStatuses: number[]): boolean => {
  // Network errors
  if (error?.message?.includes('Network request failed')) return true;
  if (error?.message?.includes('Failed to fetch')) return true;
  if (error?.message?.includes('timeout')) return true;
  if (error?.name === 'NetworkError') return true;
  if (error?.name === 'TimeoutError') return true;

  // HTTP status codes
  if (error?.status && retryableStatuses.includes(error.status)) return true;
  if (error?.response?.status && retryableStatuses.includes(error.response.status)) return true;

  // Supabase specific errors
  if (error?.code === 'PGRST301') return true; // JWT expired
  if (error?.code === 'PGRST001') return true; // Connection error

  return false;
};

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted attempts
      if (attempt > opts.maxRetries) {
        console.error(`❌ Request failed after ${opts.maxRetries} retries:`, error);
        throw error;
      }

      // Check if error is retryable
      const shouldRetryError = isRetryableError(error, opts.retryableStatuses);
      const customShouldRetry = opts.shouldRetry(error, attempt);

      if (!shouldRetryError || !customShouldRetry) {
        console.error('❌ Non-retryable error:', error);
        throw error;
      }

      // Calculate delay and wait
      const delay = calculateDelay(
        attempt,
        opts.initialDelay,
        opts.maxDelay,
        opts.backoffMultiplier
      );

      console.warn(
        `⚠️ Request failed (attempt ${attempt}/${opts.maxRetries + 1}), retrying in ${delay}ms...`,
        error?.message || error
      );

      opts.onRetry(error, attempt);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Create a fetch wrapper with retry logic
 */
export function createRetryableFetch(options: RetryOptions = {}) {
  return async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    return withRetry(async () => {
      const response = await fetch(url, init);

      // Check if response status is retryable
      if (
        !response.ok &&
        options.retryableStatuses?.includes(response.status)
      ) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    }, options);
  };
}

/**
 * Retry wrapper for async functions with logging
 */
export async function retryAsync<T>(
  name: string,
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  console.log(`🔄 Starting: ${name}`);

  try {
    const result = await withRetry(fn, {
      ...options,
      onRetry: (error, attempt) => {
        console.warn(`🔄 Retrying ${name} (attempt ${attempt}):`, error?.message);
        options.onRetry?.(error, attempt);
      },
    });

    console.log(`✅ Success: ${name}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed: ${name}`, error);
    throw error;
  }
}

/**
 * Batch retry multiple requests with individual retry logic
 */
export async function retryBatch<T>(
  requests: Array<{ name: string; fn: () => Promise<T> }>,
  options: RetryOptions = {}
): Promise<T[]> {
  return Promise.all(
    requests.map(({ name, fn }) => retryAsync(name, fn, options))
  );
}
