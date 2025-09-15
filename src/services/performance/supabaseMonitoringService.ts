import { supabase } from '@/config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SupabaseUsage {
  database_size: number; // bytes
  storage_size: number; // bytes
  bandwidth_used: number; // bytes
  bandwidth_limit: number; // bytes
  requests_count: number;
  requests_limit: number;
  concurrent_connections: number;
  connection_limit: number;
  last_updated: string;
}

interface UsageAlert {
  type: 'database' | 'storage' | 'bandwidth' | 'requests' | 'connections';
  current: number;
  limit: number;
  percentage: number;
  severity: 'warning' | 'critical';
  message: string;
}

interface PerformanceMetrics {
  avg_response_time: number;
  error_rate: number;
  cache_hit_rate: number;
  request_count: number;
  last_updated: string;
}

/**
 * Supabase Monitoring Service
 * Tracks usage against free tier limits and provides alerts
 * Critical for preventing service interruptions
 */
class SupabaseMonitoringService {
  private usage: SupabaseUsage | null = null;
  private performanceMetrics: PerformanceMetrics | null = null;
  private alerts: UsageAlert[] = [];
  private readonly STORAGE_KEY = 'supabase_usage';
  private readonly METRICS_STORAGE_KEY = 'supabase_metrics';
  private readonly ALERTS_STORAGE_KEY = 'supabase_alerts';

  // Free tier limits
  private readonly LIMITS = {
    database_size: 500 * 1024 * 1024, // 500MB
    storage_size: 1024 * 1024 * 1024, // 1GB
    bandwidth_daily: 2 * 1024 * 1024 * 1024, // 2GB per day
    requests_daily: 50000, // 50k requests per day
    concurrent_connections: 60, // 60 concurrent connections
  };

  // Alert thresholds
  private readonly ALERT_THRESHOLDS = {
    warning: 0.8, // 80% of limit
    critical: 0.95, // 95% of limit
  };

  constructor() {
    this.loadStoredData();
    this.startMonitoring();
  }

  /**
   * Start monitoring Supabase usage
   */
  private startMonitoring(): void {
    // Check usage every 5 minutes
    setInterval(() => {
      this.checkUsage();
    }, 5 * 60 * 1000);

    // Initial check
    this.checkUsage();
  }

  /**
   * Check current Supabase usage
   */
  async checkUsage(): Promise<void> {
    try {
      await Promise.all([
        this.checkDatabaseUsage(),
        this.checkStorageUsage(),
        this.checkBandwidthUsage(),
        this.checkRequestUsage(),
        this.checkConnectionUsage(),
      ]);

      this.generateAlerts();
      await this.saveUsageData();
    } catch (error) {
      console.error('Failed to check Supabase usage:', error);
    }
  }

  /**
   * Check database size usage
   */
  private async checkDatabaseUsage(): Promise<void> {
    try {
      // Query to get database size (approximate)
      const { data, error } = await supabase.rpc('get_database_size');
      
      if (error) {
        console.warn('Failed to get database size:', error);
        return;
      }

      if (!this.usage) {
        this.usage = this.getDefaultUsage();
      }

      this.usage.database_size = data?.size || 0;
    } catch (error) {
      console.error('Error checking database usage:', error);
    }
  }

