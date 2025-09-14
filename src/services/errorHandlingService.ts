import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ErrorReport {
  id: string;
  timestamp: string;
  error_type: 'javascript' | 'network' | 'authentication' | 'validation' | 'api' | 'unknown';
  error_name: string;
  error_message: string;
  error_stack?: string;
  context?: {
    user_id?: string;
    screen?: string;
    action?: string;
    component?: string;
    additional_data?: Record<string, any>;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  handled: boolean;
  user_agent?: string;
  app_version?: string;
}

export interface ErrorHandlerOptions {
  logToConsole?: boolean;
  reportToService?: boolean;
  showUserNotification?: boolean;
  severity?: ErrorReport['severity'];
  context?: ErrorReport['context'];
}

class ErrorHandlingService {
  private readonly STORAGE_KEY = 'error_reports';
  private readonly MAX_STORED_ERRORS = 100;
  private errorQueue: ErrorReport[] = [];
  private isReporting = false;

  /**
   * Initialize error handling
   */
  async initialize(): Promise<void> {
    // Set up global error handlers
    this.setupGlobalErrorHandlers();

    // Load stored errors
    await this.loadStoredErrors();

    // Report any pending errors
    await this.reportPendingErrors();
  }

  /**
   * Set up global error handlers for unhandled errors
   */
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled JavaScript errors
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      this.handleError(error, {
        severity: isFatal ? 'critical' : 'high',
        context: {
          action: 'global_error_handler',
          additional_data: { is_fatal: isFatal }
        }
      });

      // Call original handler
      originalHandler(error, isFatal);
    });

    // Handle unhandled promise rejections
    const originalRejectionHandler = require('react-native').LogBox?.ignoreLogs;

    // Add custom promise rejection tracking
    if (global.HermesInternal) {
      global.addEventListener?.('unhandledrejection', (event) => {
        this.handleError(new Error(`Unhandled Promise Rejection: ${event.reason}`), {
          severity: 'high',
          context: {
            action: 'unhandled_promise_rejection',
            additional_data: { reason: event.reason }
          }
        });
      });
    }
  }

  /**
   * Handle an error with comprehensive logging and reporting
   */
  async handleError(
    error: Error | string,
    options: ErrorHandlerOptions = {}
  ): Promise<string> {
    const errorObj = typeof error === 'string' ? new Error(error) : error;

    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      error_type: this.categorizeError(errorObj),
      error_name: errorObj.name || 'Unknown Error',
      error_message: errorObj.message || 'No message provided',
      error_stack: errorObj.stack,
      context: options.context,
      severity: options.severity || 'medium',
      handled: true,
      user_agent: this.getUserAgent(),
      app_version: this.getAppVersion(),
    };

    // Log to console if enabled (default: true)
    if (options.logToConsole !== false) {
      this.logToConsole(errorReport);
    }

    // Store error locally
    await this.storeError(errorReport);

    // Add to report queue
    this.errorQueue.push(errorReport);

    // Report to service if enabled and online
    if (options.reportToService !== false) {
      await this.reportErrors();
    }

    // Show user notification if enabled
    if (options.showUserNotification) {
      await this.showUserNotification(errorReport);
    }

    return errorReport.id;
  }

  /**
   * Categorize error by type
   */
  private categorizeError(error: Error): ErrorReport['error_type'] {
    const message = error.message?.toLowerCase() || '';
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network';
    }

    if (message.includes('auth') || message.includes('unauthorized') || message.includes('token')) {
      return 'authentication';
    }

    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return 'validation';
    }

    if (message.includes('api') || stack.includes('/api/') || message.includes('supabase')) {
      return 'api';
    }

    return 'javascript';
  }

  /**
   * Log error to console with formatting
   */
  private logToConsole(errorReport: ErrorReport): void {
    const severity = errorReport.severity.toUpperCase();
    const prefix = `[${severity}] ${errorReport.error_type}`;

    console.group(`🚨 ${prefix}: ${errorReport.error_name}`);
    console.error('Message:', errorReport.error_message);
    console.error('ID:', errorReport.id);
    console.error('Timestamp:', errorReport.timestamp);

    if (errorReport.context) {
      console.error('Context:', errorReport.context);
    }

    if (errorReport.error_stack) {
      console.error('Stack:', errorReport.error_stack);
    }

    console.groupEnd();
  }

  /**
   * Store error locally for offline reporting
   */
  private async storeError(errorReport: ErrorReport): Promise<void> {
    try {
      const storedErrors = await this.getStoredErrors();
      storedErrors.push(errorReport);

      // Keep only the most recent errors
      if (storedErrors.length > this.MAX_STORED_ERRORS) {
        storedErrors.splice(0, storedErrors.length - this.MAX_STORED_ERRORS);
      }

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(storedErrors));
    } catch (error) {
      console.error('Failed to store error report:', error);
    }
  }

  /**
   * Get stored errors from local storage
   */
  private async getStoredErrors(): Promise<ErrorReport[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load stored errors:', error);
      return [];
    }
  }

  /**
   * Load stored errors on initialization
   */
  private async loadStoredErrors(): Promise<void> {
    const storedErrors = await this.getStoredErrors();
    this.errorQueue.push(...storedErrors);
  }

  /**
   * Report errors to remote service
   */
  private async reportErrors(): Promise<void> {
    if (this.isReporting || this.errorQueue.length === 0) {
      return;
    }

    this.isReporting = true;

    try {
      // Check network connectivity
      const isOnline = await this.checkNetworkConnectivity();
      if (!isOnline) {
        return;
      }

      // Send errors in batches
      const errors = [...this.errorQueue];
      const { analyticsService } = await import('@/services/api/analyticsService');

      for (const error of errors) {
        try {
          await analyticsService.trackEvent('error_report', error);

          // Remove from queue on successful report
          const index = this.errorQueue.findIndex(e => e.id === error.id);
          if (index > -1) {
            this.errorQueue.splice(index, 1);
          }
        } catch (reportError) {
          console.error('Failed to report error:', reportError);
          // Keep in queue for retry
        }
      }

      // Clear successfully reported errors from storage
      await this.clearReportedErrors();
    } catch (error) {
      console.error('Failed to report errors:', error);
    } finally {
      this.isReporting = false;
    }
  }

  /**
   * Report pending errors from previous sessions
   */
  private async reportPendingErrors(): Promise<void> {
    await this.reportErrors();
  }

  /**
   * Clear successfully reported errors from storage
   */
  private async clearReportedErrors(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.errorQueue));
    } catch (error) {
      console.error('Failed to clear reported errors:', error);
    }
  }

  /**
   * Check network connectivity
   */
  private async checkNetworkConnectivity(): Promise<boolean> {
    try {
      const NetInfo = await import('@react-native-community/netinfo');
      const netState = await NetInfo.default.fetch();
      return netState.isConnected ?? false;
    } catch (error) {
      console.error('Failed to check network connectivity:', error);
      return true; // Assume connected if check fails
    }
  }

  /**
   * Show user notification for critical errors
   */
  private async showUserNotification(errorReport: ErrorReport): Promise<void> {
    if (errorReport.severity !== 'critical') {
      return;
    }

    try {
      // Import notification service dynamically
      const { notificationService } = await import('@/services/api/notificationService');

      await notificationService.showLocalNotification({
        title: 'App Error',
        body: 'Something went wrong. We\'re working to fix it.',
        data: { error_id: errorReport.id },
      });
    } catch (error) {
      console.error('Failed to show error notification:', error);
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get user agent information
   */
  private getUserAgent(): string {
    try {
      return global.navigator?.userAgent || 'Unknown';
    } catch (error) {
      return 'Unknown';
    }
  }

  /**
   * Get app version
   */
  private getAppVersion(): string {
    try {
      // This should be replaced with actual app version from package.json or config
      return '1.0.0';
    } catch (error) {
      return 'Unknown';
    }
  }

  /**
   * Get error statistics
   */
  async getErrorStats(): Promise<{
    total: number;
    pending: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  }> {
    const storedErrors = await this.getStoredErrors();
    const allErrors = [...storedErrors, ...this.errorQueue];

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    allErrors.forEach(error => {
      byType[error.error_type] = (byType[error.error_type] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
    });

    return {
      total: allErrors.length,
      pending: this.errorQueue.length,
      byType,
      bySeverity,
    };
  }

  /**
   * Clear all stored errors (for testing/debugging)
   */
  async clearAllErrors(): Promise<void> {
    this.errorQueue = [];
    await AsyncStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Force report all pending errors
   */
  async forceReportErrors(): Promise<void> {
    await this.reportErrors();
  }
}

// Export singleton instance
export const errorHandlingService = new ErrorHandlingService();
export default errorHandlingService;