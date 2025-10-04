import { create } from 'zustand';
import { Prayer, UpdatePrayerRequest } from '@/types/database.types';
import { prayerService } from '@/services/api/prayerService';
import { prayerRealtimeService } from '@/services/realtime/prayerRealtimeService';
import { offlineService } from '@/services/offline/offlineService';

/**
 * Prayer Store Interface
 * Manages prayer-related state and operations
 */
interface PrayerState {
  // State
  prayers: Prayer[];
  isLoading: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  currentPage: number;
  error: string | null;
  currentFeedType: 'following' | 'discover' | null;
  realtimeSubscriptions: Set<string>;

  // Actions
  fetchPrayers: (feedType: 'following' | 'discover', page?: number) => Promise<void>;
  refreshPrayers: (feedType: 'following' | 'discover') => Promise<void>;
  loadMorePrayers: (feedType: 'following' | 'discover') => Promise<void>;
  createPrayer: (prayer: any) => Promise<Prayer>;
  updatePrayer: (prayerId: string, updates: UpdatePrayerRequest) => Promise<void>;
  deletePrayer: (prayerId: string) => Promise<void>;
  interactWithPrayer: (prayerId: string, type: 'PRAY' | 'LIKE' | 'SHARE' | 'SAVE') => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  
  // Real-time actions
  subscribeToRealtime: (feedType: 'following' | 'discover') => void;
  unsubscribeFromRealtime: () => void;
  addPrayerFromRealtime: (prayer: Prayer) => void;
  updatePrayerFromRealtime: (prayer: Prayer) => void;
  updatePrayerInteraction: (prayerId: string, interactionCount: number, userInteraction: any) => void;
}

/**
 * Prayer Store Implementation
 */
