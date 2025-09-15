import { supabase } from '@/config/supabase';
import { Prayer, CreatePrayerRequest } from '@/types/database.types';
import { BaseRepositoryImpl } from './base.repository';

/**
 * Prayer Repository
 * Handles all prayer-related database operations with optimized queries
 */
export class PrayerRepository extends BaseRepositoryImpl<Prayer> {
  constructor() {
    super('prayers');
  }

  /**
   * Get prayers with user information and interaction counts in a single query
   * Fixes N+1 query problem by using joins and aggregations
   */
  async getPrayersWithDetails(params: {
    feedType: 'following' | 'discover';
    groupId?: string;
    page: number;
    limit: number;
    userId?: string;
  }): Promise<Prayer[]> {
    const { feedType, groupId, page, limit, userId } = params;
    const offset = (page - 1) * limit;

    if (feedType === 'following' && userId) {
      // Use the optimized database function for following feed
      const { data, error } = await supabase
        .rpc('get_user_feed_prayers', {
          user_uuid: userId,
          limit_count: limit,
          offset_count: offset
        });

      if (error) {
        this.handleError(error, 'getPrayersWithDetails (following)');
      }

      // Transform the data to match our Prayer interface
      return (data || []).map((prayer: any) => ({
        id: prayer.id,
        user_id: prayer.user_id,
        text: prayer.text,
        privacy_level: prayer.privacy_level,
        status: prayer.status,
        created_at: prayer.created_at,
        user: {
          id: prayer.user_id,
          display_name: prayer.user_display_name,
          avatar_url: prayer.user_avatar_url,
        },
        pray_count: 0, // Will be populated by interaction counts
        like_count: 0,
        comment_count: prayer.comment_count || 0,
        interaction_count: prayer.interaction_count || 0,
      })) as Prayer[];
    }

    // For discover feed or when no user ID, use optimized query with joins
    let query = supabase
      .from('prayers')
      .select(`
        *,
        user:profiles!user_id(
          id,
          display_name,
          avatar_url
        ),
        interactions:interactions(
          type,
          user_id
        ),
        comment_count:comments(count)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (groupId) {
      query = query.eq('group_id', groupId);
    } else if (feedType === 'discover') {
      query = query.eq('privacy_level', 'public');
    }

    const { data, error } = await query;

    if (error) {
      this.handleError(error, 'getPrayersWithDetails (discover)');
    }

    // Transform the data to calculate interaction counts
    return (data || []).map(prayer => {
      const interactions = prayer.interactions || [];
      const prayCount = interactions.filter((i: any) => i.type === 'PRAY').length;
      const likeCount = interactions.filter((i: any) => i.type === 'LIKE').length;
      
      return {
        ...prayer,
        pray_count: prayCount,
        like_count: likeCount,
        comment_count: prayer.comment_count || 0,
        interaction_count: interactions.length,
      };
    });
  }

  /**
   * Get single prayer with all related data in one query
   */
  async getPrayerWithDetails(prayerId: string, userId?: string): Promise<Prayer | null> {
    const { data, error } = await supabase
      .from('prayers')
      .select(`
        *,
        user:profiles!user_id(
          id,
          display_name,
          avatar_url
        ),
        interactions:interactions(
          type,
          user_id
        ),
        comment_count:comments(count),
        user_interaction:interactions!user_interaction(
          *
        )
      `)
      .eq('id', prayerId)
      .maybeSingle();

    if (error) {
      this.handleError(error, `getPrayerWithDetails(${prayerId})`);
    }

    if (!data) return null;

    // Calculate interaction counts
    const interactions = data.interactions || [];
    const prayCount = interactions.filter((i: any) => i.type === 'PRAY').length;
    const likeCount = interactions.filter((i: any) => i.type === 'LIKE').length;
    
    // Find user's specific interaction
    const userInteraction = userId 
      ? interactions.find((i: any) => i.user_id === userId)
      : null;

    return {
      ...data,
      pray_count: prayCount,
      like_count: likeCount,
      comment_count: data.comment_count || 0,
      interaction_count: interactions.length,
      user_interaction: userInteraction,
    };
  }

  /**
   * Create prayer with proper validation
   */
  async createPrayer(prayerData: CreatePrayerRequest, userId: string): Promise<Prayer> {
    const prayer = {
      user_id: userId,
      text: prayerData.text,
      privacy_level: prayerData.privacy_level,
      location_city: prayerData.location?.city,
      location_lat: prayerData.location?.lat,
      location_lon: prayerData.location?.lon,
      location_granularity: prayerData.location?.granularity || 'hidden',
      group_id: prayerData.group_id,
      is_anonymous: prayerData.is_anonymous || false,
      tags: prayerData.tags || [],
      images: prayerData.images || [],
      status: 'open' as const,
    };

    return this.executeQuery(
      () => supabase
        .from('prayers')
        .insert(prayer)
        .select(`
          *,
          user:profiles!user_id(
            id,
            display_name,
            avatar_url
          )
        `)
        .single(),
      'createPrayer'
    );
  }

  /**
   * Get user's prayers with pagination
   */
  async getUserPrayers(userId: string, page = 1, limit = 20): Promise<Prayer[]> {
    const offset = (page - 1) * limit;

    const { data, error } = await supabase
      .from('prayers')
      .select(`
        *,
        user:profiles!user_id(
          id,
          display_name,
          avatar_url
        ),
        interactions:interactions(
          type
        ),
        comment_count:comments(count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.handleError(error, `getUserPrayers(${userId})`);
    }

    return (data || []).map(prayer => {
      const interactions = prayer.interactions || [];
      const prayCount = interactions.filter((i: any) => i.type === 'PRAY').length;
      const likeCount = interactions.filter((i: any) => i.type === 'LIKE').length;
      
      return {
        ...prayer,
        pray_count: prayCount,
        like_count: likeCount,
        comment_count: prayer.comment_count || 0,
        interaction_count: interactions.length,
      };
    });
  }

  /**
   * Search prayers with full-text search
   */
  async searchPrayers(query: string, filters?: {
    tags?: string[];
    location?: string;
    status?: 'open' | 'answered' | 'closed';
  }): Promise<Prayer[]> {
    let supabaseQuery = supabase
      .from('prayers')
      .select(`
        *,
        user:profiles!user_id(
          id,
          display_name,
          avatar_url
        ),
        interactions:interactions(
          type
        ),
        comment_count:comments(count)
      `)
      .textSearch('text', query, {
        type: 'websearch',
        config: 'english',
      });

    if (filters?.tags?.length) {
      supabaseQuery = supabaseQuery.contains('tags', filters.tags);
    }

    if (filters?.location) {
      supabaseQuery = supabaseQuery.ilike('location_city', `%${filters.location}%`);
    }

    if (filters?.status) {
      supabaseQuery = supabaseQuery.eq('status', filters.status);
    }

    const { data, error } = await supabaseQuery;

    if (error) {
      this.handleError(error, 'searchPrayers');
    }

    return (data || []).map(prayer => {
      const interactions = prayer.interactions || [];
      const prayCount = interactions.filter((i: any) => i.type === 'PRAY').length;
      const likeCount = interactions.filter((i: any) => i.type === 'LIKE').length;
      
      return {
        ...prayer,
        pray_count: prayCount,
        like_count: likeCount,
        comment_count: prayer.comment_count || 0,
        interaction_count: interactions.length,
      };
    });
  }
}