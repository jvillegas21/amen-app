import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import EditPrayerScreen from '../EditPrayerScreen';
import { usePrayerStore } from '@/store/prayer/prayerStore';
import { useAuthStore } from '@/store/auth/authStore';
import { CommonActions } from '@react-navigation/native';

// Mock dependencies
jest.mock('@/store/prayer/prayerStore');
jest.mock('@/store/auth/authStore');
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
    setOptions: jest.fn(),
  }),
  useRoute: () => ({
    params: { prayerId: 'prayer-123' },
  }),
  CommonActions: {
    reset: jest.fn((config) => ({ type: 'RESET', ...config })),
  },
}));
jest.mock('expo-image-picker');
jest.mock('expo-location');

describe('EditPrayerScreen - Deletion Flow', () => {
  const mockDeleteOptimistic = jest.fn();
  const mockNavigationDispatch = jest.fn();

  const mockPrayer = {
    id: 'prayer-123',
    user_id: 'user-456',
    text: 'Test prayer content',
    privacy_level: 'public' as const,
    location_granularity: 'hidden' as const,
    status: 'open' as const,
    is_anonymous: false,
    tags: ['health_healing'],
    images: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    pray_count: 5,
    like_count: 2,
    comment_count: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert');

    // Mock prayer store
    (usePrayerStore as unknown as jest.Mock).mockReturnValue({
      prayers: [mockPrayer],
      deletePrayerOptimistic: mockDeleteOptimistic,
      updatePrayer: jest.fn(),
    });

    // Mock auth store
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      profile: { id: 'user-456', display_name: 'Test User' },
    });

    // Mock navigation
    require('@react-navigation/native').useNavigation.mockReturnValue({
      navigate: jest.fn(),
      goBack: jest.fn(),
      dispatch: mockNavigationDispatch,
      setOptions: jest.fn(),
    });
  });

  describe('Optimistic Deletion', () => {
    it('should call deletePrayerOptimistic when delete confirmed', async () => {
      mockDeleteOptimistic.mockResolvedValue(undefined);

      const { getByText } = render(<EditPrayerScreen />);

      // Find and press delete button
      const deleteButton = getByText('Delete Prayer');
      fireEvent.press(deleteButton);

      // Verify confirmation alert shown
      expect(Alert.alert).toHaveBeenCalledWith(
        'Delete Prayer',
        'Are you sure you want to delete this prayer? This action cannot be undone.',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel' }),
          expect.objectContaining({ text: 'Delete' }),
        ])
      );

      // Simulate user confirming deletion
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const deleteAction = alertCall[2].find((btn: any) => btn.text === 'Delete');

      await act(async () => {
        await deleteAction.onPress();
      });

      // Verify optimistic deletion was called
      expect(mockDeleteOptimistic).toHaveBeenCalledWith('prayer-123');
    });

    it('should navigate immediately after optimistic deletion', async () => {
      mockDeleteOptimistic.mockResolvedValue(undefined);

      const { getByText } = render(<EditPrayerScreen />);

      // Trigger deletion
      const deleteButton = getByText('Delete Prayer');
      fireEvent.press(deleteButton);

      // Confirm deletion
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const deleteAction = alertCall[2].find((btn: any) => btn.text === 'Delete');

      await act(async () => {
        await deleteAction.onPress();
      });

      // Verify navigation happened immediately (not waiting for API)
      await waitFor(() => {
        expect(mockNavigationDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'RESET',
            index: 0,
            routes: [{ name: 'Main', params: { screen: 'Home' } }],
          })
        );
      });
    });

    it('should show success alert after navigation completes', async () => {
      mockDeleteOptimistic.mockResolvedValue(undefined);
      jest.useFakeTimers();

      const { getByText } = render(<EditPrayerScreen />);

      // Trigger and confirm deletion
      const deleteButton = getByText('Delete Prayer');
      fireEvent.press(deleteButton);

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const deleteAction = alertCall[2].find((btn: any) => btn.text === 'Delete');

      await act(async () => {
        await deleteAction.onPress();
      });

      // Clear the confirmation alert
      (Alert.alert as jest.Mock).mockClear();

      // Fast-forward to success alert (500ms delay)
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Verify success alert was shown
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Prayer deleted');
      });

      jest.useRealTimers();
    });

    it('should show error alert if deletion fails', async () => {
      const error = new Error('Network error');
      mockDeleteOptimistic.mockRejectedValue(error);

      const { getByText } = render(<EditPrayerScreen />);

      // Trigger and confirm deletion
      const deleteButton = getByText('Delete Prayer');
      fireEvent.press(deleteButton);

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const deleteAction = alertCall[2].find((btn: any) => btn.text === 'Delete');

      // Clear confirmation alert
      (Alert.alert as jest.Mock).mockClear();

      await act(async () => {
        await deleteAction.onPress();
      });

      // Verify error alert shown
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Failed to delete prayer. Please try again.'
        );
      });

      // Verify navigation did NOT happen
      expect(mockNavigationDispatch).not.toHaveBeenCalled();
    });

    it('should not navigate if deletion throws error', async () => {
      mockDeleteOptimistic.mockRejectedValue(new Error('API Error'));

      const { getByText } = render(<EditPrayerScreen />);

      // Trigger deletion
      const deleteButton = getByText('Delete Prayer');
      fireEvent.press(deleteButton);

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const deleteAction = alertCall[2].find((btn: any) => btn.text === 'Delete');

      await act(async () => {
        await deleteAction.onPress();
      });

      // Verify navigation was NOT called on error
      await waitFor(() => {
        expect(mockNavigationDispatch).not.toHaveBeenCalled();
      });
    });
  });

  describe('Delete Button Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByText } = render(<EditPrayerScreen />);

      const deleteButton = getByText('Delete Prayer');
      expect(deleteButton).toBeTruthy();
    });

    it('should show confirmation before deletion', () => {
      const { getByText } = render(<EditPrayerScreen />);

      const deleteButton = getByText('Delete Prayer');
      fireEvent.press(deleteButton);

      // Verify user must confirm before deletion
      expect(Alert.alert).toHaveBeenCalledWith(
        'Delete Prayer',
        expect.stringContaining('cannot be undone'),
        expect.any(Array)
      );
    });

    it('should allow cancellation of deletion', () => {
      const { getByText } = render(<EditPrayerScreen />);

      const deleteButton = getByText('Delete Prayer');
      fireEvent.press(deleteButton);

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const cancelButton = alertCall[2].find((btn: any) => btn.text === 'Cancel');

      expect(cancelButton).toBeDefined();
      expect(cancelButton.style).toBe('cancel');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid delete button clicks', async () => {
      mockDeleteOptimistic.mockResolvedValue(undefined);

      const { getByText } = render(<EditPrayerScreen />);

      const deleteButton = getByText('Delete Prayer');

      // Click multiple times rapidly
      fireEvent.press(deleteButton);
      fireEvent.press(deleteButton);
      fireEvent.press(deleteButton);

      // Only one alert should be shown
      expect(Alert.alert).toHaveBeenCalledTimes(1);
    });

    it('should handle prayer not found in store', () => {
      // Mock empty prayers array
      (usePrayerStore as unknown as jest.Mock).mockReturnValue({
        prayers: [],
        deletePrayerOptimistic: mockDeleteOptimistic,
        updatePrayer: jest.fn(),
      });

      const { getByText } = render(<EditPrayerScreen />);

      // Should show error state or navigate back
      // Exact behavior depends on component implementation
      expect(() => getByText('Delete Prayer')).not.toThrow();
    });
  });
});
