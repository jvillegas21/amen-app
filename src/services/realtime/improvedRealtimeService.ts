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
  createdAt: Date;
  lastActivity: Date;
}

/**
 * Improved Real-time Service with proper memory management
 * Prevents memory leaks by:
 * - Tracking subscription lifecycle
 * - Automatic cleanup of inactive subscriptions
 * - Proper error handling and reconnection
 * - Memory usage monitoring
 */
class ImprovedRealtimeService {
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private listeners: Map<string, SubscriptionCallbacks> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private maxInactiveTime = 30 * 60 * 1000; // 30 minutes
  private maxSubscriptions = 50; // Prevent too many subscriptions

  constructor() {
    this.startCleanupInterval();
  }

  /**
   * Start automatic cleanup of inactive subscriptions
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveSubscriptions();
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  /**
   * Stop cleanup interval
   */
  private stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Clean up inactive subscriptions to prevent memory leaks
   */
  private async cleanupInactiveSubscriptions(): Promise<void> {
    const now = new Date();
    const inactiveSubscriptions: string[] = [];

    for (const [id, subscription] of this.subscriptions) {
      const timeSinceLastActivity = now.getTime() - subscription.lastActivity.getTime();
      
      if (timeSinceLastActivity > this.maxInactiveTime) {
        inactiveSubscriptions.push(id);
      }
    }

    // Clean up inactive subscriptions
    for (const id of inactiveSubscriptions) {
      console.log(`Cleaning up inactive subscription: ${id}`);
      await this.unsubscribe(id);
    }

    // If we have too many subscriptions, clean up the oldest ones
    if (this.subscriptions.size > this.maxSubscriptions) {
      const sortedSubscriptions = Array.from(this.subscriptions.entries())
        .sort(([, a], [, b]) => a.createdAt.getTime() - b.createdAt.getTime());
      
      const toRemove = sortedSubscriptions.slice(0, this.subscriptions.size - this.maxSubscriptions);
      for (const [id] of toRemove) {
        console.log(`Removing excess subscription: ${id}`);
        await this.unsubscribe(id);
      }
    }
  }

