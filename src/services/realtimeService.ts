import { supabase } from '@/config/supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Prayer, Comment, Notification } from '@/types/database.types';

interface SubscriptionCallbacks {
  onPrayerCreated?: (prayer: Prayer) => void;
  onPrayerUpdated?: (prayer: Prayer) => void;
  onPrayerDeleted?: (prayerId: string) => void;
  onCommentCreated?: (comment: Comment) => void;
  onCommentUpdated?: (comment: Comment) => void;
  onCommentDeleted?: (commentId: string) => void;
  onNotificationReceived?: (notification: Notification) => void;
  onUserOnline?: (userId: string) => void;
  onUserOffline?: (userId: string) => void;
}

export interface RealtimeSubscription {
  id: string;
  channel: RealtimeChannel;
  type: 'prayer_feed' | 'group' | 'user_notifications' | 'user_presence' | 'prayer_comments';
  isActive: boolean;
}

class RealtimeService {
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private listeners: Map<string, SubscriptionCallbacks> = new Map();

  /**
   * Subscribe to prayer feed updates (public prayers)
   */
  subscribeToPublicPrayerFeed(callbacks: SubscriptionCallbacks): RealtimeSubscription {
    const subscriptionId = `prayer_feed_${Date.now()}`;

    const channel = supabase
      .channel('prayer-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'prayers',
          filter: 'privacy_level=eq.public',
        },
        (payload: RealtimePostgresChangesPayload<Prayer>) => {
          if (callbacks.onPrayerCreated && payload.new) {
            callbacks.onPrayerCreated(payload.new as Prayer);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'prayers',
          filter: 'privacy_level=eq.public',
        },
        (payload: RealtimePostgresChangesPayload<Prayer>) => {
          if (callbacks.onPrayerUpdated && payload.new) {
            callbacks.onPrayerUpdated(payload.new as Prayer);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'prayers',
        },
        (payload: RealtimePostgresChangesPayload<Prayer>) => {
          if (callbacks.onPrayerDeleted && payload.old) {
            callbacks.onPrayerDeleted(payload.old.id);
          }
        }
      )
      .subscribe();

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel,
      type: 'prayer_feed',
      isActive: true,
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.listeners.set(subscriptionId, callbacks);

    return subscription;
  }

  /**
   * Subscribe to group prayer updates
   */
  subscribeToGroupPrayers(groupId: string, callbacks: SubscriptionCallbacks): RealtimeSubscription {
    const subscriptionId = `group_${groupId}_${Date.now()}`;

    const channel = supabase
      .channel(`group-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prayers',
          filter: `group_id=eq.${groupId}`,
        },
        (payload: RealtimePostgresChangesPayload<Prayer>) => {
          switch (payload.eventType) {
            case 'INSERT':
              if (callbacks.onPrayerCreated && payload.new) {
                callbacks.onPrayerCreated(payload.new as Prayer);
              }
              break;
            case 'UPDATE':
              if (callbacks.onPrayerUpdated && payload.new) {
                callbacks.onPrayerUpdated(payload.new as Prayer);
              }
              break;
            case 'DELETE':
              if (callbacks.onPrayerDeleted && payload.old) {
                callbacks.onPrayerDeleted(payload.old.id);
              }
              break;
          }
        }
      )
      .subscribe();

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel,
      type: 'group',
      isActive: true,
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.listeners.set(subscriptionId, callbacks);

    return subscription;
  }

  /**
   * Subscribe to prayer comments
   */
  subscribeToPrayerComments(prayerId: string, callbacks: SubscriptionCallbacks): RealtimeSubscription {
    const subscriptionId = `prayer_comments_${prayerId}_${Date.now()}`;

    const channel = supabase
      .channel(`prayer-comments-${prayerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `prayer_id=eq.${prayerId}`,
        },
        (payload: RealtimePostgresChangesPayload<Comment>) => {
          switch (payload.eventType) {
            case 'INSERT':
              if (callbacks.onCommentCreated && payload.new) {
                callbacks.onCommentCreated(payload.new as Comment);
              }
              break;
            case 'UPDATE':
              if (callbacks.onCommentUpdated && payload.new) {
                callbacks.onCommentUpdated(payload.new as Comment);
              }
              break;
            case 'DELETE':
              if (callbacks.onCommentDeleted && payload.old) {
                callbacks.onCommentDeleted(payload.old.id);
              }
              break;
          }
        }
      )
      .subscribe();

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel,
      type: 'prayer_comments',
      isActive: true,
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.listeners.set(subscriptionId, callbacks);

    return subscription;
  }

  /**
   * Subscribe to user notifications
   */
  subscribeToUserNotifications(userId: string, callbacks: SubscriptionCallbacks): RealtimeSubscription {
    const subscriptionId = `notifications_${userId}_${Date.now()}`;

    const channel = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<Notification>) => {
          if (callbacks.onNotificationReceived && payload.new) {
            callbacks.onNotificationReceived(payload.new as Notification);
          }
        }
      )
      .subscribe();

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel,
      type: 'user_notifications',
      isActive: true,
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.listeners.set(subscriptionId, callbacks);

