import { useEffect, useRef, useState, useCallback } from 'react';
import { realtimeService, RealtimeSubscription } from '@/services/realtimeService';
import { Prayer, Comment, Notification } from '@/types/database.types';

export interface RealtimeCallbacks {
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

export interface UseRealtimeOptions {
  enabled?: boolean;
  trackPresence?: boolean;
}

export interface UseRealtimeReturn {
  isConnected: boolean;
  subscriptionCount: number;
  subscribeToPublicPrayers: (callbacks: RealtimeCallbacks) => string;
  subscribeToGroupPrayers: (groupId: string, callbacks: RealtimeCallbacks) => string;
  subscribeToPrayerComments: (prayerId: string, callbacks: RealtimeCallbacks) => string;
  subscribeToUserNotifications: (userId: string, callbacks: RealtimeCallbacks) => string;
  subscribeToUserPresence: (callbacks: RealtimeCallbacks) => string;
  unsubscribe: (subscriptionId: string) => void;
  unsubscribeAll: () => void;
  getSubscriptionStatus: () => { total: number; active: number; byType: Record<string, number> };
}

/**
 * Hook for managing real-time subscriptions
 */
export function useRealtime(options: UseRealtimeOptions = {}): UseRealtimeReturn {
  const { enabled = true, trackPresence = true } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [subscriptionCount, setSubscriptionCount] = useState(0);
  const subscriptionsRef = useRef<Set<string>>(new Set());
  const presenceTrackedRef = useRef(false);

  // Track user presence on mount
  useEffect(() => {
    if (enabled && trackPresence && !presenceTrackedRef.current) {
      realtimeService.trackUserPresence();
      presenceTrackedRef.current = true;
    }
  }, [enabled, trackPresence]);

  // Update subscription count
  const updateSubscriptionCount = useCallback(() => {
    const status = realtimeService.getSubscriptionStatus();
    setSubscriptionCount(status.active);
    setIsConnected(status.active > 0);
  }, []);

  // Subscribe to public prayers
  const subscribeToPublicPrayers = useCallback((callbacks: RealtimeCallbacks): string => {
    if (!enabled) return '';

    const subscription = realtimeService.subscribeToPublicPrayerFeed(callbacks);
    subscriptionsRef.current.add(subscription.id);
    updateSubscriptionCount();

    return subscription.id;
  }, [enabled, updateSubscriptionCount]);

  // Subscribe to group prayers
  const subscribeToGroupPrayers = useCallback((groupId: string, callbacks: RealtimeCallbacks): string => {
    if (!enabled) return '';

    const subscription = realtimeService.subscribeToGroupPrayers(groupId, callbacks);
    subscriptionsRef.current.add(subscription.id);
    updateSubscriptionCount();

    return subscription.id;
  }, [enabled, updateSubscriptionCount]);

  // Subscribe to prayer comments
  const subscribeToPrayerComments = useCallback((prayerId: string, callbacks: RealtimeCallbacks): string => {
    if (!enabled) return '';

    const subscription = realtimeService.subscribeToPrayerComments(prayerId, callbacks);
    subscriptionsRef.current.add(subscription.id);
    updateSubscriptionCount();

    return subscription.id;
  }, [enabled, updateSubscriptionCount]);

  // Subscribe to user notifications
  const subscribeToUserNotifications = useCallback((userId: string, callbacks: RealtimeCallbacks): string => {
    if (!enabled) return '';

    const subscription = realtimeService.subscribeToUserNotifications(userId, callbacks);
    subscriptionsRef.current.add(subscription.id);
    updateSubscriptionCount();

    return subscription.id;
  }, [enabled, updateSubscriptionCount]);

  // Subscribe to user presence
  const subscribeToUserPresence = useCallback((callbacks: RealtimeCallbacks): string => {
    if (!enabled) return '';

    const subscription = realtimeService.subscribeToUserPresence(callbacks);
    subscriptionsRef.current.add(subscription.id);
    updateSubscriptionCount();

    return subscription.id;
  }, [enabled, updateSubscriptionCount]);

  // Unsubscribe from specific subscription
  const unsubscribe = useCallback(async (subscriptionId: string) => {
    await realtimeService.unsubscribe(subscriptionId);
    subscriptionsRef.current.delete(subscriptionId);
    updateSubscriptionCount();
  }, [updateSubscriptionCount]);

  // Unsubscribe from all subscriptions
  const unsubscribeAll = useCallback(async () => {
    await realtimeService.unsubscribeAll();
    subscriptionsRef.current.clear();
    updateSubscriptionCount();
  }, [updateSubscriptionCount]);

  // Get subscription status
  const getSubscriptionStatus = useCallback(() => {
    return realtimeService.getSubscriptionStatus();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Unsubscribe from all subscriptions created by this hook instance
      const subscriptionIds = Array.from(subscriptionsRef.current);
      subscriptionIds.forEach(id => {
        realtimeService.unsubscribe(id);
      });
      subscriptionsRef.current.clear();
    };
  }, []);

