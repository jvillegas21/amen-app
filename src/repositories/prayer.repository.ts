import { supabase } from '@/config/supabase';
import { Prayer, CreatePrayerRequest, UpdatePrayerRequest } from '@/types/database.types';
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
        } as any);

      if (error) {
        this.handleError(error, 'getPrayersWithDetails (following)');
      }

      // Transform the data to match our Prayer interface
      return ((data as any[]) || []).map((prayer: any) => ({
        id: prayer.id,
        user_id: prayer.user_id,
        text: prayer.text,
        privacy_level: prayer.privacy_level,
        status: prayer.status,
        created_at: prayer.created_at,
        location_city: prayer.location_city,
        location_lat: prayer.location_lat,
        location_lon: prayer.location_lon,
        location_granularity: prayer.location_granularity,
        user: {
          id: prayer.user_id,
          display_name: prayer.display_name, // Use the actual field name from the function
          avatar_url: prayer.avatar_url, // Use the actual field name from the function
        },
        pray_count: prayer.interaction_counts?.pray_count || 0,
        like_count: prayer.interaction_counts?.like_count || 0,
        comment_count: prayer.comment_count || 0,
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
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);


    // Apply filters
    if (groupId) {
      query = query.eq('group_id', groupId);
    } else if (feedType === 'discover') {
      query = query.eq('privacy_level', 'public');
    }

    const { data, error } = await query as any;

    if (error) {
      this.handleError(error, 'getPrayersWithDetails (discover)');
    }

    // Transform the data to calculate interaction counts
    const prayers = (data as any[]) || [];
    
    // Get comment counts for all prayers in parallel
    const commentCounts = await Promise.all(
      prayers.map(async (prayer: any) => {
        const { count } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('prayer_id', prayer.id);
        return { prayerId: prayer.id, count: count || 0 };
      })
    );
    
    // Create a map for quick lookup
    const commentCountMap = commentCounts.reduce((acc, item) => {
      acc[item.prayerId] = item.count;
      return acc;
    }, {} as Record<string, number>);
    
    return prayers.map((prayer: any) => {
      const interactions = prayer.interactions || [];
      const prayCount = interactions.filter((i: any) => i.type === 'PRAY').length;
      const likeCount = interactions.filter((i: any) => i.type === 'LIKE').length;
      const saveCount = interactions.filter((i: any) => i.type === 'SAVE').length;
      const shareCount = interactions.filter((i: any) => i.type === 'SHARE').length;
      
      return {
        ...prayer,
        pray_count: prayCount,
        like_count: likeCount,
        save_count: saveCount,
        share_count: shareCount,
        comment_count: commentCountMap[prayer.id] || 0,
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
        comment_count:comments(count)
      `)
      .eq('id', prayerId)
      .maybeSingle();

    if (error) {
      this.handleError(error, `getPrayerWithDetails(${prayerId})`);
    }

    if (!data) return null;

    // Calculate interaction counts
    const interactions = (data as any).interactions || [];
    const prayCount = interactions.filter((i: any) => i.type === 'PRAY').length;
    const likeCount = interactions.filter((i: any) => i.type === 'LIKE').length;
    const saveCount = interactions.filter((i: any) => i.type === 'SAVE').length;
    const shareCount = interactions.filter((i: any) => i.type === 'SHARE').length;
    
    // Find user's specific interaction
    const userInteraction = userId 
      ? interactions.find((i: any) => i.user_id === userId)
      : null;

    return {
      ...(data as any),
      pray_count: prayCount,
      like_count: likeCount,
      comment_count: (data as any).comment_count || 0,
      user_interaction: userInteraction,
      save_count: saveCount,
      share_count: shareCount,
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
      location_city: prayerData.location_city,
      location_lat: prayerData.location_lat,
      location_lon: prayerData.location_lon,
      location_granularity: prayerData.location_granularity || 'hidden',
      group_id: prayerData.group_id,
      is_anonymous: prayerData.is_anonymous || false,
      tags: prayerData.tags || [],
      category: prayerData.category, // Store category for backward compatibility
      images: prayerData.images || [],
      status: 'open' as const,
    };

    return this.executeQuery(
      () => (supabase
        .from('prayers')
        .insert(prayer as any)
        .select(`
          *,
          user:profiles!user_id(
            id,
            display_name,
            avatar_url
          )
        `)
        .single() as any),
      'createPrayer'
    );
  }

  /**
   * Update prayer with proper validation and authorization
   */
  async updatePrayer(prayerId: string, prayerData: UpdatePrayerRequest, userId: string): Promise<Prayer> {
    // First verify the user owns this prayer
    const { data: existingPrayer, error: fetchError } = await supabase
      .from('prayers')
      .select('user_id')
      .eq('id', prayerId)
      .single() as any;

    if (fetchError) {
      this.handleError(fetchError, `updatePrayer(${prayerId}) - fetch`);
    }

    if (!existingPrayer) {
      throw new Error('Prayer not found');
    }

    if (existingPrayer.user_id !== userId) {
      throw new Error('Unauthorized: You can only edit your own prayers');
    }

    // Use the base repository update method and then fetch the updated prayer with user data
    await this.update(prayerId, {
      ...prayerData,
      updated_at: new Date().toISOString(),
    } as any);

    // Fetch the updated prayer with user information
    return this.getPrayerWithDetails(prayerId, userId) as Promise<Prayer>;
  }

  /**
   * Delete prayer with proper authorization
   */
  async deletePrayer(prayerId: string, userId: string): Promise<void> {
    // First verify the user owns this prayer
    const { data: existingPrayer, error: fetchError } = await supabase
      .from('prayers')
      .select('user_id')
      .eq('id', prayerId)
      .single() as any;

    if (fetchError) {
      this.handleError(fetchError, `deletePrayer(${prayerId}) - fetch`);
    }

    if (!existingPrayer) {
      throw new Error('Prayer not found');
    }

    if (existingPrayer.user_id !== userId) {
      throw new Error('Unauthorized: You can only delete your own prayers');
    }

    const { error } = await supabase
      .from('prayers')
      .delete()
      .eq('id', prayerId);

    if (error) {
      this.handleError(error, `deletePrayer(${prayerId})`);
    }
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

    return ((data as any[]) || []).map((prayer: any) => {
      const interactions = prayer.interactions || [];
      const prayCount = interactions.filter((i: any) => i.type === 'PRAY').length;
      const likeCount = interactions.filter((i: any) => i.type === 'LIKE').length;
      
      return {
        ...prayer,
        pray_count: prayCount,
        like_count: likeCount,
        comment_count: prayer.comment_count || 0,
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

    return ((data as any[]) || []).map((prayer: any) => {
      const interactions = prayer.interactions || [];
      const prayCount = interactions.filter((i: any) => i.type === 'PRAY').length;
      const likeCount = interactions.filter((i: any) => i.type === 'LIKE').length;
      
      return {
        ...prayer,
        pray_count: prayCount,
        like_count: likeCount,
        comment_count: prayer.comment_count || 0,
      };
    });
  }
}
