/**
 * Network Request Queue Manager
 * Prevents overwhelming the network stack with concurrent requests
 */

interface QueuedRequest<T> {
  id: string;
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  priority: number;
  timestamp: number;
}

export interface QueueOptions {
  maxConcurrent?: number;
  timeout?: number;
  priorityEnabled?: boolean;
}

const DEFAULT_OPTIONS: Required<QueueOptions> = {
  maxConcurrent: 6, // Browser default is 6
  timeout: 30000, // 30 seconds
  priorityEnabled: true,
};

export class NetworkQueue {
  private queue: QueuedRequest<any>[] = [];
  private activeRequests = 0;
  private options: Required<QueueOptions>;
  private requestCounter = 0;

  constructor(options: QueueOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Add a request to the queue
   */
  async enqueue<T>(
    fn: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const id = `req-${++this.requestCounter}`;
      const request: QueuedRequest<T> = {
        id,
        fn,
        resolve,
        reject,
        priority,
        timestamp: Date.now(),
      };

      this.queue.push(request);

      // Sort by priority (higher first) then timestamp (older first)
      if (this.options.priorityEnabled) {
        this.queue.sort((a, b) => {
          if (a.priority !== b.priority) {
            return b.priority - a.priority;
          }
          return a.timestamp - b.timestamp;
        });
      }

      this.processQueue();
    });
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    while (
      this.queue.length > 0 &&
      this.activeRequests < this.options.maxConcurrent
    ) {
      const request = this.queue.shift();
      if (!request) break;

      this.activeRequests++;

      this.executeRequest(request)
        .finally(() => {
          this.activeRequests--;
          this.processQueue();
        });
    }
  }

  /**
   * Execute a single request with timeout
   */
  private async executeRequest<T>(request: QueuedRequest<T>): Promise<void> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Request ${request.id} timed out after ${this.options.timeout}ms`)),
        this.options.timeout
      )
    );

    try {
      const result = await Promise.race([
        request.fn(),
        timeoutPromise,
      ]);

      request.resolve(result);
    } catch (error) {
      request.reject(error);
    }
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.queue.forEach(request => {
      request.reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    queued: number;
    active: number;
    total: number;
  } {
    return {
      queued: this.queue.length,
      active: this.activeRequests,
      total: this.queue.length + this.activeRequests,
    };
  }
}

// Global singleton instance
let globalQueue: NetworkQueue | null = null;

/**
 * Get or create global network queue
 */
export function getNetworkQueue(options?: QueueOptions): NetworkQueue {
  if (!globalQueue) {
    globalQueue = new NetworkQueue(options);
  }
  return globalQueue;
}

/**
 * Queue a network request with the global queue
 */
export async function queueRequest<T>(
  fn: () => Promise<T>,
  priority: number = 0
): Promise<T> {
  const queue = getNetworkQueue();
  return queue.enqueue(fn, priority);
}

/**
 * High priority request (authentication, critical data)
 */
export async function queueHighPriority<T>(fn: () => Promise<T>): Promise<T> {
  return queueRequest(fn, 10);
}

/**
 * Normal priority request (default)
 */
export async function queueNormalPriority<T>(fn: () => Promise<T>): Promise<T> {
  return queueRequest(fn, 5);
}

/**
 * Low priority request (analytics, background tasks)
 */
export async function queueLowPriority<T>(fn: () => Promise<T>): Promise<T> {
  return queueRequest(fn, 1);
}

/**
 * Reset global queue
 */
export function resetQueue(): void {
  if (globalQueue) {
    globalQueue.clear();
    globalQueue = null;
  }
}
