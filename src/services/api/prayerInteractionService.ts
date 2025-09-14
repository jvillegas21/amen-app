import { supabase } from '@/config/supabase';
import { Prayer } from '@/types/database.types';

/**
 * Prayer Interaction Service - Manages prayer interactions (likes, shares, saves)
 */
class PrayerInteractionService {
  /**
   * Like a prayer
   */
  async likePrayer(prayerId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if already liked
    const { data: existing } = await supabase
      .from('prayer_likes')
      .select('id')
      .eq('prayer_id', prayerId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // Unlike
      const { error } = await supabase
        .from('prayer_likes')
        .delete()
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      // Like
      const { error } = await supabase
        .from('prayer_likes')
        .insert({
          prayer_id: prayerId,
          user_id: user.id,
        });
      if (error) throw error;
    }
  }

  /**
   * Save a prayer
   */
  async savePrayer(prayerId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if already saved
    const { data: existing } = await supabase
      .from('saved_prayers')
      .select('id')
      .eq('prayer_id', prayerId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // Unsave
      const { error } = await supabase
        .from('saved_prayers')
        .delete()
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      // Save
      const { error } = await supabase
        .from('saved_prayers')
        .insert({
          prayer_id: prayerId,
          user_id: user.id,
        });
      if (error) throw error;
    }
  }

  /**
   * Share a prayer
   */
  async sharePrayer(prayerId: string, platform: 'facebook' | 'twitter' | 'whatsapp' | 'copy'): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Record the share
    const { error } = await supabase
      .from('prayer_shares')
      .insert({
        prayer_id: prayerId,
        user_id: user.id,
        platform,
      });

    if (error) throw error;
  }

  /**
   * Get prayer interaction counts
   */
  async getPrayerInteractionCounts(prayerId: string): Promise<{
    likes: number;
    comments: number;
    shares: number;
    isLiked: boolean;
    isSaved: boolean;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // Get likes count
    const { count: likesCount } = await supabase
      .from('prayer_likes')
      .select('*', { count: 'exact', head: true })
      .eq('prayer_id', prayerId);

    // Get comments count
    const { count: commentsCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('prayer_id', prayerId);

    // Get shares count
    const { count: sharesCount } = await supabase
      .from('prayer_shares')
      .select('*', { count: 'exact', head: true })
      .eq('prayer_id', prayerId);

    // Check if user has liked/saved
    let isLiked = false;
    let isSaved = false;

    if (userId) {
      const { data: likeData } = await supabase
        .from('prayer_likes')
        .select('id')
        .eq('prayer_id', prayerId)
        .eq('user_id', userId)
        .single();

      const { data: saveData } = await supabase
        .from('saved_prayers')
        .select('id')
        .eq('prayer_id', prayerId)
        .eq('user_id', userId)
        .single();

      isLiked = !!likeData;
      isSaved = !!saveData;
    }

    return {
      likes: likesCount || 0,
      comments: commentsCount || 0,
      shares: sharesCount || 0,
      isLiked,
      isSaved,
    };
  }

  /**
   * Get user's saved prayers
   */
  async getSavedPrayers(userId: string, page = 1, limit = 20): Promise<Prayer[]> {
    const { data, error } = await supabase
      .from('saved_prayers')
      .select(`
        prayer:prayers!prayer_id(
          *,
          user:profiles!user_id(*)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;
    return data?.map(item => item.prayer).filter(Boolean) || [];
  }

  /**
   * Create a prayer reminder
   */
  async createPrayerReminder(prayerId: string, reminderTime: Date): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('prayer_reminders')
      .insert({
        prayer_id: prayerId,
        user_id: user.id,
        reminder_time: reminderTime.toISOString(),
      });

    if (error) throw error;
  }

  /**
   * Get user's prayer reminders
   */
  async getPrayerReminders(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('prayer_reminders')
      .select(`
        *,
        prayer:prayers!prayer_id(*)
      `)
      .eq('user_id', userId)
      .gte('reminder_time', new Date().toISOString())
      .order('reminder_time', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Delete a prayer reminder
   */
  async deletePrayerReminder(reminderId: string): Promise<void> {
    const { error } = await supabase
      .from('prayer_reminders')
      .delete()
      .eq('id', reminderId);

    if (error) throw error;
  }

  /**
   * Subscribe to prayer interactions
   */
  subscribeToPrayerInteractions(prayerId: string, callback: (interactions: any) => void) {
    return supabase
      .channel('prayer-interactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prayer_likes',
          filter: `prayer_id=eq.${prayerId}`,
        },
        async () => {
          const interactions = await this.getPrayerInteractionCounts(prayerId);
          callback(interactions);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'saved_prayers',
          filter: `prayer_id=eq.${prayerId}`,
        },
        async () => {
          const interactions = await this.getPrayerInteractionCounts(prayerId);
          callback(interactions);
        }
      )
      .subscribe();
  }

  /**
   * Unsubscribe from prayer interactions
   */
  unsubscribeFromPrayerInteractions(subscription: any) {
    supabase.removeChannel(subscription);
  }
}

// Export singleton instance
export const prayerInteractionService = new PrayerInteractionService();