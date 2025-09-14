import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { errorHandlingService } from '@/services/errorHandlingService';
import ErrorBoundary from './ErrorBoundary';
import useErrorHandler from '@/hooks/useErrorHandler';

interface ErrorContextType {
  handleError: (error: Error | string, options?: any) => Promise<string>;
  reportError: (error: Error | string, context?: Record<string, any>) => Promise<string>;
  clearErrors: () => Promise<void>;
  errorStats: {
    total: number;
    pending: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  };
}

const ErrorContext = createContext<ErrorContextType | null>(null);

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

interface ErrorProviderProps {
  children: ReactNode;
  enableGlobalHandling?: boolean;
  showErrorBoundary?: boolean;
}

export function ErrorProvider({
  children,
  enableGlobalHandling = true,
  showErrorBoundary = true,
}: ErrorProviderProps) {
  const errorHandler = useErrorHandler();

  useEffect(() => {
    if (enableGlobalHandling) {
      // Initialize global error handling
      errorHandlingService.initialize();
    }
  }, [enableGlobalHandling]);

  const content = (
    <ErrorContext.Provider
      value={{
        handleError: errorHandler.handleError,
        reportError: errorHandler.reportError,
        clearErrors: errorHandler.clearErrors,
        errorStats: errorHandler.errorStats,
      }}
    >
      {children}
    </ErrorContext.Provider>
  );

  if (showErrorBoundary) {
    return (
      <ErrorBoundary
        onError={(error, errorInfo) => {
          errorHandler.handleError(error, {
            severity: 'critical',
            context: {
              component_stack: errorInfo.componentStack,
              action: 'component_error_boundary',
            },
            reportToService: true,
            showUserNotification: true,
          });
        }}
      >
        {content}
      </ErrorBoundary>
    );
  }

  return content;
}

export default ErrorProvider;