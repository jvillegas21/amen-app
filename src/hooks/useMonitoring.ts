import React, { useEffect, useCallback, useState } from 'react';
import { monitoringService } from '@/services/monitoringService';
import { analyticsService } from '@/services/api/analyticsService';

export interface UseMonitoringOptions {
  trackScreenViews?: boolean;
  trackPerformance?: boolean;
  trackErrors?: boolean;
}

export interface UseMonitoringReturn {
  trackScreenView: (screenName: string) => Promise<void>;
  trackEvent: (eventName: string, data?: any) => Promise<void>;
  trackAPICall: (endpoint: string, method: string, startTime: number, statusCode: number, error?: Error) => Promise<void>;
  recordMetric: (name: string, value: number, unit: string) => Promise<void>;
  getPerformanceSummary: () => any;
  isMonitoring: boolean;
}

/**
 * Hook for monitoring and analytics
 */
export function useMonitoring(options: UseMonitoringOptions = {}): UseMonitoringReturn {
  const {
    trackScreenViews = true,
    trackPerformance = true,
    trackErrors = true,
  } = options;

  const [isMonitoring, setIsMonitoring] = useState(false);

  // Initialize monitoring on mount
  useEffect(() => {
    const initializeMonitoring = async () => {
      try {
        await monitoringService.initialize();
        setIsMonitoring(true);
      } catch (error) {
        console.error('Failed to initialize monitoring:', error);
      }
    };

    if (trackPerformance || trackErrors) {
      initializeMonitoring();
    }

    return () => {
      monitoringService.stop();
      setIsMonitoring(false);
    };
  }, [trackPerformance, trackErrors]);

  // Track screen view
  const trackScreenView = useCallback(async (screenName: string) => {
    if (trackScreenViews) {
      try {
        await analyticsService.trackScreenView(screenName);
      } catch (error) {
        console.error('Failed to track screen view:', error);
      }
    }
  }, [trackScreenViews]);

  // Track custom event
  const trackEvent = useCallback(async (eventName: string, data?: any) => {
    try {
      await analyticsService.trackEvent(eventName, data);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }, []);

  // Track API call
  const trackAPICall = useCallback(async (
    endpoint: string,
    method: string,
    startTime: number,
    statusCode: number,
    error?: Error
  ) => {
    if (trackPerformance) {
      try {
        await monitoringService.trackAPICall(endpoint, method, startTime, statusCode, error);
      } catch (monitoringError) {
        console.error('Failed to track API call:', monitoringError);
      }
    }
  }, [trackPerformance]);

  // Record custom metric
  const recordMetric = useCallback(async (name: string, value: number, unit: string) => {
    if (trackPerformance) {
      try {
        await monitoringService.recordMetric(name, 'gauge', value, unit);
      } catch (error) {
        console.error('Failed to record metric:', error);
      }
    }
  }, [trackPerformance]);

  // Get performance summary
  const getPerformanceSummary = useCallback(() => {
    return monitoringService.getPerformanceSummary();
  }, []);

  return {
    trackScreenView,
    trackEvent,
    trackAPICall,
    recordMetric,
    getPerformanceSummary,
    isMonitoring,
  };
}

/**
 * Hook for tracking component performance
 */
export function useComponentPerformance(componentName: string) {
  const { recordMetric } = useMonitoring();
  const [renderStart, setRenderStart] = useState<number | null>(null);

  useEffect(() => {
    const start = Date.now();
    setRenderStart(start);

    return () => {
      if (renderStart) {
        const renderTime = Date.now() - renderStart;
        recordMetric(`component_render_time_${componentName}`, renderTime, 'ms');
      }
    };
  }, [componentName, recordMetric, renderStart]);

  const trackInteraction = useCallback(async (interactionType: string) => {
    await recordMetric(`component_interaction_${componentName}_${interactionType}`, 1, 'count');
  }, [componentName, recordMetric]);

  return {
    trackInteraction,
  };
}

/**
 * Hook for tracking screen performance
 */
export function useScreenTracking(screenName: string) {
  const { trackScreenView, recordMetric } = useMonitoring();
  const [screenStart, setScreenStart] = useState<number | null>(null);

  useEffect(() => {
    const start = Date.now();
    setScreenStart(start);

    // Track screen view
    trackScreenView(screenName);

    return () => {
      // Track screen duration
      if (screenStart) {
        const duration = Date.now() - screenStart;
        recordMetric(`screen_duration_${screenName}`, duration, 'ms');
      }
    };
  }, [screenName, trackScreenView, recordMetric]);

  const trackScreenAction = useCallback(async (action: string, data?: any) => {
    await recordMetric(`screen_action_${screenName}_${action}`, 1, 'count');

    // Track custom event for the action
    const { trackEvent } = useMonitoring();
    await trackEvent(`screen_action`, {
      screen: screenName,
      action,
      ...data,
    });
  }, [screenName, recordMetric]);

  return {
    trackScreenAction,
  };
}

/**
 * HOC for automatic performance tracking
 */
export function withMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function MonitoredComponent(props: P) {
    useComponentPerformance(componentName);
    return React.createElement(WrappedComponent, props);
  };
}

export default useMonitoring;