    return subscription;
  }

  /**
   * Subscribe to user presence updates
   */
  subscribeToUserPresence(callbacks: SubscriptionCallbacks): RealtimeSubscription {
    const subscriptionId = `presence_${Date.now()}`;

    const channel = supabase
      .channel('online-users', {
        config: {
          presence: {
            key: 'user-presence',
          },
        },
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach((presence) => {
          if (callbacks.onUserOnline) {
            callbacks.onUserOnline(presence.user_id);
          }
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences.forEach((presence) => {
          if (callbacks.onUserOffline) {
            callbacks.onUserOffline(presence.user_id);
          }
        });
      })
      .subscribe();

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel,
      type: 'user_presence',
      isActive: true,
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.listeners.set(subscriptionId, callbacks);

    return subscription;
  }

  /**
   * Track current user presence
   */
  async trackUserPresence(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const presenceChannel = supabase.channel('online-users');

    await presenceChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
        });
      }
    });
  }

  /**
   * Unsubscribe from a specific subscription
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    await supabase.removeChannel(subscription.channel);
    subscription.isActive = false;

    this.subscriptions.delete(subscriptionId);
    this.listeners.delete(subscriptionId);
  }

  /**
   * Unsubscribe from all subscriptions
   */
  async unsubscribeAll(): Promise<void> {
    const unsubscribePromises = Array.from(this.subscriptions.keys()).map(
      (subscriptionId) => this.unsubscribe(subscriptionId)
    );

    await Promise.all(unsubscribePromises);
  }

  /**
   * Get active subscriptions
   */
  getActiveSubscriptions(): RealtimeSubscription[] {
    return Array.from(this.subscriptions.values()).filter(sub => sub.isActive);
  }

  /**
   * Check if subscription is active
   */
  isSubscriptionActive(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    return subscription?.isActive ?? false;
  }

  /**
   * Update subscription callbacks
   */
  updateSubscriptionCallbacks(subscriptionId: string, callbacks: SubscriptionCallbacks): void {
    if (this.subscriptions.has(subscriptionId)) {
      this.listeners.set(subscriptionId, callbacks);
    }
  }

  /**
   * Get subscription status summary
   */
  getSubscriptionStatus(): {
    total: number;
    active: number;
    byType: Record<string, number>;
  } {
    const subscriptions = Array.from(this.subscriptions.values());
    const active = subscriptions.filter(sub => sub.isActive);

    const byType: Record<string, number> = {};
    active.forEach(sub => {
      byType[sub.type] = (byType[sub.type] || 0) + 1;
    });

    return {
      total: subscriptions.length,
      active: active.length,
      byType,
    };
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
export default realtimeService;