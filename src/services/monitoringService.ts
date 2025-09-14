import { analyticsService } from './api/analyticsService';
import { errorHandlingService } from './errorHandlingService';

export interface PerformanceMetrics {
  id: string;
  metric_name: string;
  metric_type: 'timing' | 'counter' | 'gauge' | 'histogram';
  value: number;
  unit: string;
  tags?: Record<string, string>;
  timestamp: string;
  user_id?: string;
  session_id?: string;
}

export interface SystemHealth {
  memory_usage: number;
  cpu_usage?: number;
  network_latency: number;
  battery_level?: number;
  storage_available: number;
  app_version: string;
  os_version: string;
  device_model?: string;
}

export interface APIPerformance {
  endpoint: string;
  method: string;
  response_time: number;
  status_code: number;
  error_rate: number;
  throughput: number;
  timestamp: string;
}

class MonitoringService {
  private performanceObserver?: PerformanceObserver;
  private performanceMetrics: PerformanceMetrics[] = [];
  private apiMetrics: Map<string, APIPerformance[]> = new Map();
  private isMonitoring = false;

  /**
   * Initialize monitoring service
   */
  async initialize(): Promise<void> {
    if (this.isMonitoring) return;

    try {
      // Start performance monitoring
      this.startPerformanceMonitoring();

      // Track app startup
      await this.trackAppStartup();

      // Monitor memory usage
      this.startMemoryMonitoring();

      // Set up periodic health checks
      this.startHealthMonitoring();

      this.isMonitoring = true;
      console.log('Monitoring service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize monitoring service:', error);
      await errorHandlingService.handleError(error as Error, {
        severity: 'high',
        context: { action: 'monitoring_initialization' },
      });
    }
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            this.recordPerformanceEntry(entry);
          });
        });

        this.performanceObserver.observe({
          entryTypes: ['measure', 'navigation', 'paint']
        });
      } catch (error) {
        console.warn('PerformanceObserver not supported or failed to initialize:', error);
      }
    }
  }

  /**
   * Record performance entry
   */
  private recordPerformanceEntry(entry: PerformanceEntry): void {
    const metric: PerformanceMetrics = {
      id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metric_name: entry.name,
      metric_type: 'timing',
      value: entry.duration || entry.startTime,
      unit: 'ms',
      timestamp: new Date().toISOString(),
      tags: {
        entry_type: entry.entryType,
      },
    };

    this.performanceMetrics.push(metric);
    this.reportMetric(metric);
  }

  /**
   * Track app startup metrics
   */
  private async trackAppStartup(): Promise<void> {
    const startupTime = Date.now();

    // Measure various startup phases
    const metrics = [
      {
        name: 'app_startup_total',
        value: startupTime,
        type: 'timing' as const,
      },
    ];

    for (const metric of metrics) {
      await this.recordMetric(
        metric.name,
        metric.type,
        metric.value,
        'ms'
      );
    }

    // Track startup event
    await analyticsService.trackEvent('app_startup', {
      startup_time: startupTime,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      setInterval(() => {
        this.recordMemoryMetrics();
      }, 30000); // Every 30 seconds
    }
  }

  /**
   * Record memory metrics
   */
  private recordMemoryMetrics(): void {
    try {
      const memory = (performance as any).memory;
      if (!memory) return;

      const metrics = [
        {
          name: 'memory_used_heap_size',
          value: memory.usedJSHeapSize,
          unit: 'bytes',
        },
        {
          name: 'memory_total_heap_size',
          value: memory.totalJSHeapSize,
          unit: 'bytes',
        },
        {
          name: 'memory_heap_size_limit',
          value: memory.jsHeapSizeLimit,
          unit: 'bytes',
        },
      ];

      metrics.forEach(metric => {
        this.recordMetric(metric.name, 'gauge', metric.value, metric.unit);
      });
    } catch (error) {
      console.error('Failed to record memory metrics:', error);
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    // Health check every 5 minutes
    setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000);

    // Initial health check
    this.performHealthCheck();
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const health = await this.getSystemHealth();

      // Record health metrics
      await this.recordMetric('system_memory_usage', 'gauge', health.memory_usage, '%');
      await this.recordMetric('system_network_latency', 'gauge', health.network_latency, 'ms');
      await this.recordMetric('system_storage_available', 'gauge', health.storage_available, 'bytes');

      if (health.battery_level !== undefined) {
        await this.recordMetric('system_battery_level', 'gauge', health.battery_level, '%');
      }

      // Track health event
      await analyticsService.trackEvent('system_health_check', health);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  }

  /**
   * Get system health information
   */
  private async getSystemHealth(): Promise<SystemHealth> {
    const health: SystemHealth = {
      memory_usage: 0,
      network_latency: 0,
      storage_available: 0,
      app_version: '1.0.0', // TODO: Get from config
      os_version: 'unknown',
    };

    try {
      // Memory usage
      if (typeof performance !== 'undefined' && (performance as any).memory) {
        const memory = (performance as any).memory;
        health.memory_usage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      }

      // Network latency
      health.network_latency = await this.measureNetworkLatency();

      // Storage (placeholder - would need platform-specific implementation)
      health.storage_available = 1000000000; // 1GB placeholder

      // Battery (placeholder - would need platform-specific implementation)
      // health.battery_level = await this.getBatteryLevel();

    } catch (error) {
      console.error('Error getting system health:', error);
    }

    return health;
  }

  /**
   * Measure network latency
   */
  private async measureNetworkLatency(): Promise<number> {
    try {
      const start = Date.now();
      await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
      });
      return Date.now() - start;
    } catch (error) {
      return -1; // Network unavailable
    }
  }

  /**
   * Record a custom metric
   */
  async recordMetric(
    name: string,
    type: PerformanceMetrics['metric_type'],
    value: number,
    unit: string,
    tags?: Record<string, string>
  ): Promise<void> {
    const metric: PerformanceMetrics = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metric_name: name,
      metric_type: type,
      value,
      unit,
      tags,
      timestamp: new Date().toISOString(),
    };

    this.performanceMetrics.push(metric);
    await this.reportMetric(metric);
  }

  /**
   * Track API call performance
   */
  async trackAPICall(
    endpoint: string,
    method: string,
    startTime: number,
    statusCode: number,
    error?: Error
  ): Promise<void> {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    const performance: APIPerformance = {
      endpoint,
      method,
      response_time: responseTime,
      status_code: statusCode,
      error_rate: error ? 1 : 0,
      throughput: 1,
      timestamp: new Date().toISOString(),
    };

    // Store API metrics
    if (!this.apiMetrics.has(endpoint)) {
      this.apiMetrics.set(endpoint, []);
    }
    this.apiMetrics.get(endpoint)!.push(performance);

    // Record performance metric
    await this.recordMetric(
      'api_response_time',
      'timing',
      responseTime,
      'ms',
      {
        endpoint,
        method,
        status_code: statusCode.toString(),
      }
    );

    // Track API event
    await analyticsService.trackEvent('api_call', {
      endpoint,
      method,
      response_time: responseTime,
      status_code: statusCode,
      success: !error,
      error_message: error?.message,
    });

    if (error) {
      await errorHandlingService.handleError(error, {
        severity: statusCode >= 500 ? 'high' : 'medium',
        context: {
          action: 'api_call',
          additional_data: { endpoint, method, status_code: statusCode },
        },
      });
    }
  }

  /**
   * Report metric to analytics service
   */
  private async reportMetric(metric: PerformanceMetrics): Promise<void> {
    try {
      await analyticsService.trackEvent('performance_metric', metric);
    } catch (error) {
      console.error('Failed to report performance metric:', error);
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    total_metrics: number;
    avg_response_time: number;
    error_rate: number;
    memory_usage: number;
    top_slow_apis: Array<{ endpoint: string; avg_response_time: number }>;
  } {
    const summary = {
      total_metrics: this.performanceMetrics.length,
      avg_response_time: 0,
      error_rate: 0,
      memory_usage: 0,
      top_slow_apis: [] as Array<{ endpoint: string; avg_response_time: number }>,
    };

    // Calculate API response times
    const allApiMetrics: APIPerformance[] = [];
    this.apiMetrics.forEach(metrics => allApiMetrics.push(...metrics));

    if (allApiMetrics.length > 0) {
      summary.avg_response_time = allApiMetrics.reduce((sum, m) => sum + m.response_time, 0) / allApiMetrics.length;
      summary.error_rate = allApiMetrics.reduce((sum, m) => sum + m.error_rate, 0) / allApiMetrics.length;

      // Top slow APIs
      const endpointAvgs = new Map<string, { total: number; count: number }>();
      allApiMetrics.forEach(metric => {
        const current = endpointAvgs.get(metric.endpoint) || { total: 0, count: 0 };
        current.total += metric.response_time;
        current.count += 1;
        endpointAvgs.set(metric.endpoint, current);
      });

      summary.top_slow_apis = Array.from(endpointAvgs.entries())
        .map(([endpoint, { total, count }]) => ({
          endpoint,
          avg_response_time: total / count,
        }))
        .sort((a, b) => b.avg_response_time - a.avg_response_time)
        .slice(0, 5);
    }

    // Memory usage from latest metric
    const memoryMetrics = this.performanceMetrics.filter(m => m.metric_name === 'memory_used_heap_size');
    if (memoryMetrics.length > 0) {
      summary.memory_usage = memoryMetrics[memoryMetrics.length - 1].value;
    }

    return summary;
  }

  /**
   * Clear old metrics (keep only recent ones)
   */
  cleanupMetrics(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge;

    this.performanceMetrics = this.performanceMetrics.filter(
      metric => new Date(metric.timestamp).getTime() > cutoff
    );

    this.apiMetrics.forEach((metrics, endpoint) => {
      const filtered = metrics.filter(
        metric => new Date(metric.timestamp).getTime() > cutoff
      );
      this.apiMetrics.set(endpoint, filtered);
    });
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    this.isMonitoring = false;
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService();
export default monitoringService;