import { supabase } from '@/config/supabase';
import { Prayer } from '@/types/database.types';

/**
 * Prayer Interaction Service - DEPRECATED
 *
 * @deprecated This service has been consolidated into prayerService.ts
 * All functionality has been moved to prayerService to eliminate duplication
 * and ensure consistent data handling. Use prayerService instead.
 *
 * This file will be removed in a future version.
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
      .from('interactions')
      .select('id')
      .eq('prayer_id', prayerId)
      .eq('user_id', user.id)
      .eq('type', 'LIKE')
      .single();

    if (existing) {
      // Unlike
      const { error } = await supabase
        .from('interactions')
        .delete()
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      // Like
      const { error } = await supabase
        .from('interactions')
        .insert({
          prayer_id: prayerId,
          user_id: user.id,
          type: 'LIKE',
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
      .from('interactions')
      .select('id')
      .eq('prayer_id', prayerId)
      .eq('user_id', user.id)
      .eq('type', 'SAVE')
      .single();

    if (existing) {
      // Unsave
      const { error } = await supabase
        .from('interactions')
        .delete()
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      // Save
      const { error } = await supabase
        .from('interactions')
        .insert({
          prayer_id: prayerId,
          user_id: user.id,
          type: 'SAVE',
        });
      if (error) throw error;
    }
  }

  /**
   * Unsave a prayer
   */
  async unsavePrayer(prayerId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('interactions')
      .delete()
      .eq('prayer_id', prayerId)
      .eq('user_id', user.id)
      .eq('type', 'SAVE');

    if (error) throw error;
  }

  /**
   * Pray for a prayer
   */
  async prayForPrayer(prayerId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if already prayed for
    const { data: existing, error: checkError } = await supabase
      .from('interactions')
      .select('id')
      .eq('prayer_id', prayerId)
      .eq('user_id', user.id)
      .eq('type', 'PRAY')
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing interaction:', checkError);
      throw checkError;
    }

    console.log('Existing interaction found:', existing);

    if (existing) {
      // Remove prayer
      console.log('Removing prayer interaction:', existing.id);
      const { error } = await supabase
        .from('interactions')
        .delete()
        .eq('id', existing.id);
      if (error) {
        console.error('Error removing interaction:', error);
        throw error;
      }
      console.log('Successfully removed prayer interaction');
    } else {
      // Pray for it
      console.log('Adding prayer interaction');
      const { error } = await supabase
        .from('interactions')
        .insert({
          prayer_id: prayerId,
          user_id: user.id,
          type: 'PRAY',
          committed_at: new Date().toISOString(),
        });
      if (error) {
        console.error('Error adding interaction:', error);
        throw error;
      }
      console.log('Successfully added prayer interaction');
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
      .from('interactions')
      .insert({
        prayer_id: prayerId,
        user_id: user.id,
        type: 'SHARE',
      });

    if (error) throw error;
  }

  /**
   * Get prayer interaction counts
   */
  async getPrayerInteractionCounts(prayerId: string): Promise<{
    prayers: number;
    likes: number;
    comments: number;
    isPrayed: boolean;
    isLiked: boolean;
    isSaved: boolean;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // Get interaction counts using the unified interactions table
    const { data: interactions } = await supabase
      .from('interactions')
      .select('type')
      .eq('prayer_id', prayerId);

    // Get comments count
    const { count: commentsCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('prayer_id', prayerId);

    // Count interactions by type
    const prayersCount = interactions?.filter(i => i.type === 'PRAY').length || 0;
    const likesCount = interactions?.filter(i => i.type === 'LIKE').length || 0;

    // Check if user has prayed/liked/saved
    let isPrayed = false;
    let isLiked = false;
    let isSaved = false;

    if (userId) {
      const { data: userInteractions } = await supabase
        .from('interactions')
        .select('type')
        .eq('prayer_id', prayerId)
        .eq('user_id', userId);

      isPrayed = userInteractions?.some(i => i.type === 'PRAY') || false;
      isLiked = userInteractions?.some(i => i.type === 'LIKE') || false;
      isSaved = userInteractions?.some(i => i.type === 'SAVE') || false;
    }

    return {
      prayers: prayersCount,
      likes: likesCount,
      comments: commentsCount || 0,
      isPrayed,
      isLiked,
      isSaved,
    };
  }

  /**
   * Get user's saved prayers
   */
  async getSavedPrayers(userId: string, page = 1, limit = 20): Promise<Prayer[]> {
    const { data, error } = await supabase
      .from('interactions')
      .select(`
        prayer:prayers!prayer_id(
          *,
          user:profiles!user_id(*)
        )
      `)
      .eq('user_id', userId)
      .eq('type', 'SAVE')
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
        frequency: 'daily',
        is_active: true,
        is_sent: false,
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
          table: 'interactions',
          filter: `prayer_id=eq.${prayerId}`,
        },
        async (payload) => {
          console.log('Real-time interaction change detected:', payload);
          const interactions = await this.getPrayerInteractionCounts(prayerId);
          console.log('Updated interactions:', interactions);
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