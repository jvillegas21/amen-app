/**
 * Notification Service - Handles push notifications and real-time notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '@/config/supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type: 'prayer_interaction' | 'prayer_comment' | 'prayer_answered' | 'group_invite' | 'friend_request' | 'system';
  prayerId?: string;
  commentId?: string;
  groupId?: string;
  userId?: string;
  title: string;
  body: string;
  data?: any;
}

export interface NotificationSettings {
  prayerInteractions: boolean;
  prayerComments: boolean;
  prayerAnswered: boolean;
  groupInvites: boolean;
  friendRequests: boolean;
  systemUpdates: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
}

class NotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  /**
   * Initialize notification service
   */
  async initialize(): Promise<boolean> {
    try {
      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Notification permissions not granted');
        return false;
      }

      // Get push token
      await this.getPushToken();

      // Set up listeners
      this.setupNotificationListeners();

      return true;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      return false;
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn('Must use physical device for push notifications');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return true;
  }

  /**
   * Get Expo push token
   */
  async getPushToken(): Promise<string | null> {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });
      
      this.expoPushToken = token.data;
      
      // Save token to user profile
      await this.savePushTokenToProfile(token.data);
      
      return token.data;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  /**
   * Save push token to user profile
   */
  private async savePushTokenToProfile(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('profiles')
        .update({ 
          push_token: token,
          push_token_updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    } catch (error) {
      console.error('Failed to save push token:', error);
    }
  }

  /**
   * Set up notification listeners
   */
  private setupNotificationListeners(): void {
    // Handle notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // Handle foreground notification display
    });

    // Handle notification taps
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      this.handleNotificationTap(response);
    });
  }

  /**
   * Handle notification tap
   */
  private handleNotificationTap(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data as NotificationData;
    
    // Navigate based on notification type
    switch (data.type) {
      case 'prayer_interaction':
      case 'prayer_comment':
        if (data.prayerId) {
          // Navigate to prayer details
          // This would be handled by the navigation service
        }
        break;
      case 'group_invite':
        if (data.groupId) {
          // Navigate to group details
        }
        break;
      case 'friend_request':
        // Navigate to friends screen
        break;
      default:
        // Navigate to home or relevant screen
        break;
    }
  }

  /**
   * Send local notification
   */
  async sendLocalNotification(notification: NotificationData): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification,
          sound: 'default',
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Failed to send local notification:', error);
    }
  }

  /**
   * Send push notification to user
   */
  async sendPushNotification(
    userId: string,
    notification: NotificationData
  ): Promise<boolean> {
    try {
      // Get user's push token
      const { data: profile } = await supabase
        .from('profiles')
        .select('push_token')
        .eq('id', userId)
        .single();

      if (!profile?.push_token) {
        console.warn('User has no push token');
        return false;
      }

      // Send via Expo push service
      const message = {
        to: profile.push_token,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification,
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      return result.data?.[0]?.status === 'ok';
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }

  /**
   * Get user's notification settings
   */
  async getNotificationSettings(userId: string): Promise<NotificationSettings> {
    try {
      const { data } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (data) {
        return data.settings as NotificationSettings;
      }

      // Return default settings
      return {
        prayerInteractions: true,
        prayerComments: true,
        prayerAnswered: true,
        groupInvites: true,
        friendRequests: true,
        systemUpdates: true,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00',
        },
      };
    } catch (error) {
      console.error('Failed to get notification settings:', error);
      return {
        prayerInteractions: true,
        prayerComments: true,
        prayerAnswered: true,
        groupInvites: true,
        friendRequests: true,
        systemUpdates: true,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00',
        },
      };
    }
  }

  /**
   * Update user's notification settings
   */
  async updateNotificationSettings(
    userId: string,
    settings: NotificationSettings
  ): Promise<void> {
    try {
      await supabase
        .from('notification_settings')
        .upsert({
          user_id: userId,
          settings,
          updated_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      throw error;
    }
  }

  /**
   * Check if notifications should be sent based on quiet hours
   */
  private isWithinQuietHours(settings: NotificationSettings): boolean {
    if (!settings.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = settings.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = settings.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      // Same day quiet hours (e.g., 22:00 to 08:00)
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight quiet hours (e.g., 22:00 to 08:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Send notification if user settings allow it
   */
  async sendNotificationIfAllowed(
    userId: string,
    notification: NotificationData
  ): Promise<boolean> {
    try {
      const settings = await this.getNotificationSettings(userId);
      
      // Check if notification type is enabled
      let isEnabled = false;
      switch (notification.type) {
        case 'prayer_interaction':
          isEnabled = settings.prayerInteractions;
          break;
        case 'prayer_comment':
          isEnabled = settings.prayerComments;
          break;
        case 'prayer_answered':
          isEnabled = settings.prayerAnswered;
          break;
        case 'group_invite':
          isEnabled = settings.groupInvites;
          break;
        case 'friend_request':
          isEnabled = settings.friendRequests;
          break;
        case 'system':
          isEnabled = settings.systemUpdates;
          break;
      }

      if (!isEnabled) return false;

      // Check quiet hours
      if (this.isWithinQuietHours(settings)) return false;

      // Send notification
      return await this.sendPushNotification(userId, notification);
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  }

  /**
   * Get notification count
   */
  async getNotificationCount(): Promise<number> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications.length;
    } catch (error) {
      console.error('Failed to get notification count:', error);
      return 0;
    }
  }

  /**
   * Cleanup listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  /**
   * Get push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;