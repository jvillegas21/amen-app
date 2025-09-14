import { useCallback, useEffect, useState } from 'react';
import { errorHandlingService, ErrorHandlerOptions } from '@/services/errorHandlingService';

export interface UseErrorHandlerReturn {
  handleError: (error: Error | string, options?: ErrorHandlerOptions) => Promise<string>;
  reportError: (error: Error | string, context?: Record<string, any>) => Promise<string>;
  clearErrors: () => Promise<void>;
  errorStats: {
    total: number;
    pending: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  };
  isReporting: boolean;
}

/**
 * Hook for handling errors in React components
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const [errorStats, setErrorStats] = useState({
    total: 0,
    pending: 0,
    byType: {},
    bySeverity: {},
  });
  const [isReporting, setIsReporting] = useState(false);

  // Handle error with full options
  const handleError = useCallback(async (
    error: Error | string,
    options: ErrorHandlerOptions = {}
  ): Promise<string> => {
    setIsReporting(true);
    try {
      const errorId = await errorHandlingService.handleError(error, options);

      // Update stats
      const stats = await errorHandlingService.getErrorStats();
      setErrorStats(stats);

      return errorId;
    } finally {
      setIsReporting(false);
    }
  }, []);

  // Quick error reporting with context
  const reportError = useCallback(async (
    error: Error | string,
    context: Record<string, any> = {}
  ): Promise<string> => {
    return handleError(error, {
      context: {
        additional_data: context,
      },
      severity: 'medium',
      reportToService: true,
    });
  }, [handleError]);

  // Clear all errors
  const clearErrors = useCallback(async () => {
    await errorHandlingService.clearAllErrors();
    const stats = await errorHandlingService.getErrorStats();
    setErrorStats(stats);
  }, []);

  // Load error stats on mount
  useEffect(() => {
    const loadStats = async () => {
      const stats = await errorHandlingService.getErrorStats();
      setErrorStats(stats);
    };

    loadStats();
  }, []);

  return {
    handleError,
    reportError,
    clearErrors,
    errorStats,
    isReporting,
  };
}

/**
 * Hook for handling async operations with automatic error handling
 */
export function useAsyncError() {
  const { handleError } = useErrorHandler();

  const wrapAsync = useCallback(
    <T extends any[], R>(
      asyncFn: (...args: T) => Promise<R>,
      options: ErrorHandlerOptions = {}
    ) => {
      return async (...args: T): Promise<R | null> => {
        try {
          return await asyncFn(...args);
        } catch (error) {
          await handleError(error as Error, {
            severity: 'medium',
            reportToService: true,
            ...options,
          });
          return null;
        }
      };
    },
    [handleError]
  );

  return { wrapAsync };
}

/**
 * Hook for network request error handling
 */
export function useNetworkError() {
  const { handleError } = useErrorHandler();

  const handleNetworkError = useCallback(
    async (error: Error, requestContext?: {
      url?: string;
      method?: string;
      statusCode?: number;
      requestData?: any;
    }) => {
      return handleError(error, {
        severity: error.message.includes('timeout') ? 'medium' : 'high',
        context: {
          action: 'network_request',
          additional_data: requestContext,
        },
        reportToService: true,
      });
    },
    [handleError]
  );

  return { handleNetworkError };
}

/**
 * Hook for API error handling
 */
export function useApiError() {
  const { handleError } = useErrorHandler();

  const handleApiError = useCallback(
    async (error: Error, apiContext?: {
      endpoint?: string;
      method?: string;
      statusCode?: number;
      response?: any;
    }) => {
      const severity =
        apiContext?.statusCode && apiContext.statusCode >= 500 ? 'high' :
        apiContext?.statusCode && apiContext.statusCode >= 400 ? 'medium' :
        'low';

      return handleError(error, {
        severity,
        context: {
          action: 'api_request',
          additional_data: apiContext,
        },
        reportToService: true,
      });
    },
    [handleError]
  );

  return { handleApiError };
}

export default useErrorHandler;