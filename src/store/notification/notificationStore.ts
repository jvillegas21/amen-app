import { create } from 'zustand';
import { Notification } from '@/types/database.types';
import { notificationService } from '@/services/api/notificationService';

/**
 * Notification Store Interface
 * Manages notification-related state and operations
 */
interface NotificationState {
  // State
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  currentPage: number;
  error: string | null;

  // Actions
  fetchNotifications: (page?: number) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
  updateUnreadCount: () => Promise<void>;
  subscribeToNotifications: (userId: string) => void;
  unsubscribeFromNotifications: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

/**
 * Notification Store Implementation
 */
export const useNotificationStore = create<NotificationState>((set, get) => ({
  // Initial State
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isRefreshing: false,
  hasMore: true,
  currentPage: 1,
  error: null,
  subscription: null,

  // Fetch Notifications
  fetchNotifications: async (page = 1) => {
    const { notifications } = get();
    set({ isLoading: true, error: null });
    
    try {
      // Get user ID from auth store
      const { useAuthStore } = await import('@/store/auth/authStore');
      const { profile } = useAuthStore.getState();
      
      if (!profile?.id) {
        throw new Error('User not authenticated');
      }

      const newNotifications = await notificationService.getNotifications(profile.id, page, 20);

      set({
        notifications: page === 1 ? newNotifications : [...notifications, ...newNotifications],
        currentPage: page,
        hasMore: newNotifications.length === 20,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch notifications',
        isLoading: false,
      });
    }
  },

  // Refresh Notifications
  refreshNotifications: async () => {
    set({ isRefreshing: true, error: null });
    
    try {
      const { useAuthStore } = await import('@/store/auth/authStore');
      const { profile } = useAuthStore.getState();
      
      if (!profile?.id) {
        throw new Error('User not authenticated');
      }

      const notifications = await notificationService.getNotifications(profile.id, 1, 20);

      set({
        notifications,
        currentPage: 1,
        hasMore: notifications.length === 20,
        isRefreshing: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to refresh notifications',
        isRefreshing: false,
      });
    }
  },

  // Load More Notifications
  loadMoreNotifications: async () => {
    const { currentPage, hasMore, isLoading } = get();
    
    if (!hasMore || isLoading) return;

    const nextPage = currentPage + 1;
    await get().fetchNotifications(nextPage);
  },

  // Mark as Read
  markAsRead: async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      set(state => ({
        notifications: state.notifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, read_at: new Date().toISOString() }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  // Mark All as Read
  markAllAsRead: async () => {
    try {
      const { useAuthStore } = await import('@/store/auth/authStore');
      const { profile } = useAuthStore.getState();
      
      if (!profile?.id) {
        throw new Error('User not authenticated');
      }

      await notificationService.markAllAsRead(profile.id);
      
      set(state => ({
        notifications: state.notifications.map(notification => ({
          ...notification,
          read_at: new Date().toISOString(),
        })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },

  // Delete Notification
  deleteNotification: async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      set(state => ({
        notifications: state.notifications.filter(notification => notification.id !== notificationId),
        unreadCount: state.notifications.find(n => n.id === notificationId && !n.read_at) 
          ? Math.max(0, state.unreadCount - 1) 
          : state.unreadCount,
      }));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  },

  // Add Notification (for real-time updates)
  addNotification: (notification: Notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  // Update Unread Count
  updateUnreadCount: async () => {
    try {
      const { useAuthStore } = await import('@/store/auth/authStore');
      const { profile } = useAuthStore.getState();
      
      if (!profile?.id) {
        throw new Error('User not authenticated');
      }

      const count = await notificationService.getUnreadCount(profile.id);
      set({ unreadCount: count });
    } catch (error) {
      console.error('Failed to update unread count:', error);
    }
  },

  // Subscribe to Real-time Notifications
  subscribeToNotifications: (userId: string) => {
    const { subscription } = get();
    
    // Unsubscribe from existing subscription
    if (subscription) {
      notificationService.unsubscribeFromNotifications(subscription);
    }

    // Subscribe to new notifications
    const newSubscription = notificationService.subscribeToNotifications(userId, (notification) => {
      get().addNotification(notification);
    });

    set({ subscription: newSubscription });
  },

  // Unsubscribe from Notifications
  unsubscribeFromNotifications: () => {
    const { subscription } = get();
    
    if (subscription) {
      notificationService.unsubscribeFromNotifications(subscription);
      set({ subscription: null });
    }
  },

  // Clear Error
  clearError: () => set({ error: null }),

  // Set Loading
  setLoading: (loading: boolean) => set({ isLoading: loading }),
}));