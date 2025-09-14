import { supabase } from '@/config/supabase';
import { Prayer, CreatePrayerRequest, PrayerInteractionRequest } from '@/types/database.types';

/**
 * Prayer Service - Manages prayer-related API operations
 * Follows Single Responsibility Principle: Only handles prayer data operations
 */
class PrayerService {
  /**
   * Fetch prayers based on feed type
   */
  async fetchPrayers(params: {
    feedType: 'following' | 'discover';
    groupId?: string;
    page: number;
    limit: number;
  }): Promise<Prayer[]> {
    let query = supabase
      .from('prayers')
      .select(`
        *,
        user:profiles!user_id(*),
        interaction_count:interactions(count),
        comment_count:comments(count)
      `)
      .order('created_at', { ascending: false })
      .range((params.page - 1) * params.limit, params.page * params.limit - 1);

    // Apply filters based on feed type
    if (params.groupId) {
      query = query.eq('group_id', params.groupId);
    } else if (params.feedType === 'discover') {
      query = query.eq('privacy_level', 'public');
    } else {
      // Following feed - would need to join with following table
      query = query.in('privacy_level', ['public', 'friends']);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Get single prayer by ID
   */
  async getPrayer(prayerId: string): Promise<Prayer> {
    const { data, error } = await supabase
      .from('prayers')
      .select(`
        *,
        user:profiles!user_id(*),
        interaction_count:interactions(count),
        comment_count:comments(count),
        user_interaction:interactions!inner(
          *
        )
      `)
      .eq('id', prayerId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Prayer not found');
    return data;
  }

  /**
   * Create new prayer
   */
  async createPrayer(prayer: CreatePrayerRequest): Promise<Prayer> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error in createPrayer:', authError);
        throw new Error(`Authentication error: ${authError.message}`);
      }
      if (!user) {
        throw new Error('Not authenticated - no user found');
      }

      console.log('Creating prayer for user:', user.id);
      console.log('Prayer data:', {
        text: prayer.text?.substring(0, 50) + '...',
        privacy_level: prayer.privacy_level,
        location: prayer.location,
        group_id: prayer.group_id,
        is_anonymous: prayer.is_anonymous,
        tags: prayer.tags,
        images: prayer.images
      });

      const prayerData = {
        user_id: user.id,
        text: prayer.text,
        privacy_level: prayer.privacy_level,
        location_city: prayer.location?.city,
        location_lat: prayer.location?.lat,
        location_lon: prayer.location?.lon,
        location_granularity: prayer.location?.granularity || 'hidden',
        group_id: prayer.group_id,
        is_anonymous: prayer.is_anonymous || false,
        tags: prayer.tags || [],
        images: prayer.images || [],
        status: 'open' as const,
      };

      const { data, error } = await supabase
        .from('prayers')
        .insert(prayerData)
        .select(`
          *,
          user:profiles!user_id(*)
        `)
        .single();

      if (error) {
        console.error('Prayer creation error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`Failed to create prayer: ${error.message} (Code: ${error.code})`);
      }
      
      if (!data) {
        throw new Error('Failed to create prayer - no data returned');
      }

      console.log('Prayer created successfully:', data.id);
      return data;
    } catch (error) {
      console.error('Error in createPrayer:', error);
      throw error;
    }
  }

  /**
   * Update prayer
   */
  async updatePrayer(prayerId: string, updates: Partial<Prayer>): Promise<Prayer> {
    const { data, error } = await supabase
      .from('prayers')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', prayerId)
      .select(`
        *,
        user:profiles!user_id(*)
      `)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to update prayer');
    return data;
  }

  /**
   * Delete prayer
   */
  async deletePrayer(prayerId: string): Promise<void> {
    const { error } = await supabase
      .from('prayers')
      .delete()
      .eq('id', prayerId);

    if (error) throw error;
  }

  /**
   * Interact with prayer (pray, like, share, save)
   */
  async interactWithPrayer(
    prayerId: string,
    interaction: PrayerInteractionRequest
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if interaction already exists
    const { data: existing } = await supabase
      .from('interactions')
      .select('id')
      .eq('prayer_id', prayerId)
      .eq('user_id', user.id)
      .eq('type', interaction.type)
      .single();

    if (existing) {
      // Update existing interaction
      const { error } = await supabase
        .from('interactions')
        .update({
          committed_at: interaction.committed_at,
          reminder_frequency: interaction.reminder_frequency,
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Create new interaction
      const { error } = await supabase
        .from('interactions')
        .insert({
          prayer_id: prayerId,
          user_id: user.id,
          type: interaction.type,
          committed_at: interaction.committed_at,
          reminder_frequency: interaction.reminder_frequency,
        });

      if (error) throw error;
    }
  }

  /**
   * Remove interaction
   */
  async removeInteraction(prayerId: string, type: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('interactions')
      .delete()
      .eq('prayer_id', prayerId)
      .eq('user_id', user.id)
      .eq('type', type);

    if (error) throw error;
  }

  /**
   * Get user's prayer history
   */
  async getUserPrayers(userId: string, page = 1, limit = 20): Promise<Prayer[]> {
    const { data, error } = await supabase
      .from('prayers')
      .select(`
        *,
        user:profiles!user_id(*),
        interaction_count:interactions(count),
        comment_count:comments(count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get saved prayers
   */
  async getSavedPrayers(page = 1, limit = 20): Promise<Prayer[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('interactions')
      .select(`
        prayer:prayers!prayer_id(
          *,
          user:profiles!user_id(*),
          interaction_count:interactions(count),
          comment_count:comments(count)
        )
      `)
      .eq('user_id', user.id)
      .eq('type', 'SAVE')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;
    return data?.map(item => item.prayer).filter(Boolean) as Prayer[] || [];
  }

  /**
   * Search prayers
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
        user:profiles!user_id(*),
        interaction_count:interactions(count),
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

    if (error) throw error;
    return data || [];
  }
}

// Export singleton instance
export const prayerService = new PrayerService();