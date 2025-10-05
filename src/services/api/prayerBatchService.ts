import { supabase } from '@/config/supabase';

/**
 * Prayer Batch Service
 * Optimizes prayer data fetching by batching queries instead of N+1 queries
 *
 * Performance: 50 prayers
 * - Before: 100+ queries (2 per prayer)
 * - After: 2 queries (1 for interactions, 1 for comments)
 *
 * Usage:
 * ```typescript
 * const prayerIds = prayers.map(p => p.id);
 * const counts = await prayerBatchService.fetchPrayerCounts(prayerIds);
 * const enrichedPrayers = prayers.map(p => ({ ...p, ...counts[p.id] }));
 * ```
 */
export class PrayerBatchService {
  /**
   * Fetch interaction and comment counts for multiple prayers in 2 queries
   *
   * @param prayerIds - Array of prayer IDs to fetch counts for
   * @returns Object mapping prayer ID to interaction/comment counts
   */
  async fetchPrayerCounts(prayerIds: string[]): Promise<
    Record<string, {
      pray_count: number;
      like_count: number;
      share_count: number;
      save_count: number;
      comment_count: number;
    }>
  > {
    if (prayerIds.length === 0) {
      return {};
    }

    // Fetch all interactions and comments in parallel (2 queries total)
    const [interactionResult, commentResult] = await Promise.all([
      supabase
        .from('interactions')
        .select('prayer_id, type')
        .in('prayer_id', prayerIds),
      supabase
        .from('comments')
        .select('prayer_id')
        .in('prayer_id', prayerIds),
    ]);

    // Initialize counts for all prayers
    const counts: Record<string, {
      pray_count: number;
      like_count: number;
      share_count: number;
      save_count: number;
      comment_count: number;
    }> = {};

    prayerIds.forEach(id => {
      counts[id] = {
        pray_count: 0,
        like_count: 0,
        share_count: 0,
        save_count: 0,
        comment_count: 0,
      };
    });

    // Aggregate interaction counts in memory (fast operation)
    (interactionResult.data || []).forEach(interaction => {
      const prayerId = interaction.prayer_id;
      if (!counts[prayerId]) return;

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
    });

    // Aggregate comment counts in memory
    (commentResult.data || []).forEach(comment => {
      const prayerId = comment.prayer_id;
      if (counts[prayerId]) {
        counts[prayerId].comment_count++;
      }
    });

    return counts;
  }

  /**
   * Fetch user-specific interactions for multiple prayers
   *
   * @param prayerIds - Array of prayer IDs
   * @param userId - User ID to check interactions for
   * @returns Object mapping prayer ID to user interaction state
   */
  async fetchUserInteractions(
    prayerIds: string[],
    userId: string
  ): Promise<
    Record<string, {
      isPrayed: boolean;
      isLiked: boolean;
      isSaved: boolean;
      isShared: boolean;
    }>
  > {
    if (prayerIds.length === 0 || !userId) {
      return {};
    }

    const { data, error } = await supabase
      .from('interactions')
      .select('prayer_id, type')
      .in('prayer_id', prayerIds)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user interactions:', error);
      return {};
    }

    // Initialize state for all prayers
    const interactions: Record<string, {
      isPrayed: boolean;
      isLiked: boolean;
      isSaved: boolean;
      isShared: boolean;
    }> = {};

    prayerIds.forEach(id => {
      interactions[id] = {
        isPrayed: false,
        isLiked: false,
        isSaved: false,
        isShared: false,
      };
    });

    // Mark interactions
    (data || []).forEach(interaction => {
      const prayerId = interaction.prayer_id;
      if (!interactions[prayerId]) return;

      switch (interaction.type) {
        case 'PRAY':
          interactions[prayerId].isPrayed = true;
          break;
        case 'LIKE':
          interactions[prayerId].isLiked = true;
          break;
        case 'SAVE':
          interactions[prayerId].isSaved = true;
          break;
        case 'SHARE':
          interactions[prayerId].isShared = true;
          break;
      }
    });

    return interactions;
  }

  /**
   * Fetch both counts and user interactions in one call (3 queries total)
   *
   * @param prayerIds - Array of prayer IDs
   * @param userId - Optional user ID for user-specific data
   * @returns Combined counts and user interaction data
   */
  async fetchPrayerData(prayerIds: string[], userId?: string) {
    const [counts, userInteractions] = await Promise.all([
      this.fetchPrayerCounts(prayerIds),
      userId ? this.fetchUserInteractions(prayerIds, userId) : Promise.resolve({}),
    ]);

    return { counts, userInteractions };
  }
}

// Export singleton instance
export const prayerBatchService = new PrayerBatchService();
