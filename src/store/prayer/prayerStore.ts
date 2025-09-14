import { create } from 'zustand';
import { Prayer } from '@/types/database.types';
import { prayerService } from '@/services/api/prayerService';

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

  // Actions
  fetchPrayers: (feedType: 'following' | 'discover', page?: number) => Promise<void>;
  refreshPrayers: (feedType: 'following' | 'discover') => Promise<void>;
  loadMorePrayers: (feedType: 'following' | 'discover') => Promise<void>;
  createPrayer: (prayer: any) => Promise<Prayer>;
  updatePrayer: (prayerId: string, updates: Partial<Prayer>) => Promise<void>;
  deletePrayer: (prayerId: string) => Promise<void>;
  interactWithPrayer: (prayerId: string, type: 'PRAY' | 'LIKE' | 'SHARE' | 'SAVE') => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

/**
 * Prayer Store Implementation
 */
export const usePrayerStore = create<PrayerState>((set, get) => ({
  // Initial State
  prayers: [],
  isLoading: false,
  isRefreshing: false,
  hasMore: true,
  currentPage: 1,
  error: null,

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
      const newPrayer = await prayerService.createPrayer(prayerData);
      
      set({
        prayers: [newPrayer, ...get().prayers],
        isLoading: false,
      });

      return newPrayer;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create prayer',
        isLoading: false,
      });
      throw error;
    }
  },

  // Update Prayer
  updatePrayer: async (prayerId: string, updates: Partial<Prayer>) => {
    set({ isLoading: true, error: null });
    
    try {
      const updatedPrayer = await prayerService.updatePrayer(prayerId, updates);
      
      set({
        prayers: get().prayers.map(prayer => 
          prayer.id === prayerId ? updatedPrayer : prayer
        ),
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update prayer',
        isLoading: false,
      });
    }
  },

  // Delete Prayer
  deletePrayer: async (prayerId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await prayerService.deletePrayer(prayerId);
      
      set({
        prayers: get().prayers.filter(prayer => prayer.id !== prayerId),
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
    try {
      await prayerService.interactWithPrayer(prayerId, { type });
      
      // Update local state optimistically
      set({
        prayers: get().prayers.map(prayer => {
          if (prayer.id === prayerId) {
            return {
              ...prayer,
              user_interaction: { type, created_at: new Date().toISOString() },
              interaction_count: (prayer.interaction_count || 0) + 1,
            };
          }
          return prayer;
        }),
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to interact with prayer',
      });
    }
  },

  // Clear Error
  clearError: () => set({ error: null }),

  // Set Loading
  setLoading: (loading: boolean) => set({ isLoading: loading }),
}));