  /**
   * Check storage usage
   */
  private async checkStorageUsage(): Promise<void> {
    try {
      // Get storage usage from storage API
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.warn('Failed to get storage usage:', error);
        return;
      }

      if (!this.usage) {
        this.usage = this.getDefaultUsage();
      }

      // Calculate total storage usage (approximate)
      let totalSize = 0;
      for (const bucket of data || []) {
        // This is a simplified calculation
        // In a real implementation, you'd need to sum up all file sizes
        totalSize += bucket.public ? 0 : 0; // Placeholder
      }

      this.usage.storage_size = totalSize;
    } catch (error) {
      console.error('Error checking storage usage:', error);
    }
  }

  /**
   * Check bandwidth usage
   */
  private async checkBandwidthUsage(): Promise<void> {
    try {
      // Get bandwidth usage from analytics
      const { data, error } = await supabase.rpc('get_bandwidth_usage');
      
      if (error) {
        console.warn('Failed to get bandwidth usage:', error);
        return;
      }

      if (!this.usage) {
        this.usage = this.getDefaultUsage();
      }

      this.usage.bandwidth_used = data?.bandwidth || 0;
      this.usage.bandwidth_limit = this.LIMITS.bandwidth_daily;
    } catch (error) {
      console.error('Error checking bandwidth usage:', error);
    }
  }

  /**
   * Check request count usage
   */
  private async checkRequestUsage(): Promise<void> {
    try {
      // Get request count from analytics
      const { data, error } = await supabase.rpc('get_request_count');
      
      if (error) {
        console.warn('Failed to get request count:', error);
        return;
      }

      if (!this.usage) {
        this.usage = this.getDefaultUsage();
      }

      this.usage.requests_count = data?.count || 0;
      this.usage.requests_limit = this.LIMITS.requests_daily;
    } catch (error) {
      console.error('Error checking request usage:', error);
    }
  }

  /**
   * Check concurrent connections
   */
  private async checkConnectionUsage(): Promise<void> {
    try {
      // Get active connections (approximate)
      const { data, error } = await supabase.rpc('get_active_connections');
      
      if (error) {
        console.warn('Failed to get connection count:', error);
        return;
      }

      if (!this.usage) {
        this.usage = this.getDefaultUsage();
      }

      this.usage.concurrent_connections = data?.connections || 0;
      this.usage.connection_limit = this.LIMITS.concurrent_connections;
    } catch (error) {
      console.error('Error checking connection usage:', error);
    }
  }

  /**
   * Generate usage alerts
   */
  private generateAlerts(): void {
    if (!this.usage) return;

    this.alerts = [];

    // Check database size
    const dbPercentage = this.usage.database_size / this.LIMITS.database_size;
    if (dbPercentage >= this.ALERT_THRESHOLDS.warning) {
      this.alerts.push({
        type: 'database',
        current: this.usage.database_size,
        limit: this.LIMITS.database_size,
        percentage: dbPercentage,
        severity: dbPercentage >= this.ALERT_THRESHOLDS.critical ? 'critical' : 'warning',
        message: `Database size is at ${Math.round(dbPercentage * 100)}% of limit`,
      });
    }

    // Check storage size
    const storagePercentage = this.usage.storage_size / this.LIMITS.storage_size;
    if (storagePercentage >= this.ALERT_THRESHOLDS.warning) {
      this.alerts.push({
        type: 'storage',
        current: this.usage.storage_size,
        limit: this.LIMITS.storage_size,
        percentage: storagePercentage,
        severity: storagePercentage >= this.ALERT_THRESHOLDS.critical ? 'critical' : 'warning',
        message: `Storage usage is at ${Math.round(storagePercentage * 100)}% of limit`,
      });
    }

    // Check bandwidth
    const bandwidthPercentage = this.usage.bandwidth_used / this.LIMITS.bandwidth_daily;
    if (bandwidthPercentage >= this.ALERT_THRESHOLDS.warning) {
      this.alerts.push({
        type: 'bandwidth',
        current: this.usage.bandwidth_used,
        limit: this.LIMITS.bandwidth_daily,
        percentage: bandwidthPercentage,
        severity: bandwidthPercentage >= this.ALERT_THRESHOLDS.critical ? 'critical' : 'warning',
        message: `Bandwidth usage is at ${Math.round(bandwidthPercentage * 100)}% of daily limit`,
      });
    }

    // Check requests
    const requestPercentage = this.usage.requests_count / this.LIMITS.requests_daily;
    if (requestPercentage >= this.ALERT_THRESHOLDS.warning) {
      this.alerts.push({
        type: 'requests',
        current: this.usage.requests_count,
        limit: this.LIMITS.requests_daily,
        percentage: requestPercentage,
        severity: requestPercentage >= this.ALERT_THRESHOLDS.critical ? 'critical' : 'warning',
        message: `Request count is at ${Math.round(requestPercentage * 100)}% of daily limit`,
      });
    }

    // Check connections
    const connectionPercentage = this.usage.concurrent_connections / this.LIMITS.concurrent_connections;
    if (connectionPercentage >= this.ALERT_THRESHOLDS.warning) {
      this.alerts.push({
        type: 'connections',
        current: this.usage.concurrent_connections,
        limit: this.LIMITS.concurrent_connections,
        percentage: connectionPercentage,
        severity: connectionPercentage >= this.ALERT_THRESHOLDS.critical ? 'critical' : 'warning',
        message: `Concurrent connections are at ${Math.round(connectionPercentage * 100)}% of limit`,
      });
    }
  }

  /**
   * Get current usage data
   */
  getUsage(): SupabaseUsage | null {
    return this.usage;
  }

  /**
   * Get current alerts
   */
  getAlerts(): UsageAlert[] {
    return this.alerts;
  }

  /**
   * Get critical alerts only
   */
  getCriticalAlerts(): UsageAlert[] {
    return this.alerts.filter(alert => alert.severity === 'critical');
  }

  /**
   * Get usage summary
   */
  getUsageSummary(): {
    database: { used: number; limit: number; percentage: number };
    storage: { used: number; limit: number; percentage: number };
    bandwidth: { used: number; limit: number; percentage: number };
    requests: { used: number; limit: number; percentage: number };
    connections: { used: number; limit: number; percentage: number };
  } {
    if (!this.usage) {
      return {
        database: { used: 0, limit: this.LIMITS.database_size, percentage: 0 },
        storage: { used: 0, limit: this.LIMITS.storage_size, percentage: 0 },
        bandwidth: { used: 0, limit: this.LIMITS.bandwidth_daily, percentage: 0 },
        requests: { used: 0, limit: this.LIMITS.requests_daily, percentage: 0 },
        connections: { used: 0, limit: this.LIMITS.concurrent_connections, percentage: 0 },
      };
    }

    return {
      database: {
        used: this.usage.database_size,
        limit: this.LIMITS.database_size,
        percentage: this.usage.database_size / this.LIMITS.database_size,
      },
      storage: {
        used: this.usage.storage_size,
        limit: this.LIMITS.storage_size,
        percentage: this.usage.storage_size / this.LIMITS.storage_size,
      },
      bandwidth: {
        used: this.usage.bandwidth_used,
        limit: this.LIMITS.bandwidth_daily,
        percentage: this.usage.bandwidth_used / this.LIMITS.bandwidth_daily,
      },
      requests: {
        used: this.usage.requests_count,
        limit: this.LIMITS.requests_daily,
        percentage: this.usage.requests_count / this.LIMITS.requests_daily,
      },
      connections: {
        used: this.usage.concurrent_connections,
        limit: this.LIMITS.concurrent_connections,
        percentage: this.usage.concurrent_connections / this.LIMITS.concurrent_connections,
      },
    };
  }

  /**
   * Check if any limits are approaching
   */
  isApproachingLimits(): boolean {
    return this.alerts.some(alert => alert.severity === 'warning');
  }

  /**
   * Check if any limits are critical
   */
  isAtCriticalLimits(): boolean {
    return this.alerts.some(alert => alert.severity === 'critical');
  }

  /**
   * Get default usage object
   */
  private getDefaultUsage(): SupabaseUsage {
    return {
      database_size: 0,
      storage_size: 0,
      bandwidth_used: 0,
      bandwidth_limit: this.LIMITS.bandwidth_daily,
      requests_count: 0,
      requests_limit: this.LIMITS.requests_daily,
      concurrent_connections: 0,
      connection_limit: this.LIMITS.concurrent_connections,
      last_updated: new Date().toISOString(),
    };
  }

  /**
   * Load stored data from AsyncStorage
   */
  private async loadStoredData(): Promise<void> {
    try {
      const [usageData, metricsData, alertsData] = await Promise.all([
        AsyncStorage.getItem(this.STORAGE_KEY),
        AsyncStorage.getItem(this.METRICS_STORAGE_KEY),
        AsyncStorage.getItem(this.ALERTS_STORAGE_KEY),
      ]);

      if (usageData) {
        this.usage = JSON.parse(usageData);
      }

      if (metricsData) {
        this.performanceMetrics = JSON.parse(metricsData);
      }

      if (alertsData) {
        this.alerts = JSON.parse(alertsData);
      }
    } catch (error) {
      console.error('Failed to load stored monitoring data:', error);
    }
  }

  /**
   * Save usage data to AsyncStorage
   */
  private async saveUsageData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.usage)),
        AsyncStorage.setItem(this.METRICS_STORAGE_KEY, JSON.stringify(this.performanceMetrics)),
        AsyncStorage.setItem(this.ALERTS_STORAGE_KEY, JSON.stringify(this.alerts)),
      ]);
    } catch (error) {
      console.error('Failed to save monitoring data:', error);
    }
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.alerts.some(alert => alert.type === 'database' && alert.severity === 'warning')) {
      recommendations.push('Consider archiving old data or upgrading to a paid plan');
    }

    if (this.alerts.some(alert => alert.type === 'storage' && alert.severity === 'warning')) {
      recommendations.push('Optimize image uploads and consider compression');
    }

    if (this.alerts.some(alert => alert.type === 'bandwidth' && alert.severity === 'warning')) {
      recommendations.push('Implement request batching and caching strategies');
    }

    if (this.alerts.some(alert => alert.type === 'requests' && alert.severity === 'warning')) {
      recommendations.push('Optimize API calls and implement request deduplication');
    }

    if (this.alerts.some(alert => alert.type === 'connections' && alert.severity === 'warning')) {
      recommendations.push('Implement connection pooling and cleanup idle connections');
    }

    return recommendations;
  }
}

// Export singleton instance
export const supabaseMonitoringService = new SupabaseMonitoringService();
export default supabaseMonitoringService;