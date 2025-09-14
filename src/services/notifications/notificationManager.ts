import { useNotificationStore } from '@/store/notification/notificationStore';
import { pushNotificationService } from './pushNotificationService';
import { notificationService } from '@/services/api/notificationService';

/**
 * Notification Manager - Coordinates notification system
 */
class NotificationManager {
  private isInitialized = false;
  private listeners: any[] = [];

  /**
   * Initialize notification system
   */
  async initialize(userId: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Register for push notifications
      await pushNotificationService.registerForPushNotifications();

      // Set up notification listeners
      const notificationListeners = pushNotificationService.setupNotificationListeners();
      this.listeners.push(notificationListeners.notificationListener);
      this.listeners.push(notificationListeners.responseListener);

      // Subscribe to real-time notifications
      useNotificationStore.getState().subscribeToNotifications(userId);

      // Fetch initial notifications
      await useNotificationStore.getState().fetchNotifications();

      // Update unread count
      await useNotificationStore.getState().updateUnreadCount();

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize notification system:', error);
    }
  }

  /**
   * Cleanup notification system
   */
  cleanup(): void {
    // Unsubscribe from real-time notifications
    useNotificationStore.getState().unsubscribeFromNotifications();

    // Remove notification listeners
    this.listeners.forEach(listener => {
      if (listener && listener.remove) {
        listener.remove();
      }
    });
    this.listeners = [];

    this.isInitialized = false;
  }

  /**
   * Send notification to user
   */
  async sendNotification(
    userId: string,
    notification: {
      type: string;
      title: string;
      message: string;
      prayer_id?: string;
      group_id?: string;
      sender_id?: string;
    }
  ): Promise<void> {
    try {
      // Create notification in database
      const createdNotification = await notificationService.createNotification({
        user_id: userId,
        sender_id: notification.sender_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        prayer_id: notification.prayer_id,
        group_id: notification.group_id,
      });

      // Get user's push token
      const { data: profile } = await supabase
        .from('profiles')
        .select('push_token')
        .eq('id', userId)
        .single();

      // Send push notification if token exists
      if (profile?.push_token) {
        await pushNotificationService.sendPushNotification(profile.push_token, {
          type: notification.type as any,
          title: notification.title,
          body: notification.message,
          prayer_id: notification.prayer_id,
          group_id: notification.group_id,
          user_id: notification.sender_id,
        });
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  /**
   * Send prayer response notification
   */
  async sendPrayerResponseNotification(
    prayerOwnerId: string,
    responderId: string,
    prayerId: string,
    responderName: string
  ): Promise<void> {
    await this.sendNotification(prayerOwnerId, {
      type: 'prayer_response',
      title: 'Someone prayed for your request',
      message: `${responderName} prayed for your prayer request`,
      prayer_id: prayerId,
      sender_id: responderId,
    });
  }

  /**
   * Send new follower notification
   */
  async sendNewFollowerNotification(
    userId: string,
    followerId: string,
    followerName: string
  ): Promise<void> {
    await this.sendNotification(userId, {
      type: 'new_follower',
      title: 'New follower',
      message: `${followerName} started following you`,
      sender_id: followerId,
    });
  }

  /**
   * Send group invite notification
   */
  async sendGroupInviteNotification(
    userId: string,
    groupId: string,
    groupName: string,
    inviterId: string,
    inviterName: string
  ): Promise<void> {
    await this.sendNotification(userId, {
      type: 'group_invite',
      title: 'Group invitation',
      message: `${inviterName} invited you to join "${groupName}"`,
      group_id: groupId,
      sender_id: inviterId,
    });
  }

  /**
   * Send comment notification
   */
  async sendCommentNotification(
    prayerOwnerId: string,
    commenterId: string,
    prayerId: string,
    commenterName: string
  ): Promise<void> {
    await this.sendNotification(prayerOwnerId, {
      type: 'comment',
      title: 'New comment on your prayer',
      message: `${commenterName} commented on your prayer request`,
      prayer_id: prayerId,
      sender_id: commenterId,
    });
  }

  /**
   * Send group update notification
   */
  async sendGroupUpdateNotification(
    groupId: string,
    groupName: string,
    updateType: string,
    updaterId: string,
    updaterName: string
  ): Promise<void> {
    // Get all group members except the updater
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('status', 'active')
      .neq('user_id', updaterId);

    if (members) {
      // Send notification to all members
      const notificationPromises = members.map(member =>
        this.sendNotification(member.user_id, {
          type: 'group_update',
          title: 'Group activity',
          message: `${updaterName} ${updateType} in "${groupName}"`,
          group_id: groupId,
          sender_id: updaterId,
        })
      );

      await Promise.all(notificationPromises);
    }
  }

  /**
   * Schedule prayer reminder
   */
  async schedulePrayerReminder(
    prayerId: string,
    prayerText: string,
    reminderTime: Date
  ): Promise<string> {
    return await pushNotificationService.scheduleLocalNotification(
      'Prayer Reminder',
      `Don't forget to pray: ${prayerText.substring(0, 50)}...`,
      { prayer_id: prayerId, type: 'prayer_reminder' },
      { date: reminderTime }
    );
  }

  /**
   * Cancel prayer reminder
   */
  async cancelPrayerReminder(notificationId: string): Promise<void> {
    await pushNotificationService.cancelScheduledNotification(notificationId);
  }

  /**
   * Get notification settings
   */
  async getNotificationSettings(): Promise<{
    pushEnabled: boolean;
    soundEnabled: boolean;
    badgeEnabled: boolean;
  }> {
    const settings = await pushNotificationService.getNotificationSettings();
    return {
      pushEnabled: settings.enabled,
      soundEnabled: settings.sound,
      badgeEnabled: settings.badge,
    };
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(settings: {
    pushEnabled?: boolean;
    soundEnabled?: boolean;
    badgeEnabled?: boolean;
  }): Promise<void> {
    // Update local settings
    if (settings.pushEnabled !== undefined) {
      if (settings.pushEnabled) {
        await pushNotificationService.requestPermissions();
      }
    }

    // TODO: Save settings to user profile
    console.log('Notification settings updated:', settings);
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager();