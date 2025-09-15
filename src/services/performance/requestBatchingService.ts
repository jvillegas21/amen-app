import { supabase } from '@/config/supabase';

interface BatchedRequest {
  id: string;
  type: 'select' | 'insert' | 'update' | 'delete' | 'rpc';
  table?: string;
  query?: any;
  data?: any;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
}

interface BatchConfig {
  maxBatchSize: number;
  maxWaitTime: number; // milliseconds
  retryAttempts: number;
  retryDelay: number; // milliseconds
}

/**
 * Request Batching Service for Supabase
 * Optimizes API calls by batching multiple requests together
 * Critical for staying under Supabase free tier rate limits
 */
class RequestBatchingService {
  private requestQueue: BatchedRequest[] = [];
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private isProcessing = false;
  private config: BatchConfig;

  constructor() {
    this.config = {
      maxBatchSize: 10, // Max requests per batch
      maxWaitTime: 100, // Max wait time before processing batch
      retryAttempts: 3,
      retryDelay: 1000,
    };
  }

  /**
   * Add a request to the batch queue
   */
  async addRequest<T>(
    type: BatchedRequest['type'],
    table?: string,
    query?: any,
    data?: any
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: BatchedRequest = {
        id: `${type}_${Date.now()}_${Math.random()}`,
        type,
        table,
        query,
        data,
        resolve,
        reject,
        timestamp: Date.now(),
      };

      this.requestQueue.push(request);

      // Process batch if it's full
      if (this.requestQueue.length >= this.config.maxBatchSize) {
        this.processBatch();
      } else if (!this.batchTimer) {
        // Set timer to process batch after max wait time
        this.batchTimer = setTimeout(() => {
          this.processBatch();
        }, this.config.maxWaitTime);
      }
    });
  }

  /**
   * Process the current batch of requests
   */
  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    // Clear the timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Get current batch
    const batch = this.requestQueue.splice(0, this.config.maxBatchSize);
    
    try {
      // Group requests by type and table for optimization
      const groupedRequests = this.groupRequestsByType(batch);
      
      // Process each group
      const results = await this.processGroupedRequests(groupedRequests);
      
      // Resolve all requests with their results
      batch.forEach((request, index) => {
        const result = results[index];
        if (result.success) {
          request.resolve(result.data);
        } else {
          request.reject(result.error);
        }
      });

    } catch (error) {
      // Reject all requests in the batch
      batch.forEach(request => {
        request.reject(error);
      });
    } finally {
      this.isProcessing = false;

      // Process remaining requests if any
      if (this.requestQueue.length > 0) {
        setTimeout(() => this.processBatch(), 10);
      }
    }
  }

  /**
   * Group requests by type and table for efficient processing
   */
  private groupRequestsByType(requests: BatchedRequest[]): Map<string, BatchedRequest[]> {
    const groups = new Map<string, BatchedRequest[]>();

    requests.forEach(request => {
      const key = `${request.type}_${request.table || 'default'}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(request);
    });

    return groups;
  }

  /**
   * Process grouped requests efficiently
   */
  private async processGroupedRequests(
    groupedRequests: Map<string, BatchedRequest[]>
  ): Promise<Array<{ success: boolean; data?: any; error?: any }>> {
    const results: Array<{ success: boolean; data?: any; error?: any }> = [];

    for (const [_groupKey, requests] of groupedRequests) {
      try {
        const groupResults = await this.processRequestGroup(requests);
        results.push(...groupResults);
      } catch (error) {
        // If group processing fails, mark all requests in group as failed
        requests.forEach(() => {
          results.push({ success: false, error });
        });
      }
    }

    return results;
  }

  /**
   * Process a group of similar requests
   */
  private async processRequestGroup(requests: BatchedRequest[]): Promise<Array<{ success: boolean; data?: any; error?: any }>> {
    if (requests.length === 0) return [];

    const firstRequest = requests[0];
    const results: Array<{ success: boolean; data?: any; error?: any }> = [];

    try {
      switch (firstRequest.type) {
        case 'select':
          // For select requests, we can potentially combine them
          const selectResults = await this.processSelectRequests(requests);
          results.push(...selectResults);
          break;

        case 'insert':
          // For insert requests, we can batch them
          const insertResults = await this.processInsertRequests(requests);
          results.push(...insertResults);
          break;

        case 'update':
          // For update requests, process individually but in parallel
          const updateResults = await this.processUpdateRequests(requests);
          results.push(...updateResults);
          break;

        case 'delete':
          // For delete requests, process individually but in parallel
          const deleteResults = await this.processDeleteRequests(requests);
          results.push(...deleteResults);
          break;

        case 'rpc':
          // For RPC requests, process individually but in parallel
          const rpcResults = await this.processRpcRequests(requests);
          results.push(...rpcResults);
          break;

        default:
          throw new Error(`Unsupported request type: ${firstRequest.type}`);
      }
    } catch (error) {
      // If group processing fails, mark all as failed
      requests.forEach(() => {
        results.push({ success: false, error });
      });
    }

    return results;
  }

  /**
   * Process select requests
   */
  private async processSelectRequests(requests: BatchedRequest[]): Promise<Array<{ success: boolean; data?: any; error?: any }>> {
    const results: Array<{ success: boolean; data?: any; error?: any }> = [];

    // Process select requests in parallel
    const promises = requests.map(async (request) => {
      try {
        const { data, error } = await supabase
          .from(request.table!)
          .select(request.query?.select || '*')
          .match(request.query?.match || {})
          .order(request.query?.order || 'created_at', { ascending: false })
          .limit(request.query?.limit || 50);

        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        return { success: false, error };
      }
    });

    const selectResults = await Promise.all(promises);
    results.push(...selectResults);

    return results;
  }

  /**
   * Process insert requests
   */
  private async processInsertRequests(requests: BatchedRequest[]): Promise<Array<{ success: boolean; data?: any; error?: any }>> {
    const results: Array<{ success: boolean; data?: any; error?: any }> = [];

    // Group by table for batch inserts
    const tableGroups = new Map<string, BatchedRequest[]>();
    requests.forEach(request => {
      if (!tableGroups.has(request.table!)) {
        tableGroups.set(request.table!, []);
      }
      tableGroups.get(request.table!)!.push(request);
    });

    for (const [table, tableRequests] of tableGroups) {
      try {
        // Extract data from requests
        const insertData = tableRequests.map(req => req.data);
        
        const { data, error } = await supabase
          .from(table)
          .insert(insertData)
          .select();

        if (error) throw error;

        // Distribute results back to individual requests
        if (Array.isArray(data)) {
          data.forEach((item, _index) => {
            results.push({ success: true, data: item });
          });
        } else {
          results.push({ success: true, data });
        }
      } catch (error) {
        // Mark all requests for this table as failed
        tableRequests.forEach(() => {
          results.push({ success: false, error });
        });
      }
    }

    return results;
  }

  /**
   * Process update requests
   */
  private async processUpdateRequests(requests: BatchedRequest[]): Promise<Array<{ success: boolean; data?: any; error?: any }>> {
    const results: Array<{ success: boolean; data?: any; error?: any }> = [];

    // Process update requests in parallel
    const promises = requests.map(async (request) => {
      try {
        const { data, error } = await supabase
          .from(request.table!)
          .update(request.data)
          .match(request.query?.match || {})
          .select();

        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        return { success: false, error };
      }
    });

    const updateResults = await Promise.all(promises);
    results.push(...updateResults);

    return results;
  }

  /**
   * Process delete requests
   */
  private async processDeleteRequests(requests: BatchedRequest[]): Promise<Array<{ success: boolean; data?: any; error?: any }>> {
    const results: Array<{ success: boolean; data?: any; error?: any }> = [];

    // Process delete requests in parallel
    const promises = requests.map(async (request) => {
      try {
        const { error } = await supabase
          .from(request.table!)
          .delete()
          .match(request.query?.match || {});

        if (error) throw error;
        return { success: true, data: null };
      } catch (error) {
        return { success: false, error };
      }
    });

    const deleteResults = await Promise.all(promises);
    results.push(...deleteResults);

    return results;
  }

  /**
   * Process RPC requests
   */
  private async processRpcRequests(requests: BatchedRequest[]): Promise<Array<{ success: boolean; data?: any; error?: any }>> {
    const results: Array<{ success: boolean; data?: any; error?: any }> = [];

    // Process RPC requests in parallel
    const promises = requests.map(async (request) => {
      try {
        const { data, error } = await supabase.rpc(
          request.query?.function || 'unknown_function',
          request.data || {}
        );

        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        return { success: false, error };
      }
    });

    const rpcResults = await Promise.all(promises);
    results.push(...rpcResults);

    return results;
  }

  /**
   * Get current queue status
   */
  getQueueStatus(): {
    queueLength: number;
    isProcessing: boolean;
    oldestRequestAge: number;
  } {
    const oldestRequest = this.requestQueue.reduce((oldest, current) => 
      current.timestamp < oldest.timestamp ? current : oldest, 
      this.requestQueue[0]
    );

    return {
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessing,
      oldestRequestAge: oldestRequest ? Date.now() - oldestRequest.timestamp : 0,
    };
  }

  /**
   * Clear all pending requests
   */
  clearQueue(): void {
    this.requestQueue.forEach(request => {
      request.reject(new Error('Request cancelled - queue cleared'));
    });
    this.requestQueue = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  /**
   * Update batch configuration
   */
  updateConfig(newConfig: Partial<BatchConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const requestBatchingService = new RequestBatchingService();
export default requestBatchingService;