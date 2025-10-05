import { renderHook, act, waitFor } from '@testing-library/react-native';
import { usePrayerStore } from '../prayer/prayerStore';
import { prayerService } from '@/services/api/prayerService';
import { Prayer } from '@/types/database.types';

// Mock the prayer service
jest.mock('@/services/api/prayerService');
jest.mock('@/services/realtime/prayerRealtimeService');
jest.mock('@/services/offline/offlineService');

describe('Prayer Store - Optimistic Deletion', () => {
  const mockPrayer: Prayer = {
    id: 'prayer-123',
    user_id: 'user-456',
    text: 'Test prayer',
    privacy_level: 'public',
    location_granularity: 'hidden',
    status: 'open',
    is_anonymous: false,
    tags: [],
    images: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    pray_count: 5,
    like_count: 2,
    comment_count: 1,
  };

  beforeEach(() => {
    // Reset store state
    const { result } = renderHook(() => usePrayerStore());
    act(() => {
      result.current.prayers = [];
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('deletePrayerOptimistic', () => {
    it('should immediately remove prayer from UI before API call', async () => {
      const { result } = renderHook(() => usePrayerStore());

      // Setup initial state with prayer
      act(() => {
        result.current.prayers = [mockPrayer];
      });

      expect(result.current.prayers).toHaveLength(1);

      // Mock successful deletion
      (prayerService.deletePrayer as jest.Mock).mockResolvedValue(undefined);

      // Perform optimistic deletion
      await act(async () => {
        await result.current.deletePrayerOptimistic('prayer-123');
      });

      // Verify prayer was removed immediately (optimistic update)
      expect(result.current.prayers).toHaveLength(0);

      // Verify API was called
      await waitFor(() => {
        expect(prayerService.deletePrayer).toHaveBeenCalledWith('prayer-123');
      });
    });

    it('should rollback prayer on API failure', async () => {
      const { result } = renderHook(() => usePrayerStore());

      // Setup initial state with prayer
      act(() => {
        result.current.prayers = [mockPrayer];
      });

      // Mock API failure
      const apiError = new Error('Network error');
      (prayerService.deletePrayer as jest.Mock).mockRejectedValue(apiError);

      // Attempt optimistic deletion
      await act(async () => {
        try {
          await result.current.deletePrayerOptimistic('prayer-123');
        } catch (error) {
          // Expected to throw
        }
      });

      // Verify prayer was rolled back (restored in store)
      await waitFor(() => {
        expect(result.current.prayers).toHaveLength(1);
        expect(result.current.prayers[0].id).toBe('prayer-123');
      });

      // Verify error was set
      expect(result.current.error).toBe('Network error');
    });

    it('should throw error if prayer not found', async () => {
      const { result } = renderHook(() => usePrayerStore());

      // Empty prayers list
      act(() => {
        result.current.prayers = [];
      });

      // Attempt to delete non-existent prayer
      await expect(async () => {
        await act(async () => {
          await result.current.deletePrayerOptimistic('non-existent-id');
        });
      }).rejects.toThrow('Prayer not found');

      // Verify API was never called
      expect(prayerService.deletePrayer).not.toHaveBeenCalled();
    });

    it('should not affect other prayers during deletion', async () => {
      const otherPrayer: Prayer = {
        ...mockPrayer,
        id: 'prayer-789',
        text: 'Another prayer',
      };

      const { result } = renderHook(() => usePrayerStore());

      // Setup state with multiple prayers
      act(() => {
        result.current.prayers = [mockPrayer, otherPrayer];
      });

      expect(result.current.prayers).toHaveLength(2);

      // Mock successful deletion
      (prayerService.deletePrayer as jest.Mock).mockResolvedValue(undefined);

      // Delete first prayer
      await act(async () => {
        await result.current.deletePrayerOptimistic('prayer-123');
      });

      // Verify only the targeted prayer was removed
      expect(result.current.prayers).toHaveLength(1);
      expect(result.current.prayers[0].id).toBe('prayer-789');
      expect(result.current.prayers[0].text).toBe('Another prayer');
    });

    it('should preserve prayer order after rollback', async () => {
      const prayer1: Prayer = { ...mockPrayer, id: 'prayer-1', text: 'Prayer 1' };
      const prayer2: Prayer = { ...mockPrayer, id: 'prayer-2', text: 'Prayer 2' };
      const prayer3: Prayer = { ...mockPrayer, id: 'prayer-3', text: 'Prayer 3' };

      const { result } = renderHook(() => usePrayerStore());

      // Setup state
      act(() => {
        result.current.prayers = [prayer1, prayer2, prayer3];
      });

      // Mock API failure
      (prayerService.deletePrayer as jest.Mock).mockRejectedValue(new Error('Failed'));

      // Attempt deletion
      await act(async () => {
        try {
          await result.current.deletePrayerOptimistic('prayer-2');
        } catch (error) {
          // Expected
        }
      });

      // Verify prayers were restored in original order
      await waitFor(() => {
        expect(result.current.prayers).toHaveLength(3);
        expect(result.current.prayers[0].id).toBe('prayer-1');
        expect(result.current.prayers[1].id).toBe('prayer-2');
        expect(result.current.prayers[2].id).toBe('prayer-3');
      });
    });

    it('should clear isLoading flag during optimistic deletion', async () => {
      const { result } = renderHook(() => usePrayerStore());

      // Setup initial state
      act(() => {
        result.current.prayers = [mockPrayer];
        result.current.isLoading = true; // Simulate loading state
      });

      // Mock successful deletion
      (prayerService.deletePrayer as jest.Mock).mockResolvedValue(undefined);

      // Perform optimistic deletion
      await act(async () => {
        await result.current.deletePrayerOptimistic('prayer-123');
      });

      // Verify isLoading is false (optimistic deletion doesn't show loading)
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Legacy deletePrayer (with deletingPrayerIds)', () => {
    it('should add prayer to deletingPrayerIds before deletion', async () => {
      const { result } = renderHook(() => usePrayerStore());

      // Setup initial state
      act(() => {
        result.current.prayers = [mockPrayer];
      });

      // Mock successful deletion with delay
      (prayerService.deletePrayer as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      // Start deletion
      const deletePromise = act(async () => {
        await result.current.deletePrayer('prayer-123');
      });

      // Wait a bit then check deleting state
      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify prayer is marked as deleting
      expect(result.current.deletingPrayerIds.has('prayer-123')).toBe(true);

      // Wait for completion
      await deletePromise;

      // Verify deleting flag is cleared
      expect(result.current.deletingPrayerIds.has('prayer-123')).toBe(false);
    });

    it('should remove deleting flag on error', async () => {
      const { result } = renderHook(() => usePrayerStore());

      // Setup initial state
      act(() => {
        result.current.prayers = [mockPrayer];
      });

      // Mock API failure
      (prayerService.deletePrayer as jest.Mock).mockRejectedValue(new Error('Failed'));

      // Attempt deletion
      await act(async () => {
        try {
          await result.current.deletePrayer('prayer-123');
        } catch (error) {
          // Expected
        }
      });

      // Verify deleting flag is cleared even on error
      expect(result.current.deletingPrayerIds.has('prayer-123')).toBe(false);

      // Verify prayer still exists (not optimistic)
      expect(result.current.prayers).toHaveLength(1);
    });
  });
});