export const usePrayerStore = create<PrayerState>((set: any, get: any) => ({
  // Initial State
  prayers: [],
  isLoading: false,
  isRefreshing: false,
  hasMore: true,
  currentPage: 1,
  error: null,
  currentFeedType: null,
  realtimeSubscriptions: new Set(),

  // Fetch Prayers
  fetchPrayers: async (feedType: 'following' | 'discover', page = 1) => {
    set({ isLoading: true, error: null });
    
    try {
      const prayers = await prayerService.fetchPrayers({
        feedType,
        page,
        limit: 20,
      });

      set({
        prayers: page === 1 ? prayers : [...get().prayers, ...prayers],
        currentPage: page,
        hasMore: prayers.length === 20,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch prayers',
        isLoading: false,
      });
    }
  },

  // Refresh Prayers
  refreshPrayers: async (feedType: 'following' | 'discover') => {
    set({ isRefreshing: true, error: null });
    
    try {
      const prayers = await prayerService.fetchPrayers({
        feedType,
        page: 1,
        limit: 20,
      });

      set({
        prayers,
        currentPage: 1,
        hasMore: prayers.length === 20,
        isRefreshing: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to refresh prayers',
        isRefreshing: false,
      });
    }
  },

  // Load More Prayers
  loadMorePrayers: async (feedType: 'following' | 'discover') => {
    const { currentPage, hasMore, isLoading } = get();
    
    if (!hasMore || isLoading) return;

    const nextPage = currentPage + 1;
    await get().fetchPrayers(feedType, nextPage);
  },

  // Create Prayer
  createPrayer: async (prayerData: any) => {
    set({ isLoading: true, error: null });
    
    try {
      const isOnline = await offlineService.isOnline();
      
      if (isOnline) {
        // Online: Create prayer directly
        const newPrayer = await prayerService.createPrayer(prayerData);
        
        set({
          prayers: [newPrayer, ...get().prayers],
          isLoading: false,
        });

        return newPrayer;
      } else {
        // Offline: Queue action and store locally
        const tempPrayer: Prayer = {
          id: `temp-${Date.now()}`,
          user_id: prayerData.user_id,
          text: prayerData.text,
          privacy_level: prayerData.privacy_level,
          location_city: prayerData.location_city,
          location_lat: prayerData.location_lat,
          location_lon: prayerData.location_lon,
          location_granularity: prayerData.location_granularity || 'hidden',
          group_id: prayerData.group_id,
          status: 'open',
          is_anonymous: prayerData.is_anonymous || false,
          tags: prayerData.tags || [],
          images: prayerData.images || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          expires_at: prayerData.expires_at,
          user: prayerData.user,
          pray_count: 0,
          like_count: 0,
          comment_count: 0,
        };

        // Store offline and queue for sync
        await offlineService.storePrayerOffline(tempPrayer);
        await offlineService.queueAction({
          type: 'CREATE_PRAYER',
          data: prayerData,
        });

        set({
          prayers: [tempPrayer, ...get().prayers],
          isLoading: false,
        });

        return tempPrayer;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create prayer',
        isLoading: false,
      });
      throw error;
    }
  },

  // Update Prayer
  updatePrayer: async (prayerId: string, updates: UpdatePrayerRequest) => {
    set({ isLoading: true, error: null });
    
    try {
      const updatedPrayer = await prayerService.updatePrayer(prayerId, updates);
      
      set({
        prayers: get().prayers.map((prayer: Prayer) => 
          prayer.id === prayerId ? updatedPrayer : prayer
        ),
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update prayer',
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete Prayer
  deletePrayer: async (prayerId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await prayerService.deletePrayer(prayerId);
      
      set({
        prayers: get().prayers.filter((prayer: Prayer) => prayer.id !== prayerId),
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete prayer',
        isLoading: false,
      });
    }
  },

  // Interact with Prayer
  interactWithPrayer: async (prayerId: string, type: 'PRAY' | 'LIKE' | 'SHARE' | 'SAVE') => {
    const originalPrayers = [...get().prayers];

    try {
      // Optimistic update
      set({
        prayers: get().prayers.map((prayer: Prayer) => {
          if (prayer.id === prayerId) {
            // Initialize user_interactions if it doesn't exist
            const currentInteractions = prayer.user_interactions || {
              isPrayed: false,
              isSaved: false,
              isLiked: false,
              isShared: false,
            };

            // Check if user has this specific interaction type
            let hasCurrentInteraction = false;
            if (type === 'PRAY') hasCurrentInteraction = currentInteractions.isPrayed;
            else if (type === 'SAVE') hasCurrentInteraction = currentInteractions.isSaved;
            else if (type === 'LIKE') hasCurrentInteraction = currentInteractions.isLiked;
            else if (type === 'SHARE') hasCurrentInteraction = currentInteractions.isShared;

            const increment = hasCurrentInteraction ? -1 : 1;

            // Update the appropriate count field
            const updatedPrayer = { ...prayer };
            if (type === 'PRAY') {
              updatedPrayer.pray_count = Math.max(0, (prayer.pray_count || 0) + increment);
            } else if (type === 'LIKE') {
              updatedPrayer.like_count = Math.max(0, (prayer.like_count || 0) + increment);
            } else if (type === 'SHARE') {
              updatedPrayer.share_count = Math.max(0, (prayer.share_count || 0) + increment);
            } else if (type === 'SAVE') {
              updatedPrayer.save_count = Math.max(0, (prayer.save_count || 0) + increment);
            }

            // Update user_interactions with independent states
            const updatedInteractions = { ...currentInteractions };
            const now = new Date().toISOString();

            if (type === 'PRAY') {
              updatedInteractions.isPrayed = !hasCurrentInteraction;
              updatedInteractions.prayedAt = !hasCurrentInteraction ? now : undefined;
            } else if (type === 'SAVE') {
              updatedInteractions.isSaved = !hasCurrentInteraction;
              updatedInteractions.savedAt = !hasCurrentInteraction ? now : undefined;
            } else if (type === 'LIKE') {
              updatedInteractions.isLiked = !hasCurrentInteraction;
              updatedInteractions.likedAt = !hasCurrentInteraction ? now : undefined;
            } else if (type === 'SHARE') {
              updatedInteractions.isShared = !hasCurrentInteraction;
              updatedInteractions.sharedAt = !hasCurrentInteraction ? now : undefined;
            }

            // Keep user_interaction for backwards compatibility
            // Only update it if this is the first interaction or if toggling off
            const shouldUpdateLegacy = !prayer.user_interaction ||
                                      (prayer.user_interaction.type === type && hasCurrentInteraction);

            return {
              ...updatedPrayer,
              user_interactions: updatedInteractions,
              user_interaction: shouldUpdateLegacy ?
                (hasCurrentInteraction ? null : {
                  id: 'temp-' + Date.now(),
                  prayer_id: prayerId,
                  user_id: 'current-user',
                  type,
                  created_at: now,
                  committed_at: now,
                  reminder_frequency: 'none',
                }) : prayer.user_interaction,
            };
          }
          return prayer;
        }),
      });

      const isOnline = await offlineService.isOnline();
      
      if (isOnline) {
        // Online: Make API call
        console.log('Making API call for prayer interaction:', prayerId, type);
        await prayerService.interactWithPrayer(prayerId, { type });
        console.log('API call completed successfully');
      } else {
        // Offline: Queue action for later sync
        console.log('Offline mode - queuing action');
        await offlineService.queueAction({
          type: 'INTERACT_PRAYER',
          data: {
            prayer_id: prayerId,
            type,
            committed_at: new Date().toISOString(),
          },
        });
      }
      
    } catch (error) {
      // Rollback on error
      set({ prayers: originalPrayers });
      set({
        error: error instanceof Error ? error.message : 'Failed to interact with prayer',
      });
      throw error;
    }
  },

  // Clear Error
  clearError: () => set({ error: null }),

  // Set Loading
  setLoading: (loading: boolean) => set({ isLoading: loading }),

  // Real-time actions
  subscribeToRealtime: (feedType: 'following' | 'discover') => {
    const { currentFeedType, realtimeSubscriptions } = get();
    
    // Unsubscribe from previous feed if different
    if (currentFeedType && currentFeedType !== feedType) {
      get().unsubscribeFromRealtime();
    }
    
    // Subscribe to new feed
    const channelName = prayerRealtimeService.subscribeToPrayerFeed(
      feedType,
      undefined,
      (prayer: Prayer) => {
        // Add new prayer to the beginning of the list
        set({
          prayers: [prayer, ...get().prayers],
        });
      }
    );
    
    set({
      currentFeedType: feedType,
      realtimeSubscriptions: new Set([...realtimeSubscriptions, channelName]),
    });
  },

  unsubscribeFromRealtime: () => {
    const { realtimeSubscriptions } = get();
    
    realtimeSubscriptions.forEach((channelName: string) => {
      prayerRealtimeService.unsubscribe(channelName);
    });
    
    set({
      currentFeedType: null,
      realtimeSubscriptions: new Set(),
    });
  },

  addPrayerFromRealtime: (prayer: Prayer) => {
    set({
      prayers: [prayer, ...get().prayers],
    });
  },

  updatePrayerFromRealtime: (updatedPrayer: Prayer) => {
    set({
      prayers: get().prayers.map((prayer: Prayer) =>
        prayer.id === updatedPrayer.id ? updatedPrayer : prayer
      ),
    });
  },

  updatePrayerInteraction: (prayerId: string, counts: {
    pray_count?: number;
    like_count?: number;
    comment_count?: number;
  }, userInteraction?: any) => {
    set({
      prayers: get().prayers.map((prayer: Prayer) => {
        if (prayer.id === prayerId) {
          return {
            ...prayer,
            ...counts,
            user_interaction: userInteraction,
          };
        }
        return prayer;
      }),
    });
  },
}));