/**
 * Request Batching Service - Optimizes Supabase API calls for free tier limits
 * Batches multiple requests to reduce connection overhead and respect rate limits
 */

import { supabase } from '@/config/supabase';

interface BatchRequest {
  id: string;
  type: 'query' | 'mutation';
  table: string;
  operation: 'select' | 'insert' | 'update' | 'delete';
  params: any;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
  priority: 'high' | 'medium' | 'low';
}

interface BatchConfig {
  maxBatchSize: number;
  batchWindowMs: number;
  maxConcurrentBatches: number;
  retryAttempts: number;
  retryDelayMs: number;
}

class RequestBatchingService {
  private queue: Map<string, BatchRequest[]> = new Map();
  private batchTimer: NodeJS.Timeout | null = null;
  private activeBatches = 0;
  private requestCount = 0;
  private lastResetTime = Date.now();

  private config: BatchConfig = {
    maxBatchSize: 10, // Max requests per batch
    batchWindowMs: 100, // Wait time before processing batch
    maxConcurrentBatches: 3, // Supabase free tier safe limit
    retryAttempts: 3,
    retryDelayMs: 1000,
  };

  // Rate limiting for Supabase free tier
  private readonly RATE_LIMITS = {
    requestsPerSecond: 30, // Conservative limit for free tier
    requestsPerMinute: 500,
    concurrentConnections: 60,
  };

  /**
   * Add request to batch queue
   */
  async batchRequest<T>(
    table: string,
    operation: BatchRequest['operation'],
    params: any,
    priority: BatchRequest['priority'] = 'medium'
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: BatchRequest = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: operation === 'select' ? 'query' : 'mutation',
        table,
        operation,
        params,
        resolve,
        reject,
        timestamp: Date.now(),
        priority,
      };

      // Add to queue by table
      const queueKey = `${table}-${operation}`;
      if (!this.queue.has(queueKey)) {
        this.queue.set(queueKey, []);
      }

      const requests = this.queue.get(queueKey)!;
      requests.push(request);

      // Sort by priority
      requests.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      // Schedule batch processing
      this.scheduleBatchProcessing();
    });
  }

  /**
   * Schedule batch processing with debouncing
   */
  private scheduleBatchProcessing(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    // Check if we should process immediately due to queue size
    const totalRequests = Array.from(this.queue.values()).reduce(
      (sum, requests) => sum + requests.length,
      0
    );

    if (totalRequests >= this.config.maxBatchSize) {
      this.processBatches();
    } else {
      // Schedule for later
      this.batchTimer = setTimeout(() => {
        this.processBatches();
      }, this.config.batchWindowMs);
    }
  }

  /**
   * Process all pending batches
   */
  private async processBatches(): Promise<void> {
    if (this.activeBatches >= this.config.maxConcurrentBatches) {
      // Reschedule if too many active batches
      this.scheduleBatchProcessing();
      return;
    }

    // Check rate limits
    if (!this.checkRateLimits()) {
      // Wait and retry
      setTimeout(() => this.processBatches(), this.config.retryDelayMs);
      return;
    }

    const batches: Map<string, BatchRequest[]> = new Map(this.queue);
    this.queue.clear();

    for (const [key, requests] of batches) {
      if (requests.length === 0) continue;

      // Process in chunks respecting max batch size
      const chunks = this.chunkRequests(requests, this.config.maxBatchSize);

      for (const chunk of chunks) {
        this.activeBatches++;
        this.processBatch(key, chunk)
          .finally(() => {
            this.activeBatches--;
          });
      }
    }
  }

  /**
   * Process a single batch of requests
   */
  private async processBatch(key: string, requests: BatchRequest[]): Promise<void> {
    const [table, operation] = key.split('-');

    try {
      if (operation === 'select') {
        await this.processBatchSelect(table, requests);
      } else if (operation === 'insert') {
        await this.processBatchInsert(table, requests);
      } else if (operation === 'update') {
        await this.processBatchUpdate(table, requests);
      } else if (operation === 'delete') {
        await this.processBatchDelete(table, requests);
      }

      this.requestCount += requests.length;
    } catch (error) {
      console.error(`Batch processing error for ${key}:`, error);

      // Retry individual requests on batch failure
      for (const request of requests) {
        this.retryRequest(request);
      }
    }
  }

  /**
   * Process batch SELECT operations
   */
  private async processBatchSelect(table: string, requests: BatchRequest[]): Promise<void> {
    // Combine multiple selects into one with OR conditions where possible
    const ids = requests
      .filter(r => r.params.id)
      .map(r => r.params.id);

    if (ids.length > 0) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .in('id', ids);

      if (error) throw error;

      // Distribute results to individual requests
      const dataMap = new Map(data?.map(item => [item.id, item]) || []);

      for (const request of requests) {
        if (request.params.id) {
          const item = dataMap.get(request.params.id);
          if (item) {
            request.resolve(item);
          } else {
            request.reject(new Error('Item not found'));
          }
        }
      }
    } else {
      // Process individually if can't batch
      for (const request of requests) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select(request.params.select || '*')
            .match(request.params.match || {})
            .limit(request.params.limit || 50);

          if (error) throw error;
          request.resolve(data);
        } catch (error) {
          request.reject(error);
        }
      }
    }
  }

  /**
   * Process batch INSERT operations
   */
  private async processBatchInsert(table: string, requests: BatchRequest[]): Promise<void> {
    const records = requests.map(r => r.params.data);

    const { data, error } = await supabase
      .from(table)
      .insert(records)
      .select();

    if (error) throw error;

    // Distribute results to individual requests
    requests.forEach((request, index) => {
      request.resolve(data?.[index]);
    });
  }

  /**
   * Process batch UPDATE operations
   */
  private async processBatchUpdate(table: string, requests: BatchRequest[]): Promise<void> {
    // Updates must be processed individually due to different conditions
    const updatePromises = requests.map(async (request) => {
      try {
        const { data, error } = await supabase
          .from(table)
          .update(request.params.data)
          .match(request.params.match || { id: request.params.id })
          .select();

        if (error) throw error;
        request.resolve(data);
      } catch (error) {
        request.reject(error);
      }
    });

    await Promise.all(updatePromises);
  }

  /**
   * Process batch DELETE operations
   */
  private async processBatchDelete(table: string, requests: BatchRequest[]): Promise<void> {
    const ids = requests
      .filter(r => r.params.id)
      .map(r => r.params.id);

    if (ids.length > 0) {
      const { error } = await supabase
        .from(table)
        .delete()
        .in('id', ids);

      if (error) throw error;

      requests.forEach(request => request.resolve(true));
    } else {
      // Process individually if can't batch
      for (const request of requests) {
        try {
          const { error } = await supabase
            .from(table)
            .delete()
            .match(request.params.match || {});

          if (error) throw error;
          request.resolve(true);
        } catch (error) {
          request.reject(error);
        }
      }
    }
  }

  /**
   * Retry failed request with exponential backoff
   */
  private async retryRequest(request: BatchRequest, attempt = 1): Promise<void> {
    if (attempt > this.config.retryAttempts) {
      request.reject(new Error('Max retry attempts exceeded'));
      return;
    }

    const delay = this.config.retryDelayMs * Math.pow(2, attempt - 1);

    setTimeout(() => {
      // Re-add to queue with high priority
      const queueKey = `${request.table}-${request.operation}`;
      if (!this.queue.has(queueKey)) {
        this.queue.set(queueKey, []);
      }

      this.queue.get(queueKey)!.push({
        ...request,
        priority: 'high',
      });

      this.scheduleBatchProcessing();
    }, delay);
  }

  /**
   * Check if we're within rate limits
   */
  private checkRateLimits(): boolean {
    const now = Date.now();
    const timeSinceReset = now - this.lastResetTime;

    // Reset counter every minute
    if (timeSinceReset >= 60000) {
      this.requestCount = 0;
      this.lastResetTime = now;
      return true;
    }

    // Check per-second limit
    const requestsPerSecond = this.requestCount / (timeSinceReset / 1000);
    if (requestsPerSecond >= this.RATE_LIMITS.requestsPerSecond) {
      return false;
    }

    // Check per-minute limit
    if (this.requestCount >= this.RATE_LIMITS.requestsPerMinute) {
      return false;
    }

    // Check concurrent connections
    if (this.activeBatches >= this.config.maxConcurrentBatches) {
      return false;
    }

    return true;
  }

  /**
   * Chunk requests into smaller batches
   */
  private chunkRequests(requests: BatchRequest[], chunkSize: number): BatchRequest[][] {
    const chunks: BatchRequest[][] = [];
    for (let i = 0; i < requests.length; i += chunkSize) {
      chunks.push(requests.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Get current queue status
   */
  getQueueStatus(): {
    pendingRequests: number;
    activeBatches: number;
    requestsPerMinute: number;
  } {
    const pendingRequests = Array.from(this.queue.values()).reduce(
      (sum, requests) => sum + requests.length,
      0
    );

    const timeSinceReset = Date.now() - this.lastResetTime;
    const requestsPerMinute = (this.requestCount / timeSinceReset) * 60000;

    return {
      pendingRequests,
      activeBatches: this.activeBatches,
      requestsPerMinute: Math.round(requestsPerMinute),
    };
  }

  /**
   * Clear all pending requests
   */
  clearQueue(): void {
    for (const requests of this.queue.values()) {
      for (const request of requests) {
        request.reject(new Error('Queue cleared'));
      }
    }
    this.queue.clear();

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<BatchConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export singleton instance
export const requestBatchingService = new RequestBatchingService();
export default requestBatchingService;