  // Initial subscription count
  useEffect(() => {
    updateSubscriptionCount();
  }, [updateSubscriptionCount]);

  return {
    isConnected,
    subscriptionCount,
    subscribeToPublicPrayers,
    subscribeToGroupPrayers,
    subscribeToPrayerComments,
    subscribeToUserNotifications,
    subscribeToUserPresence,
    unsubscribe,
    unsubscribeAll,
    getSubscriptionStatus,
  };
}

/**
 * Hook for subscribing to public prayer feed
 */
export function usePublicPrayerFeed(callbacks: RealtimeCallbacks, enabled = true) {
  const [subscriptionId, setSubscriptionId] = useState<string>('');
  const { subscribeToPublicPrayers, unsubscribe } = useRealtime({ enabled });

  useEffect(() => {
    if (enabled && callbacks) {
      const id = subscribeToPublicPrayers(callbacks);
      setSubscriptionId(id);

      return () => {
        if (id) {
          unsubscribe(id);
        }
      };
    }
  }, [enabled, callbacks, subscribeToPublicPrayers, unsubscribe]);

  return { subscriptionId, isSubscribed: !!subscriptionId };
}

/**
 * Hook for subscribing to group prayers
 */
export function useGroupPrayers(groupId: string, callbacks: RealtimeCallbacks, enabled = true) {
  const [subscriptionId, setSubscriptionId] = useState<string>('');
  const { subscribeToGroupPrayers, unsubscribe } = useRealtime({ enabled });

  useEffect(() => {
    if (enabled && groupId && callbacks) {
      const id = subscribeToGroupPrayers(groupId, callbacks);
      setSubscriptionId(id);

      return () => {
        if (id) {
          unsubscribe(id);
        }
      };
    }
  }, [enabled, groupId, callbacks, subscribeToGroupPrayers, unsubscribe]);

  return { subscriptionId, isSubscribed: !!subscriptionId };
}

/**
 * Hook for subscribing to prayer comments
 */
export function usePrayerComments(prayerId: string, callbacks: RealtimeCallbacks, enabled = true) {
  const [subscriptionId, setSubscriptionId] = useState<string>('');
  const { subscribeToPrayerComments, unsubscribe } = useRealtime({ enabled });

  useEffect(() => {
    if (enabled && prayerId && callbacks) {
      const id = subscribeToPrayerComments(prayerId, callbacks);
      setSubscriptionId(id);

      return () => {
        if (id) {
          unsubscribe(id);
        }
      };
    }
  }, [enabled, prayerId, callbacks, subscribeToPrayerComments, unsubscribe]);

  return { subscriptionId, isSubscribed: !!subscriptionId };
}

/**
 * Hook for subscribing to user notifications
 */
export function useUserNotifications(userId: string, callbacks: RealtimeCallbacks, enabled = true) {
  const [subscriptionId, setSubscriptionId] = useState<string>('');
  const { subscribeToUserNotifications, unsubscribe } = useRealtime({ enabled });

  useEffect(() => {
    if (enabled && userId && callbacks) {
      const id = subscribeToUserNotifications(userId, callbacks);
      setSubscriptionId(id);

      return () => {
        if (id) {
          unsubscribe(id);
        }
      };
    }
  }, [enabled, userId, callbacks, subscribeToUserNotifications, unsubscribe]);

  return { subscriptionId, isSubscribed: !!subscriptionId };
}

export default useRealtime;