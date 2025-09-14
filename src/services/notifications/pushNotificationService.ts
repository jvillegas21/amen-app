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

export interface PushNotificationData {
  type: 'prayer_response' | 'new_follower' | 'group_invite' | 'prayer_reminder' | 'system' | 'comment' | 'group_update';
  title: string;
  body: string;
  prayer_id?: string;
  group_id?: string;
  user_id?: string;
}

/**
 * Push Notification Service - Manages push notifications
 */
class PushNotificationService {
  private expoPushToken: string | null = null;

  /**
   * Register for push notifications
   */
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      this.expoPushToken = token;
      
      // Save token to user profile
      await this.savePushToken(token);
      
      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Save push token to user profile
   */
  private async savePushToken(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ 
          push_token: token,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Failed to save push token:', error);
      }
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(
    pushToken: string,
    data: PushNotificationData
  ): Promise<void> {
    try {
      const message = {
        to: pushToken,
        sound: 'default',
        title: data.title,
        body: data.body,
        data: {
          type: data.type,
          prayer_id: data.prayer_id,
          group_id: data.group_id,
          user_id: data.user_id,
        },
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

      if (!response.ok) {
        throw new Error(`Push notification failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  /**
   * Schedule local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: trigger || null,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      throw error;
    }
  }

  /**
   * Cancel scheduled notification
   */
  async cancelScheduledNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling scheduled notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllScheduledNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all scheduled notifications:', error);
    }
  }

  /**
   * Get notification settings
   */
  async getNotificationSettings(): Promise<{
    enabled: boolean;
    sound: boolean;
    badge: boolean;
  }> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      const settings = await Notifications.getNotificationCategoriesAsync();
      
      return {
        enabled: status === 'granted',
        sound: true, // Default to true
        badge: true, // Default to true
      };
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return {
        enabled: false,
        sound: false,
        badge: false,
      };
    }
  }

  /**
   * Set up notification listeners
   */
  setupNotificationListeners() {
    // Handle notification received while app is foregrounded
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // Handle the notification (e.g., update UI, show in-app notification)
    });

    // Handle notification tapped
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      // Handle notification tap (e.g., navigate to relevant screen)
      this.handleNotificationTap(response.notification.request.content.data);
    });

    return {
      notificationListener,
      responseListener,
    };
  }

  /**
   * Handle notification tap
   */
  private handleNotificationTap(data: any) {
    // Navigate to relevant screen based on notification type
    switch (data.type) {
      case 'prayer_response':
      case 'comment':
        if (data.prayer_id) {
          // Navigate to prayer details
          console.log('Navigate to prayer:', data.prayer_id);
        }
        break;
      case 'group_invite':
      case 'group_update':
        if (data.group_id) {
          // Navigate to group details
          console.log('Navigate to group:', data.group_id);
        }
        break;
      case 'new_follower':
        if (data.user_id) {
          // Navigate to user profile
          console.log('Navigate to user profile:', data.user_id);
        }
        break;
      default:
        // Navigate to notifications screen
        console.log('Navigate to notifications');
        break;
    }
  }

  /**
   * Get push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();