  /**
   * Update subscription activity timestamp
   */
  private updateSubscriptionActivity(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.lastActivity = new Date();
    }
  }

  /**
   * Subscribe to prayer feed updates with improved memory management
   */
  subscribeToPublicPrayerFeed(callbacks: SubscriptionCallbacks): RealtimeSubscription {
    const subscriptionId = `prayer_feed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check if we already have a similar subscription
    const existingSubscription = Array.from(this.subscriptions.values())
      .find(sub => sub.type === 'prayer_feed' && sub.isActive);
    
    if (existingSubscription) {
      // Update callbacks for existing subscription
      this.updateSubscriptionCallbacks(existingSubscription.id, callbacks);
      this.updateSubscriptionActivity(existingSubscription.id);
      return existingSubscription;
    }

    const channel = supabase
      .channel(`prayer-feed-${subscriptionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'prayers',
          filter: 'privacy_level=eq.public',
        },
        (payload: RealtimePostgresChangesPayload<Prayer>) => {
          this.updateSubscriptionActivity(subscriptionId);
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
          this.updateSubscriptionActivity(subscriptionId);
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
          this.updateSubscriptionActivity(subscriptionId);
          if (callbacks.onPrayerDeleted && payload.old) {
            callbacks.onPrayerDeleted(payload.old.id);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Prayer feed subscription active: ${subscriptionId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Prayer feed subscription error: ${subscriptionId}`);
          this.handleSubscriptionError(subscriptionId);
        }
      });

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel,
      type: 'prayer_feed',
      isActive: true,
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.listeners.set(subscriptionId, callbacks);

    return subscription;
  }

  /**
   * Subscribe to group prayer updates with improved memory management
   */
  subscribeToGroupPrayers(groupId: string, callbacks: SubscriptionCallbacks): RealtimeSubscription {
    const subscriptionId = `group_${groupId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check if we already have a subscription for this group
    const existingSubscription = Array.from(this.subscriptions.values())
      .find(sub => sub.type === 'group' && sub.id.includes(groupId) && sub.isActive);
    
    if (existingSubscription) {
      this.updateSubscriptionCallbacks(existingSubscription.id, callbacks);
      this.updateSubscriptionActivity(existingSubscription.id);
      return existingSubscription;
    }

    const channel = supabase
      .channel(`group-${groupId}-${subscriptionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prayers',
          filter: `group_id=eq.${groupId}`,
        },
        (payload: RealtimePostgresChangesPayload<Prayer>) => {
          this.updateSubscriptionActivity(subscriptionId);
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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Group prayers subscription active: ${subscriptionId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Group prayers subscription error: ${subscriptionId}`);
          this.handleSubscriptionError(subscriptionId);
        }
      });

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel,
      type: 'group',
      isActive: true,
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.listeners.set(subscriptionId, callbacks);

    return subscription;
  }

  /**
   * Subscribe to prayer comments with improved memory management
   */
  subscribeToPrayerComments(prayerId: string, callbacks: SubscriptionCallbacks): RealtimeSubscription {
    const subscriptionId = `prayer_comments_${prayerId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check if we already have a subscription for this prayer's comments
    const existingSubscription = Array.from(this.subscriptions.values())
      .find(sub => sub.type === 'prayer_comments' && sub.id.includes(prayerId) && sub.isActive);
    
    if (existingSubscription) {
      this.updateSubscriptionCallbacks(existingSubscription.id, callbacks);
      this.updateSubscriptionActivity(existingSubscription.id);
      return existingSubscription;
    }

    const channel = supabase
      .channel(`prayer-comments-${prayerId}-${subscriptionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `prayer_id=eq.${prayerId}`,
        },
        (payload: RealtimePostgresChangesPayload<Comment>) => {
          this.updateSubscriptionActivity(subscriptionId);
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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Prayer comments subscription active: ${subscriptionId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Prayer comments subscription error: ${subscriptionId}`);
          this.handleSubscriptionError(subscriptionId);
        }
      });

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel,
      type: 'prayer_comments',
      isActive: true,
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.listeners.set(subscriptionId, callbacks);

    return subscription;
  }

  /**
   * Subscribe to user notifications with improved memory management
   */
  subscribeToUserNotifications(userId: string, callbacks: SubscriptionCallbacks): RealtimeSubscription {
    const subscriptionId = `notifications_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check if we already have a subscription for this user's notifications
    const existingSubscription = Array.from(this.subscriptions.values())
      .find(sub => sub.type === 'user_notifications' && sub.id.includes(userId) && sub.isActive);
    
    if (existingSubscription) {
      this.updateSubscriptionCallbacks(existingSubscription.id, callbacks);
      this.updateSubscriptionActivity(existingSubscription.id);
      return existingSubscription;
    }

    const channel = supabase
      .channel(`user-notifications-${userId}-${subscriptionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<Notification>) => {
          this.updateSubscriptionActivity(subscriptionId);
          if (callbacks.onNotificationReceived && payload.new) {
            callbacks.onNotificationReceived(payload.new as Notification);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`User notifications subscription active: ${subscriptionId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`User notifications subscription error: ${subscriptionId}`);
          this.handleSubscriptionError(subscriptionId);
        }
      });

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel,
      type: 'user_notifications',
      isActive: true,
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.listeners.set(subscriptionId, callbacks);

    return subscription;
  }

  /**
   * Handle subscription errors and attempt reconnection
   */
  private async handleSubscriptionError(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    console.log(`Attempting to reconnect subscription: ${subscriptionId}`);
    
    // Mark as inactive temporarily
    subscription.isActive = false;

    // Wait a bit before attempting reconnection
    setTimeout(async () => {
      try {
        // Remove the old channel
        await supabase.removeChannel(subscription.channel);
        
        // Get the callbacks
        const callbacks = this.listeners.get(subscriptionId);
        if (!callbacks) return;

        // Recreate the subscription based on type
        let newSubscription: RealtimeSubscription;
        switch (subscription.type) {
          case 'prayer_feed':
            newSubscription = this.subscribeToPublicPrayerFeed(callbacks);
            break;
          case 'group':
            // Extract group ID from subscription ID
            const groupId = subscription.id.split('_')[1];
            newSubscription = this.subscribeToGroupPrayers(groupId, callbacks);
            break;
          case 'prayer_comments':
            // Extract prayer ID from subscription ID
            const prayerId = subscription.id.split('_')[2];
            newSubscription = this.subscribeToPrayerComments(prayerId, callbacks);
            break;
          case 'user_notifications':
            // Extract user ID from subscription ID
            const userId = subscription.id.split('_')[1];
            newSubscription = this.subscribeToUserNotifications(userId, callbacks);
            break;
          default:
            return;
        }

        // Remove old subscription and add new one
        this.subscriptions.delete(subscriptionId);
        this.listeners.delete(subscriptionId);
        
        console.log(`Successfully reconnected subscription: ${newSubscription.id}`);
      } catch (error) {
        console.error(`Failed to reconnect subscription ${subscriptionId}:`, error);
        // Remove failed subscription
        this.subscriptions.delete(subscriptionId);
        this.listeners.delete(subscriptionId);
      }
    }, 5000); // Wait 5 seconds before reconnecting
  }

  /**
   * Unsubscribe from a specific subscription with proper cleanup
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    try {
      await supabase.removeChannel(subscription.channel);
      subscription.isActive = false;
      
      this.subscriptions.delete(subscriptionId);
      this.listeners.delete(subscriptionId);
      
      console.log(`Successfully unsubscribed: ${subscriptionId}`);
    } catch (error) {
      console.error(`Error unsubscribing ${subscriptionId}:`, error);
      // Force cleanup even if there's an error
      this.subscriptions.delete(subscriptionId);
      this.listeners.delete(subscriptionId);
    }
  }

  /**
   * Unsubscribe from all subscriptions with proper cleanup
   */
  async unsubscribeAll(): Promise<void> {
    console.log(`Unsubscribing from ${this.subscriptions.size} subscriptions`);
    
    const unsubscribePromises = Array.from(this.subscriptions.keys()).map(
      (subscriptionId) => this.unsubscribe(subscriptionId)
    );

    await Promise.all(unsubscribePromises);
    
    // Stop cleanup interval
    this.stopCleanupInterval();
    
    console.log('All subscriptions unsubscribed');
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): {
    totalSubscriptions: number;
    activeSubscriptions: number;
    byType: Record<string, number>;
    oldestSubscription: Date | null;
    newestSubscription: Date | null;
  } {
    const subscriptions = Array.from(this.subscriptions.values());
    const active = subscriptions.filter(sub => sub.isActive);

    const byType: Record<string, number> = {};
    active.forEach(sub => {
      byType[sub.type] = (byType[sub.type] || 0) + 1;
    });

    const dates = subscriptions.map(sub => sub.createdAt);
    const oldestSubscription = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;
    const newestSubscription = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;

    return {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: active.length,
      byType,
      oldestSubscription,
      newestSubscription,
    };
  }

  /**
   * Update subscription callbacks
   */
  updateSubscriptionCallbacks(subscriptionId: string, callbacks: SubscriptionCallbacks): void {
    if (this.subscriptions.has(subscriptionId)) {
      this.listeners.set(subscriptionId, callbacks);
      this.updateSubscriptionActivity(subscriptionId);
    }
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
   * Force cleanup of all subscriptions (for testing or emergency cleanup)
   */
  async forceCleanup(): Promise<void> {
    console.log('Force cleaning up all subscriptions');
    await this.unsubscribeAll();
  }
}

// Export singleton instance
export const improvedRealtimeService = new ImprovedRealtimeService();
export default improvedRealtimeService;