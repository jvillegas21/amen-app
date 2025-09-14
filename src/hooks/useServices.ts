import { useCallback } from 'react';
import { getService, Services } from '@/container/serviceSetup';

/**
 * Hook for accessing services from the DI container
 */
export function useServices() {
  const getServiceInstance = useCallback(<T>(name: string): T => {
    return getService<T>(name);
  }, []);

  return {
    // Service accessor
    getService: getServiceInstance,

    // Direct service accessors
    aiService: Services.aiService,
    offlineSyncService: Services.offlineSyncService,
    realtimeService: Services.realtimeService,
    errorHandlingService: Services.errorHandlingService,
    prayerRepository: Services.prayerRepository,
    prayerService: Services.prayerService,
    bibleStudyService: Services.bibleStudyService,
    logger: Services.logger,
    appConfig: Services.appConfig,
  };
}

/**
 * Hook for accessing a specific service
 */
export function useService<T>(serviceName: string): T {
  return getService<T>(serviceName);
}

/**
 * Hook for accessing the AI service
 */
export function useAIService() {
  return Services.aiService;
}

/**
 * Hook for accessing the offline sync service
 */
export function useOfflineSyncService() {
  return Services.offlineSyncService;
}

/**
 * Hook for accessing the realtime service
 */
export function useRealtimeService() {
  return Services.realtimeService;
}

/**
 * Hook for accessing the prayer repository
 */
export function usePrayerRepository() {
  return Services.prayerRepository;
}

/**
 * Hook for accessing the prayer service
 */
export function usePrayerService() {
  return Services.prayerService;
}

/**
 * Hook for accessing the Bible study service
 */
export function useBibleStudyService() {
  return Services.bibleStudyService;
}

/**
 * Hook for accessing the logger
 */
export function useLogger() {
  return Services.logger;
}

/**
 * Hook for accessing app configuration
 */
export function useAppConfig() {
  return Services.appConfig;
}

export default useServices;