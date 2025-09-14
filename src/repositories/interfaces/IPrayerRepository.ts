import { IPaginatedRepository, PaginatedResult, PaginationOptions } from './IBaseRepository';
import { Prayer, CreatePrayerRequest } from '@/types/database.types';

export interface PrayerFilters {
  userId?: string;
  groupId?: string;
  privacyLevel?: 'public' | 'friends' | 'private';
  status?: 'open' | 'answered' | 'closed';
  tags?: string[];
  locationCity?: string;
  createdAfter?: string;
  createdBefore?: string;
}

export interface PrayerSearchOptions extends PaginationOptions {
  searchQuery?: string;
  filters?: PrayerFilters;
  includeInteractions?: boolean;
  includeComments?: boolean;
  includeUser?: boolean;
}

/**
 * Prayer repository interface for managing prayer data operations
 */
export interface IPrayerRepository extends IPaginatedRepository<Prayer, CreatePrayerRequest, Partial<Prayer>> {
  /**
   * Find prayers for user's feed
   */
  findFeedPrayers(
    userId: string,
    feedType: 'following' | 'discover',
    options?: PrayerSearchOptions
  ): Promise<PaginatedResult<Prayer>>;

  /**
   * Find prayers by user ID
   */
  findByUserId(userId: string, options?: PaginationOptions): Promise<PaginatedResult<Prayer>>;

  /**
   * Find prayers by group ID
   */
  findByGroupId(groupId: string, options?: PaginationOptions): Promise<PaginatedResult<Prayer>>;

  /**
   * Find public prayers
   */
  findPublicPrayers(options?: PrayerSearchOptions): Promise<PaginatedResult<Prayer>>;

  /**
   * Search prayers by text content
   */
  searchPrayers(query: string, options?: PrayerSearchOptions): Promise<PaginatedResult<Prayer>>;

  /**
   * Find saved prayers for user
   */
  findSavedPrayers(userId: string, options?: PaginationOptions): Promise<PaginatedResult<Prayer>>;

  /**
   * Find prayers user has interacted with
   */
  findInteractedPrayers(
    userId: string,
    interactionType?: 'PRAY' | 'LIKE' | 'SHARE' | 'SAVE',
    options?: PaginationOptions
  ): Promise<PaginatedResult<Prayer>>;

  /**
   * Update prayer status
   */
  updateStatus(id: string, status: 'open' | 'answered' | 'closed'): Promise<Prayer>;

  /**
   * Increment view count
   */
  incrementViewCount(id: string): Promise<void>;

  /**
   * Get prayer statistics for user
   */
  getUserPrayerStats(userId: string): Promise<{
    totalPrayers: number;
    openPrayers: number;
    answeredPrayers: number;
    closedPrayers: number;
    totalInteractions: number;
    totalComments: number;
  }>;

  /**
   * Get trending prayers
   */
  findTrendingPrayers(options?: PaginationOptions): Promise<PaginatedResult<Prayer>>;

  /**
   * Find nearby prayers based on location
   */
  findNearbyPrayers(
    lat: number,
    lon: number,
    radiusKm: number,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Prayer>>;
}