import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '@/config/supabase';

/**
 * Notification Service
 * Handles push notifications and local notifications
 */
class NotificationService {
  private notificationListener: any = null;
  private responseListener: any = null;

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Register for push notifications
    const token = await this.registerForPushNotifications();
    if (token) {
      await this.saveTokenToDatabase(token);
    }

    // Set up notification listeners
    this.setupListeners();
  }

  /**
   * Register for push notifications
   */
  private async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    try {
      // Get existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification');
        return null;
      }

      // Get Expo push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#5B21B6',
        });
      }

      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Save push token to database
   */
  private async saveTokenToDatabase(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save token to user profile or separate tokens table
      await supabase
        .from('push_tokens')
        .upsert({
          user_id: user.id,
          token,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Failed to save push token:', error);
    }
  }

  /**
   * Set up notification listeners
   */
  private setupListeners(): void {
    // Listen for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    // Listen for user interactions with notifications
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        this.handleNotificationResponse(response);
      }
    );
  }

  /**
   * Handle notification response
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { notification } = response;
    const data = notification.request.content.data;

    // Navigate based on notification type
    if (data?.type === 'prayer_prayed_for') {
      // Navigate to prayer details
      // navigationRef.navigate('PrayerDetails', { prayerId: data.prayerId });
    } else if (data?.type === 'group_invite') {
      // Navigate to group details
      // navigationRef.navigate('GroupDetails', { groupId: data.groupId });
    }
    // Add more notification types as needed
  }

  /**
   * Schedule local notification
   */
  async scheduleLocalNotification({
    title,
    body,
    data,
    trigger,
  }: {
    title: string;
    body: string;
    data?: any;
    trigger?: Notifications.NotificationTriggerInput;
  }): Promise<string> {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: trigger || null,
    });

    return id;
  }

  /**
   * Schedule prayer reminder
   */
  async schedulePrayerReminder(
    prayerId: string,
    prayerText: string,
    frequency: 'daily' | 'weekly'
  ): Promise<string> {
    const trigger = frequency === 'daily'
      ? { hour: 9, minute: 0, repeats: true }
      : { weekday: 1, hour: 9, minute: 0, repeats: true };

    return await this.scheduleLocalNotification({
      title: 'Prayer Reminder',
      body: `Remember to pray for: ${prayerText.substring(0, 50)}...`,
      data: { prayerId, type: 'prayer_reminder' },
      trigger,
    });
  }

  /**
   * Cancel scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();