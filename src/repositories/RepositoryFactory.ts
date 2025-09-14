import { SupabaseClient } from '@supabase/supabase-js';
import { PrayerRepository } from './PrayerRepository';
import { IPrayerRepository } from './interfaces/IPrayerRepository';

/**
 * Repository factory for creating and managing repository instances
 * Implements dependency injection pattern for better testability
 */
export class RepositoryFactory {
  private supabaseClient: SupabaseClient;
  private repositories: Map<string, any> = new Map();

  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }

  /**
   * Get prayer repository instance
   */
  getPrayerRepository(): IPrayerRepository {
    if (!this.repositories.has('prayer')) {
      this.repositories.set('prayer', new PrayerRepository(this.supabaseClient));
    }
    return this.repositories.get('prayer');
  }

  /**
   * Clear all repository instances (useful for testing)
   */
  clearRepositories(): void {
    this.repositories.clear();
  }

  /**
   * Replace a repository instance (useful for testing with mocks)
   */
  setRepository<T>(key: string, repository: T): void {
    this.repositories.set(key, repository);
  }
}

// Singleton instance
let repositoryFactory: RepositoryFactory | null = null;

/**
 * Get the global repository factory instance
 */
export function getRepositoryFactory(supabaseClient?: SupabaseClient): RepositoryFactory {
  if (!repositoryFactory) {
    if (!supabaseClient) {
      throw new Error('SupabaseClient is required to initialize RepositoryFactory');
    }
    repositoryFactory = new RepositoryFactory(supabaseClient);
  }
  return repositoryFactory;
}

/**
 * Initialize repository factory with Supabase client
 */
export function initializeRepositoryFactory(supabaseClient: SupabaseClient): void {
  repositoryFactory = new RepositoryFactory(supabaseClient);
}

/**
 * Clear the global repository factory (useful for testing)
 */
export function clearRepositoryFactory(): void {
  repositoryFactory = null;
}

export default RepositoryFactory;