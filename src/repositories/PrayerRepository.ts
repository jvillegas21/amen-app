import { SupabaseClient } from '@supabase/supabase-js';
import { BaseSupabaseRepository } from './base/BaseSupabaseRepository';
import {
  IPrayerRepository,
  PrayerFilters,
  PrayerSearchOptions,
} from './interfaces/IPrayerRepository';
import { Prayer, CreatePrayerRequest } from '@/types/database.types';
import { PaginatedResult, PaginationOptions } from './interfaces/IBaseRepository';
import { requestBatchingService } from '@/services/performance/requestBatchingService';

/**
 * Prayer repository implementation using Supabase
 */
export class PrayerRepository
  extends BaseSupabaseRepository<Prayer, CreatePrayerRequest, Partial<Prayer>>
  implements IPrayerRepository
{
  constructor(supabase: SupabaseClient) {
    super(supabase, 'prayers');
  }

  /**
   * Get prayer by ID using batched request for performance
   */
  async findByIdBatched(id: string): Promise<Prayer | null> {
    try {
      const result = await requestBatchingService.batchRequest<Prayer>(
        'prayers',
        'select',
        { id },
        'high'
      );
      return result;
    } catch (error) {
      console.error('Batched prayer fetch failed, falling back to direct query:', error);
      return this.findById(id);
    }
  }

  /**
   * Create prayer using batched request
   */
  async createBatched(data: CreatePrayerRequest): Promise<Prayer> {
    try {
      const result = await requestBatchingService.batchRequest<Prayer>(
        'prayers',
        'insert',
        { data },
        'medium'
      );
      return result;
    } catch (error) {
      console.error('Batched prayer creation failed, falling back to direct insert:', error);
      return this.create(data);
    }
  }

  /**
   * Apply prayer-specific filters to query
   */
  private applyPrayerFilters(query: any, filters?: PrayerFilters) {
    if (!filters) return query;

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.groupId) {
      query = query.eq('group_id', filters.groupId);
    }

    if (filters.privacyLevel) {
      query = query.eq('privacy_level', filters.privacyLevel);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    if (filters.locationCity) {
      query = query.ilike('location_city', `%${filters.locationCity}%`);
    }

    if (filters.createdAfter) {
      query = query.gte('created_at', filters.createdAfter);
    }

    if (filters.createdBefore) {
      query = query.lte('created_at', filters.createdBefore);
    }

    return query;
  }

  /**
   * Build select clause with includes
   */
  private buildSelectClause(options?: PrayerSearchOptions): string {
    let select = '*';

    if (options?.includeUser) {
      select += ', user:profiles!user_id(*)';
    }

    if (options?.includeInteractions) {
      select += ', interaction_count:interactions(count)';
    }

    if (options?.includeComments) {
      select += ', comment_count:comments(count)';
    }

    return select;
  }

  async findFeedPrayers(
    userId: string,
    feedType: 'following' | 'discover',
    options?: PrayerSearchOptions
  ): Promise<PaginatedResult<Prayer>> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let query = this.supabase.from('prayers').select(
      this.buildSelectClause(options),
      { count: 'exact' }
    );

    // Apply feed type logic
    if (feedType === 'discover') {
      query = query.eq('privacy_level', 'public');
    } else {
      // Following feed - get prayers from followed users and public prayers
      query = query.in('privacy_level', ['public', 'friends']);
      // TODO: Add following relationship filter
    }

    // Apply filters
    query = this.applyPrayerFilters(query, options?.filters);

    // Apply search if provided
    if (options?.searchQuery) {
      query = query.textSearch('text', options.searchQuery, {
        type: 'websearch',
        config: 'english',
      });
    }

    // Apply ordering and pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch feed prayers: ${error.message}`);
    }

    const pagination = this.calculatePagination(count || 0, page, pageSize);

    return { data: data || [], pagination };
  }

  async findByUserId(
    userId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Prayer>> {
    return this.findPaginated({ user_id: userId }, options);
  }

  async findByGroupId(
    groupId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Prayer>> {
    return this.findPaginated({ group_id: groupId }, options);
  }

  async findPublicPrayers(options?: PrayerSearchOptions): Promise<PaginatedResult<Prayer>> {
    const filters: PrayerFilters = {
      ...options?.filters,
      privacyLevel: 'public',
    };

    return this.findPaginated(filters, {
      ...options,
      orderBy: 'created_at',
      orderDirection: 'desc',
    });
  }

  async searchPrayers(
    query: string,
    options?: PrayerSearchOptions
  ): Promise<PaginatedResult<Prayer>> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let supabaseQuery = this.supabase.from('prayers').select(
      this.buildSelectClause(options),
      { count: 'exact' }
    );

    // Apply text search
    supabaseQuery = supabaseQuery.textSearch('text', query, {
      type: 'websearch',
      config: 'english',
    });

    // Apply filters
    supabaseQuery = this.applyPrayerFilters(supabaseQuery, options?.filters);

    // Apply ordering and pagination
    supabaseQuery = supabaseQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data, error, count } = await supabaseQuery;

    if (error) {
      throw new Error(`Failed to search prayers: ${error.message}`);
    }

    const pagination = this.calculatePagination(count || 0, page, pageSize);

    return { data: data || [], pagination };
  }

  async findSavedPrayers(
    userId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Prayer>> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const { data, error, count } = await this.supabase
      .from('interactions')
      .select(`
        prayer:prayers!prayer_id(
          *,
          user:profiles!user_id(*),
          interaction_count:interactions(count),
          comment_count:comments(count)
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .eq('type', 'SAVE')
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error(`Failed to fetch saved prayers: ${error.message}`);
    }

    const prayers = data?.map(item => item.prayer).filter(Boolean) as Prayer[] || [];
    const pagination = this.calculatePagination(count || 0, page, pageSize);

    return { data: prayers, pagination };
  }

  async findInteractedPrayers(
    userId: string,
    interactionType?: 'PRAY' | 'LIKE' | 'SHARE' | 'SAVE',
    options?: PaginationOptions
  ): Promise<PaginatedResult<Prayer>> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let query = this.supabase
      .from('interactions')
      .select(`
        prayer:prayers!prayer_id(
          *,
          user:profiles!user_id(*),
          interaction_count:interactions(count),
          comment_count:comments(count)
        )
      `, { count: 'exact' })
      .eq('user_id', userId);

    if (interactionType) {
      query = query.eq('type', interactionType);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error(`Failed to fetch interacted prayers: ${error.message}`);
    }

    const prayers = data?.map(item => item.prayer).filter(Boolean) as Prayer[] || [];
    const pagination = this.calculatePagination(count || 0, page, pageSize);

    return { data: prayers, pagination };
  }

  async updateStatus(id: string, status: 'open' | 'answered' | 'closed'): Promise<Prayer> {
    const { data, error } = await this.supabase
      .from('prayers')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update prayer status: ${error.message}`);
    }

    if (!data) {
      throw new Error('Prayer not found');
    }

    return data;
  }

  async incrementViewCount(id: string): Promise<void> {
    const { error } = await this.supabase.rpc('increment_prayer_view_count', {
      prayer_id: id,
    });

    if (error) {
      throw new Error(`Failed to increment view count: ${error.message}`);
    }
  }

  async getUserPrayerStats(userId: string): Promise<{
    totalPrayers: number;
    openPrayers: number;
    answeredPrayers: number;
    closedPrayers: number;
    totalInteractions: number;
    totalComments: number;
  }> {
    const { data, error } = await this.supabase.rpc('get_user_prayer_stats', {
      user_id: userId,
    });

    if (error) {
      throw new Error(`Failed to get user prayer stats: ${error.message}`);
    }

    return data || {
      totalPrayers: 0,
      openPrayers: 0,
      answeredPrayers: 0,
      closedPrayers: 0,
      totalInteractions: 0,
      totalComments: 0,
    };
  }

  async findTrendingPrayers(options?: PaginationOptions): Promise<PaginatedResult<Prayer>> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    // Find trending prayers based on recent interactions
    const { data, error, count } = await this.supabase
      .from('prayers')
      .select(`
        *,
        user:profiles!user_id(*),
        interaction_count:interactions(count),
        comment_count:comments(count)
      `, { count: 'exact' })
      .eq('privacy_level', 'public')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .order('interaction_count', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error(`Failed to fetch trending prayers: ${error.message}`);
    }

    const pagination = this.calculatePagination(count || 0, page, pageSize);

    return { data: data || [], pagination };
  }

  async findNearbyPrayers(
    lat: number,
    lon: number,
    radiusKm: number,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Prayer>> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const { data, error, count } = await this.supabase
      .rpc('find_nearby_prayers', {
        center_lat: lat,
        center_lon: lon,
        radius_km: radiusKm,
      })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error(`Failed to find nearby prayers: ${error.message}`);
    }

    const pagination = this.calculatePagination(count || data?.length || 0, page, pageSize);

    return { data: data || [], pagination };
  }
}