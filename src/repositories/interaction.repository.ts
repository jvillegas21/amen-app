import { supabase } from '@/config/supabase';
import { Interaction, PrayerInteractionRequest } from '@/types/database.types';
import { BaseRepositoryImpl } from './base.repository';

/**
 * Interaction Repository
 * Handles all interaction-related database operations
 */
export class InteractionRepository extends BaseRepositoryImpl<Interaction> {
  constructor() {
    super('interactions');
  }

  /**
   * Get interaction counts for multiple prayers in a single query
   * Fixes N+1 query problem when loading prayer lists
   */
  async getInteractionCountsForPrayers(prayerIds: string[]): Promise<Record<string, {
    pray_count: number;
    like_count: number;
    share_count: number;
    save_count: number;
  }>> {
    if (prayerIds.length === 0) return {};

    const { data, error } = await supabase
      .from('interactions')
      .select('prayer_id, type')
      .in('prayer_id', prayerIds);

    if (error) {
      this.handleError(error, 'getInteractionCountsForPrayers');
    }

    // Group by prayer_id and count by type
    const counts: Record<string, {
      pray_count: number;
      like_count: number;
      share_count: number;
      save_count: number;
    }> = {};

    // Initialize counts for all prayers
    prayerIds.forEach(id => {
      counts[id] = {
        pray_count: 0,
        like_count: 0,
        share_count: 0,
        save_count: 0,
      };
    });

    // Count interactions
    (data || []).forEach(interaction => {
      const prayerId = interaction.prayer_id;
      if (counts[prayerId]) {
        switch (interaction.type) {
          case 'PRAY':
            counts[prayerId].pray_count++;
            break;
          case 'LIKE':
            counts[prayerId].like_count++;
            break;
          case 'SHARE':
            counts[prayerId].share_count++;
            break;
          case 'SAVE':
            counts[prayerId].save_count++;
            break;
        }
      }
    });

    return counts;
  }

  /**
   * Get user's interactions for multiple prayers in a single query
   * Fixes N+1 query problem when loading prayer lists
   */
  async getUserInteractionsForPrayers(prayerIds: string[], userId: string): Promise<Record<string, Interaction[]>> {
    if (prayerIds.length === 0) return {};

    const { data, error } = await supabase
      .from('interactions')
      .select('*')
      .in('prayer_id', prayerIds)
      .eq('user_id', userId);

    if (error) {
      this.handleError(error, 'getUserInteractionsForPrayers');
    }

    // Group by prayer_id allowing multiple interaction types per prayer
    const interactions: Record<string, Interaction[]> = {};
    (data || []).forEach(interaction => {
      if (!interactions[interaction.prayer_id]) {
        interactions[interaction.prayer_id] = [];
      }
      interactions[interaction.prayer_id].push(interaction);
    });

    return interactions;
  }

  /**
   * Toggle interaction (create if doesn't exist, delete if exists)
   */
  async toggleInteraction(
    prayerId: string,
    userId: string,
    interaction: PrayerInteractionRequest
  ): Promise<{ created: boolean; interaction?: Interaction }> {
    // Check if interaction already exists
    const { data: existing, error: checkError } = await supabase
      .from('interactions')
      .select('*')
      .eq('prayer_id', prayerId)
      .eq('user_id', userId)
      .eq('type', interaction.type)
      .maybeSingle();

    if (checkError) {
      this.handleError(checkError, 'toggleInteraction (check)');
    }

    if (existing) {
      // Delete existing interaction
      const { error: deleteError } = await supabase
        .from('interactions')
        .delete()
        .eq('id', existing.id);

      if (deleteError) {
        this.handleError(deleteError, 'toggleInteraction (delete)');
      }

      return { created: false };
    } else {
      // Create new interaction
      const { data, error: createError } = await supabase
        .from('interactions')
        .insert({
          prayer_id: prayerId,
          user_id: userId,
          type: interaction.type,
          committed_at: interaction.committed_at || new Date().toISOString(),
          reminder_frequency: interaction.reminder_frequency || 'none',
        })
        .select()
        .single();

      if (createError) {
        this.handleError(createError, 'toggleInteraction (create)');
      }

      return { created: true, interaction: data };
    }
  }

  /**
   * Get user's saved prayers
   */
  async getSavedPrayers(userId: string, page = 1, limit = 20): Promise<Interaction[]> {
    const offset = (page - 1) * limit;

    const { data, error } = await supabase
      .from('interactions')
      .select(`
        *,
        prayer:prayers!prayer_id(
          *,
          user:profiles!user_id(
            id,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('user_id', userId)
      .eq('type', 'SAVE')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.handleError(error, 'getSavedPrayers');
    }

    return data || [];
  }

  /**
   * Remove specific interaction
   */
  async removeInteraction(prayerId: string, userId: string, type: string): Promise<void> {
    const { error } = await supabase
      .from('interactions')
      .delete()
      .eq('prayer_id', prayerId)
      .eq('user_id', userId)
      .eq('type', type);

    if (error) {
      this.handleError(error, 'removeInteraction');
    }
  }

  /**
   * Get interaction statistics for a user
   */
  async getUserInteractionStats(userId: string): Promise<{
    total_interactions: number;
    prayers_prayed_for: number;
    prayers_liked: number;
    prayers_shared: number;
    prayers_saved: number;
  }> {
    const { data, error } = await supabase
      .from('interactions')
      .select('type')
      .eq('user_id', userId);

    if (error) {
      this.handleError(error, 'getUserInteractionStats');
    }

    const interactions = data || [];
    const stats = {
      total_interactions: interactions.length,
      prayers_prayed_for: interactions.filter(i => i.type === 'PRAY').length,
      prayers_liked: interactions.filter(i => i.type === 'LIKE').length,
      prayers_shared: interactions.filter(i => i.type === 'SHARE').length,
      prayers_saved: interactions.filter(i => i.type === 'SAVE').length,
    };

    return stats;
  }
}
