/**
 * Notifications Hook - Manages notification settings and functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { notificationService, NotificationSettings } from '@/services/notifications/notificationService';

interface UseNotificationsReturn {
  // Status
  isInitialized: boolean;
  hasPermission: boolean;
  pushToken: string | null;
  
  // Settings
  settings: NotificationSettings | null;
  isLoadingSettings: boolean;
  
  // Actions
  requestPermissions: () => Promise<boolean>;
  updateSettings: (settings: NotificationSettings) => Promise<void>;
  sendTestNotification: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize notification service
  useEffect(() => {
    const initialize = async () => {
      try {
        const initialized = await notificationService.initialize();
        setIsInitialized(initialized);
        
        if (initialized) {
          setHasPermission(true);
          setPushToken(notificationService.getPushToken());
          await loadSettings();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize notifications');
      }
    };

    initialize();
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      setIsLoadingSettings(true);
      const { data: { user } } = await import('@/config/supabase').then(m => m.supabase.auth.getUser());
      
      if (user?.user) {
        const userSettings = await notificationService.getNotificationSettings(user.user.id);
        setSettings(userSettings);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notification settings');
    } finally {
      setIsLoadingSettings(false);
    }
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await notificationService.requestPermissions();
      setHasPermission(granted);
      
      if (granted) {
        const token = await notificationService.getPushToken();
        setPushToken(token);
        await loadSettings();
      }
      
      return granted;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request permissions');
      return false;
    }
  }, [loadSettings]);

  const updateSettings = useCallback(async (newSettings: NotificationSettings) => {
    try {
      const { data: { user } } = await import('@/config/supabase').then(m => m.supabase.auth.getUser());
      
      if (user?.user) {
        await notificationService.updateNotificationSettings(user.user.id, newSettings);
        setSettings(newSettings);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notification settings');
      throw err;
    }
  }, []);

  const sendTestNotification = useCallback(async () => {
    try {
      await notificationService.sendLocalNotification({
        type: 'system',
        title: 'Test Notification',
        body: 'This is a test notification from Amenity',
        data: {},
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send test notification');
    }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    try {
      await notificationService.clearAllNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear notifications');
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isInitialized,
    hasPermission,
    pushToken,
    settings,
    isLoadingSettings,
    requestPermissions,
    updateSettings,
    sendTestNotification,
    clearAllNotifications,
    error,
    clearError,
  };
};