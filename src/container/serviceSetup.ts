import { supabase } from '@/config/supabase';
import { getContainer } from './DIContainer';

// Import services
import { aiService } from '@/services/aiService';
import { offlineSyncService } from '@/services/offlineSyncService';
import { realtimeService } from '@/services/realtimeService';
import { errorHandlingService } from '@/services/errorHandlingService';

// Import repositories
import { getRepositoryFactory, initializeRepositoryFactory } from '@/repositories/RepositoryFactory';

// Import API services
import { prayerService } from '@/services/api/prayerService';
import { bibleStudyService } from '@/services/api/bibleStudyService';

/**
 * Setup all services in the dependency injection container
 */
export function setupServices(): void {
  const container = getContainer();

  // Clear existing services
  container.clear();

  // Initialize repository factory
  initializeRepositoryFactory(supabase);

  // Register core services
  container.registerInstance('supabaseClient', supabase);
  container.registerInstance('aiService', aiService);
  container.registerInstance('offlineSyncService', offlineSyncService);
  container.registerInstance('realtimeService', realtimeService);
  container.registerInstance('errorHandlingService', errorHandlingService);

  // Register repository factory
  container.registerFactory(
    'repositoryFactory',
    () => getRepositoryFactory(supabase),
    ['supabaseClient']
  );

  // Register repositories
  container.registerFactory(
    'prayerRepository',
    () => getRepositoryFactory().getPrayerRepository(),
    ['repositoryFactory']
  );

  // Register API services
  container.registerInstance('prayerService', prayerService);
  container.registerInstance('bibleStudyService', bibleStudyService);

  // Register utility services
  container.registerFactory(
    'logger',
    () => ({
      info: (message: string, data?: any) => console.log(message, data),
      warn: (message: string, data?: any) => console.warn(message, data),
      error: (message: string, data?: any) => console.error(message, data),
      debug: (message: string, data?: any) => console.debug(message, data),
    }),
    []
  );

  // Register configuration
  container.registerInstance('appConfig', {
    apiUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    apiKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    openaiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
}

/**
 * Get a service from the container with type safety
 */
export function getService<T>(name: string): T {
  const container = getContainer();
  return container.resolve<T>(name);
}

/**
 * Register a custom service
 */
export function registerService<T>(
  name: string,
  factory: () => T,
  dependencies: string[] = []
): void {
  const container = getContainer();
  container.registerFactory(name, factory, dependencies);
}

/**
 * Service accessor functions for commonly used services
 */
export const Services = {
  get aiService() {
    return getService<typeof aiService>('aiService');
  },

  get offlineSyncService() {
    return getService<typeof offlineSyncService>('offlineSyncService');
  },

  get realtimeService() {
    return getService<typeof realtimeService>('realtimeService');
  },

  get errorHandlingService() {
    return getService<typeof errorHandlingService>('errorHandlingService');
  },

  get prayerRepository() {
    return getService<ReturnType<typeof getRepositoryFactory>['getPrayerRepository']>('prayerRepository');
  },

  get prayerService() {
    return getService<typeof prayerService>('prayerService');
  },

  get bibleStudyService() {
    return getService<typeof bibleStudyService>('bibleStudyService');
  },

  get logger() {
    return getService<{
      info: (message: string, data?: any) => void;
      warn: (message: string, data?: any) => void;
      error: (message: string, data?: any) => void;
      debug: (message: string, data?: any) => void;
    }>('logger');
  },

  get appConfig() {
    return getService<{
      apiUrl: string;
      apiKey: string;
      openaiApiKey: string;
      environment: string;
      version: string;
    }>('appConfig');
  },
};

export default setupServices;