/**
 * Prayer Real-time Hook - Provides real-time updates for prayer interactions
 */

import { useEffect, useCallback, useRef } from 'react';
import { prayerRealtimeService } from '@/services/realtime/prayerRealtimeService';
import { Prayer } from '@/types/database.types';

interface UsePrayerRealtimeOptions {
  feedType?: 'following' | 'discover' | 'group';
  groupId?: string;
  prayerId?: string;
  userId?: string;
}

interface UsePrayerRealtimeReturn {
  // Connection status
  isConnected: boolean;
  testConnection: () => Promise<boolean>;
  
  // Subscription management
  subscribeToFeed: (onUpdate: (prayer: Prayer) => void) => string;
  subscribeToPrayer: (onUpdate: (prayerId: string, interactionCount: number, userInteraction: any) => void) => string;
  subscribeToComments: (onUpdate: (commentCount: number) => void) => string;
  subscribeToUserPrayers: (onUpdate: (prayer: Prayer) => void) => string;
  subscribeToGroupPrayers: (onUpdate: (prayer: Prayer) => void) => string;
  
  // Unsubscribe methods
  unsubscribe: (channelName: string) => void;
  unsubscribeAll: () => void;
  
  // Active subscriptions
  activeSubscriptions: string[];
}

export const usePrayerRealtime = (options: UsePrayerRealtimeOptions = {}): UsePrayerRealtimeReturn => {
  const { feedType, groupId, prayerId, userId } = options;
  const subscriptionsRef = useRef<Set<string>>(new Set());
  const isConnectedRef = useRef<boolean>(false);

  // Test connection on mount
  useEffect(() => {
    const testConnection = async () => {
      const connected = await prayerRealtimeService.testConnection();
      isConnectedRef.current = connected;
    };
    
    testConnection();
  }, []);

  const subscribeToFeed = useCallback((onUpdate: (prayer: Prayer) => void): string => {
    if (!feedType) {
      console.warn('Feed type is required for feed subscription');
      return '';
    }

    const channelName = prayerRealtimeService.subscribeToPrayerFeed(
      feedType,
      groupId,
      onUpdate
    );
    
    subscriptionsRef.current.add(channelName);
    return channelName;
  }, [feedType, groupId]);

  const subscribeToPrayer = useCallback((onUpdate: (prayerId: string, interactionCount: number, userInteraction: any) => void): string => {
    if (!prayerId) {
      console.warn('Prayer ID is required for prayer subscription');
      return '';
    }

    const channelName = prayerRealtimeService.subscribeToPrayerInteractions(
      prayerId,
      onUpdate
    );
    
    subscriptionsRef.current.add(channelName);
    return channelName;
  }, [prayerId]);

  const subscribeToComments = useCallback((onUpdate: (commentCount: number) => void): string => {
    if (!prayerId) {
      console.warn('Prayer ID is required for comments subscription');
      return '';
    }

    const channelName = prayerRealtimeService.subscribeToPrayerComments(
      prayerId,
      onUpdate
    );
    
    subscriptionsRef.current.add(channelName);
    return channelName;
  }, [prayerId]);

  const subscribeToUserPrayers = useCallback((onUpdate: (prayer: Prayer) => void): string => {
    if (!userId) {
      console.warn('User ID is required for user prayers subscription');
      return '';
    }

    const channelName = prayerRealtimeService.subscribeToUserPrayers(
      userId,
      onUpdate
    );
    
    subscriptionsRef.current.add(channelName);
    return channelName;
  }, [userId]);

  const subscribeToGroupPrayers = useCallback((onUpdate: (prayer: Prayer) => void): string => {
    if (!groupId) {
      console.warn('Group ID is required for group prayers subscription');
      return '';
    }

    const channelName = prayerRealtimeService.subscribeToGroupPrayers(
      groupId,
      onUpdate
    );
    
    subscriptionsRef.current.add(channelName);
    return channelName;
  }, [groupId]);

  const unsubscribe = useCallback((channelName: string) => {
    prayerRealtimeService.unsubscribe(channelName);
    subscriptionsRef.current.delete(channelName);
  }, []);

  const unsubscribeAll = useCallback(() => {
    prayerRealtimeService.unsubscribeAll();
    subscriptionsRef.current.clear();
  }, []);

  const testConnection = useCallback(async (): Promise<boolean> => {
    const connected = await prayerRealtimeService.testConnection();
    isConnectedRef.current = connected;
    return connected;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Only unsubscribe from channels we created
      subscriptionsRef.current.forEach(channelName => {
        prayerRealtimeService.unsubscribe(channelName);
      });
      subscriptionsRef.current.clear();
    };
  }, []);

  return {
    isConnected: isConnectedRef.current,
    testConnection,
    subscribeToFeed,
    subscribeToPrayer,
    subscribeToComments,
    subscribeToUserPrayers,
    subscribeToGroupPrayers,
    unsubscribe,
    unsubscribeAll,
    activeSubscriptions: Array.from(subscriptionsRef.current),
  };
};