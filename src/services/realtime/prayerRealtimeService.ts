/**
 * Prayer Real-time Service - Handles real-time updates for prayer interactions
 */

import { supabase } from '@/config/supabase';
import { Prayer } from '@/types/database.types';

interface PrayerUpdateCallback {
  (prayer: Prayer): void;
}

interface InteractionUpdateCallback {
  (prayerId: string, interactionCount: number, userInteraction: any): void;
}

class PrayerRealtimeService {
  private subscriptions = new Map<string, any>();
  private prayerUpdateCallbacks = new Set<PrayerUpdateCallback>();
  private interactionUpdateCallbacks = new Set<InteractionUpdateCallback>();

  /**
   * Subscribe to prayer feed updates
   */
  subscribeToPrayerFeed(
    feedType: 'following' | 'discover' | 'group',
    groupId?: string,
    onUpdate?: PrayerUpdateCallback
  ): string {
    const channelName = `prayer-feed-${feedType}${groupId ? `-${groupId}` : ''}`;
    
    if (this.subscriptions.has(channelName)) {
      return channelName;
    }

    let filter = '';
    if (feedType === 'discover') {
      filter = `privacy_level=eq.public`;
    } else if (feedType === 'group' && groupId) {
      filter = `group_id=eq.${groupId}`;
    } else {
      filter = `privacy_level=in.(public,friends)`;
    }

    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'prayers',
          filter,
        },
        async (payload) => {
          console.log('New prayer added:', payload);
          if (onUpdate) {
            // Fetch the full prayer with user data
            const { data: prayer } = await supabase
              .from('prayers')
              .select(`
                *,
                user:profiles!user_id(*),
                interaction_count:interactions(count),
                comment_count:comments(count)
              `)
              .eq('id', payload.new.id)
              .single();
            
            if (prayer) {
              onUpdate(prayer);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'prayers',
          filter,
        },
        async (payload) => {
          console.log('Prayer updated:', payload);
          if (onUpdate) {
            // Fetch the updated prayer
            const { data: prayer } = await supabase
              .from('prayers')
              .select(`
                *,
                user:profiles!user_id(*),
                interaction_count:interactions(count),
                comment_count:comments(count)
              `)
              .eq('id', payload.new.id)
              .single();
            
            if (prayer) {
              onUpdate(prayer);
            }
          }
        }
      )
      .subscribe();

    this.subscriptions.set(channelName, subscription);
    if (onUpdate) {
      this.prayerUpdateCallbacks.add(onUpdate);
    }

    return channelName;
  }

  /**
   * Subscribe to prayer interaction updates
   */
  subscribeToPrayerInteractions(
    prayerId: string,
    onUpdate?: InteractionUpdateCallback
  ): string {
    const channelName = `prayer-interactions-${prayerId}`;
    
    if (this.subscriptions.has(channelName)) {
      return channelName;
    }

    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interactions',
          filter: `prayer_id=eq.${prayerId}`,
        },
        async (payload) => {
          console.log('Prayer interaction updated:', payload);
          
          if (onUpdate) {
            // Get updated interaction counts
            const { count: interactionCount } = await supabase
              .from('interactions')
              .select('*', { count: 'exact', head: true })
              .eq('prayer_id', prayerId);

            // Get current user's interaction
            const { data: { user } } = await supabase.auth.getUser();
            let userInteraction = null;
            
            if (user) {
              const { data: interaction } = await supabase
                .from('interactions')
                .select('*')
                .eq('prayer_id', prayerId)
                .eq('user_id', user.id)
                .single();
              
              userInteraction = interaction;
            }

            onUpdate(prayerId, interactionCount || 0, userInteraction);
          }
        }
      )
      .subscribe();

    this.subscriptions.set(channelName, subscription);
    if (onUpdate) {
      this.interactionUpdateCallbacks.add(onUpdate);
    }

    return channelName;
  }

  /**
   * Subscribe to prayer comments updates
   */
  subscribeToPrayerComments(
    prayerId: string,
    onUpdate?: (commentCount: number) => void
  ): string {
    const channelName = `prayer-comments-${prayerId}`;
    
    if (this.subscriptions.has(channelName)) {
      return channelName;
    }

    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `prayer_id=eq.${prayerId}`,
        },
        async (payload) => {
          console.log('Prayer comment updated:', payload);
          
          if (onUpdate) {
            // Get updated comment count
            const { count: commentCount } = await supabase
              .from('comments')
              .select('*', { count: 'exact', head: true })
              .eq('prayer_id', prayerId);

            onUpdate(commentCount || 0);
          }
        }
      )
      .subscribe();

    this.subscriptions.set(channelName, subscription);
    return channelName;
  }

  /**
   * Subscribe to user's prayer updates
   */
  subscribeToUserPrayers(
    userId: string,
    onUpdate?: PrayerUpdateCallback
  ): string {
    const channelName = `user-prayers-${userId}`;
    
    if (this.subscriptions.has(channelName)) {
      return channelName;
    }

    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prayers',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          console.log('User prayer updated:', payload);
          
          if (onUpdate) {
            // Fetch the full prayer with user data
            const { data: prayer } = await supabase
              .from('prayers')
              .select(`
                *,
                user:profiles!user_id(*),
                interaction_count:interactions(count),
                comment_count:comments(count)
              `)
              .eq('id', payload.new.id)
              .single();
            
            if (prayer) {
              onUpdate(prayer);
            }
          }
        }
      )
      .subscribe();

    this.subscriptions.set(channelName, subscription);
    if (onUpdate) {
      this.prayerUpdateCallbacks.add(onUpdate);
    }

    return channelName;
  }

  /**
   * Subscribe to group prayer updates
   */
  subscribeToGroupPrayers(
    groupId: string,
    onUpdate?: PrayerUpdateCallback
  ): string {
    const channelName = `group-prayers-${groupId}`;
    
    if (this.subscriptions.has(channelName)) {
      return channelName;
    }

    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prayers',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          console.log('Group prayer updated:', payload);
          
          if (onUpdate) {
            // Fetch the full prayer with user data
            const { data: prayer } = await supabase
              .from('prayers')
              .select(`
                *,
                user:profiles!user_id(*),
                interaction_count:interactions(count),
                comment_count:comments(count)
              `)
              .eq('id', payload.new.id)
              .single();
            
            if (prayer) {
              onUpdate(prayer);
            }
          }
        }
      )
      .subscribe();

    this.subscriptions.set(channelName, subscription);
    if (onUpdate) {
      this.prayerUpdateCallbacks.add(onUpdate);
    }

    return channelName;
  }

  /**
   * Unsubscribe from a specific channel
   */
  unsubscribe(channelName: string): void {
    const subscription = this.subscriptions.get(channelName);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach((subscription, channelName) => {
      supabase.removeChannel(subscription);
    });
    this.subscriptions.clear();
    this.prayerUpdateCallbacks.clear();
    this.interactionUpdateCallbacks.clear();
  }

  /**
   * Get active subscriptions
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Check if a channel is subscribed
   */
  isSubscribed(channelName: string): boolean {
    return this.subscriptions.has(channelName);
  }

  /**
   * Send a test message to verify connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('prayers')
        .select('id')
        .limit(1);
      
      return !error;
    } catch (error) {
      console.error('Real-time connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const prayerRealtimeService = new PrayerRealtimeService();
export default prayerRealtimeService;