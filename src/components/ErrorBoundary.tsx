import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { theme } from '@/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to analytics/monitoring service
    this.logError(error, errorInfo);
  }

  private async logError(error: Error, errorInfo: ErrorInfo) {
    try {
      // Import analytics service dynamically to avoid circular dependencies
      const { analyticsService } = await import('@/services/api/analyticsService');

      await analyticsService.trackEvent('error_boundary_triggered', {
        error_name: error.name,
        error_message: error.message,
        error_stack: error.stack,
        component_stack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });
    } catch (logError) {
      console.error('Failed to log error to analytics:', logError);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              We're sorry, but something unexpected happened.
              The error has been reported and we'll fix it as soon as possible.
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.handleRetry}
              accessibilityRole="button"
              accessibilityLabel="Try again to reload the app"
              accessibilityHint="Double tap to restart the application"
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.errorDetails}>
                <Text style={styles.errorDetailsTitle}>Error Details (Dev Mode)</Text>
                <Text style={styles.errorDetailsText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.errorDetailsText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing[5],
  },
  content: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[6],
    ...theme.shadows.base,
    shadowColor: theme.colors.neutral[1000],
    maxWidth: 400,
    width: '100%',
  },
  title: {
    ...theme.typography.heading.h1,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[3],
    textAlign: 'center',
  },
  message: {
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing[6],
  },
  retryButton: {
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[6],
    alignItems: 'center',
    minHeight: theme.layout.minTouchTarget,
    justifyContent: 'center',
  },
  retryButtonText: {
    color: theme.colors.text.inverse,
    ...theme.typography.button.medium,
  },
  errorDetails: {
    marginTop: theme.spacing[5],
    maxHeight: 200,
    backgroundColor: theme.colors.error[50],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[3],
    borderWidth: 1,
    borderColor: theme.colors.error[200],
  },
  errorDetailsTitle: {
    ...theme.typography.body.small,
    fontWeight: 'bold',
    color: theme.colors.error[600],
    marginBottom: theme.spacing[2],
  },
  errorDetailsText: {
    ...theme.typography.caption.medium,
    color: theme.colors.error[800],
    fontFamily: 'monospace',
  },
});

export default ErrorBoundary;