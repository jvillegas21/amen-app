/**
 * Supabase Monitoring Service
 * Tracks usage metrics for free tier limits and provides alerts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { monitoringService } from '../monitoringService';

interface SupabaseUsageStats {
  requestCount: number;
  bandwidthUsed: number; // in bytes
  storageUsed: number; // in bytes
  dbRowCount: number;
  resetTime: number; // timestamp for monthly reset
}

interface SupabaseAlerts {
  requestsThreshold: number;
  bandwidthThreshold: number;
  storageThreshold: number;
  dbRowsThreshold: number;
}

class SupabaseMonitoringService {
  private readonly STORAGE_KEY = 'supabase_usage_stats';
  private readonly ALERTS_KEY = 'supabase_alerts';

  // Supabase free tier limits
  private readonly FREE_TIER_LIMITS = {
    maxRequests: 50000, // per month
    maxBandwidth: 2 * 1024 * 1024 * 1024, // 2GB per month
    maxStorage: 500 * 1024 * 1024, // 500MB total
    maxDbRows: 500000, // total rows
    maxConnections: 60, // concurrent connections
  };

  private currentStats: SupabaseUsageStats = {
    requestCount: 0,
    bandwidthUsed: 0,
    storageUsed: 0,
    dbRowCount: 0,
    resetTime: this.getNextMonthlyReset(),
  };

  private alerts: SupabaseAlerts = {
    requestsThreshold: 0.8, // Alert at 80% usage
    bandwidthThreshold: 0.8,
    storageThreshold: 0.8,
    dbRowsThreshold: 0.8,
  };

  /**
   * Initialize monitoring service
   */
  async initialize(): Promise<void> {
    try {
      await this.loadStats();
      await this.loadAlerts();
      this.checkForMonthlyReset();
      console.log('Supabase monitoring service initialized');
    } catch (error) {
      console.error('Failed to initialize Supabase monitoring:', error);
    }
  }

  /**
   * Track a Supabase request
   */
  async trackRequest(requestSize: number = 1024): Promise<void> {
    this.currentStats.requestCount++;
    this.currentStats.bandwidthUsed += requestSize;

    await this.saveStats();
    this.checkThresholds();
  }

  /**
   * Track storage usage
   */
  async trackStorageUsage(bytes: number): Promise<void> {
    this.currentStats.storageUsed = bytes;
    await this.saveStats();
    this.checkThresholds();
  }

  /**
   * Track database row count
   */
  async trackDbRows(count: number): Promise<void> {
    this.currentStats.dbRowCount = count;
    await this.saveStats();
    this.checkThresholds();
  }

  /**
   * Get current usage statistics
   */
  getUsageStats(): {
    requests: { used: number; limit: number; percentage: number };
    bandwidth: { used: number; limit: number; percentage: number };
    storage: { used: number; limit: number; percentage: number };
    dbRows: { used: number; limit: number; percentage: number };
    daysUntilReset: number;
  } {
    const now = Date.now();
    const daysUntilReset = Math.ceil((this.currentStats.resetTime - now) / (24 * 60 * 60 * 1000));

    return {
      requests: {
        used: this.currentStats.requestCount,
        limit: this.FREE_TIER_LIMITS.maxRequests,
        percentage: (this.currentStats.requestCount / this.FREE_TIER_LIMITS.maxRequests) * 100,
      },
      bandwidth: {
        used: this.currentStats.bandwidthUsed,
        limit: this.FREE_TIER_LIMITS.maxBandwidth,
        percentage: (this.currentStats.bandwidthUsed / this.FREE_TIER_LIMITS.maxBandwidth) * 100,
      },
      storage: {
        used: this.currentStats.storageUsed,
        limit: this.FREE_TIER_LIMITS.maxStorage,
        percentage: (this.currentStats.storageUsed / this.FREE_TIER_LIMITS.maxStorage) * 100,
      },
      dbRows: {
        used: this.currentStats.dbRowCount,
        limit: this.FREE_TIER_LIMITS.maxDbRows,
        percentage: (this.currentStats.dbRowCount / this.FREE_TIER_LIMITS.maxDbRows) * 100,
      },
      daysUntilReset,
    };
  }

  /**
   * Get recommendations for reducing usage
   */
  getUsageRecommendations(): string[] {
    const stats = this.getUsageStats();
    const recommendations: string[] = [];

    if (stats.requests.percentage > 60) {
      recommendations.push(
        'Consider implementing request batching to reduce API calls',
        'Enable query caching to avoid repeated requests',
        'Use pagination to limit data fetched per request'
      );
    }

    if (stats.bandwidth.percentage > 60) {
      recommendations.push(
        'Optimize image sizes and use compression',
        'Implement incremental data loading',
        'Use select queries to fetch only needed columns'
      );
    }

    if (stats.storage.percentage > 60) {
      recommendations.push(
        'Clean up old or unused data',
        'Compress images before storage',
        'Archive old records to external storage'
      );
    }

    if (stats.dbRows.percentage > 60) {
      recommendations.push(
        'Implement data archiving strategy',
        'Remove duplicate or test data',
        'Consider data retention policies'
      );
    }

    return recommendations;
  }

  /**
   * Check if usage is near limits and send alerts
   */
  private checkThresholds(): void {
    const stats = this.getUsageStats();

    if (stats.requests.percentage >= this.alerts.requestsThreshold * 100) {
      this.sendAlert('requests', stats.requests.percentage);
    }

    if (stats.bandwidth.percentage >= this.alerts.bandwidthThreshold * 100) {
      this.sendAlert('bandwidth', stats.bandwidth.percentage);
    }

    if (stats.storage.percentage >= this.alerts.storageThreshold * 100) {
      this.sendAlert('storage', stats.storage.percentage);
    }

    if (stats.dbRows.percentage >= this.alerts.dbRowsThreshold * 100) {
      this.sendAlert('database rows', stats.dbRows.percentage);
    }
  }

  /**
   * Send usage alert
   */
  private sendAlert(type: string, percentage: number): void {
    const message = `Supabase ${type} usage is at ${percentage.toFixed(1)}% of free tier limit`;

    // Log to monitoring service
    monitoringService.logEvent('supabase_usage_alert', {
      type,
      percentage,
      timestamp: Date.now(),
    });

    // In production, you might want to send push notifications
    console.warn(message);
  }

  /**
   * Check if monthly reset is due
   */
  private checkForMonthlyReset(): void {
    const now = Date.now();
    if (now >= this.currentStats.resetTime) {
      this.resetMonthlyStats();
    }
  }

  /**
   * Reset monthly usage statistics
   */
  private resetMonthlyStats(): void {
    this.currentStats.requestCount = 0;
    this.currentStats.bandwidthUsed = 0;
    this.currentStats.resetTime = this.getNextMonthlyReset();
    this.saveStats();

    console.log('Monthly Supabase usage stats reset');
  }

  /**
   * Get next monthly reset timestamp
   */
  private getNextMonthlyReset(): number {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.getTime();
  }

  /**
   * Load stats from storage
   */
  private async loadStats(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.currentStats = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load Supabase stats:', error);
    }
  }

  /**
   * Save stats to storage
   */
  private async saveStats(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentStats));
    } catch (error) {
      console.error('Failed to save Supabase stats:', error);
    }
  }

  /**
   * Load alert thresholds from storage
   */
  private async loadAlerts(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.ALERTS_KEY);
      if (stored) {
        this.alerts = { ...this.alerts, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load Supabase alerts:', error);
    }
  }

  /**
   * Update alert thresholds
   */
  async updateAlertThresholds(newAlerts: Partial<SupabaseAlerts>): Promise<void> {
    this.alerts = { ...this.alerts, ...newAlerts };
    try {
      await AsyncStorage.setItem(this.ALERTS_KEY, JSON.stringify(this.alerts));
    } catch (error) {
      console.error('Failed to save Supabase alerts:', error);
    }
  }

  /**
   * Format bytes for display
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get formatted usage report
   */
  getUsageReport(): string {
    const stats = this.getUsageStats();
    return `
Supabase Usage Report:
- Requests: ${stats.requests.used.toLocaleString()} / ${stats.requests.limit.toLocaleString()} (${stats.requests.percentage.toFixed(1)}%)
- Bandwidth: ${this.formatBytes(stats.bandwidth.used)} / ${this.formatBytes(stats.bandwidth.limit)} (${stats.bandwidth.percentage.toFixed(1)}%)
- Storage: ${this.formatBytes(stats.storage.used)} / ${this.formatBytes(stats.storage.limit)} (${stats.storage.percentage.toFixed(1)}%)
- Database Rows: ${stats.dbRows.used.toLocaleString()} / ${stats.dbRows.limit.toLocaleString()} (${stats.dbRows.percentage.toFixed(1)}%)
- Days until reset: ${stats.daysUntilReset}
    `.trim();
  }
}

export const supabaseMonitoringService = new SupabaseMonitoringService();
export default supabaseMonitoringService;