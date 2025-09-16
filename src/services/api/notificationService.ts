import { supabase } from '@/config/supabase';
import { Notification } from '@/types/database.types';

/**
 * Notification Service - Manages notification-related API operations
 */
class NotificationService {
  /**
   * Get user notifications
   */
  async getNotifications(userId: string, page = 1, limit = 20): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        sender:profiles!sender_id(*),
        prayer:prayers!prayer_id(*),
        group:groups!group_id(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;
    return data || [];
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Create notification
   */
  async createNotification(notification: {
    user_id: string;
    sender_id?: string;
    type: string;
    title: string;
    message: string;
    prayer_id?: string;
    group_id?: string;
    metadata?: any;
  }): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notification.user_id,
        sender_id: notification.sender_id,
        type: notification.type,
        title: notification.title,
        body: notification.message,
        message: notification.message,
        prayer_id: notification.prayer_id,
        group_id: notification.group_id,
        metadata: notification.metadata || {},
        payload: notification.metadata || {},
      })
      .select(`
        *,
        sender:profiles!sender_id(*),
        prayer:prayers!prayer_id(*),
        group:groups!group_id(*)
      `)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create notification');
    return data;
  }

  /**
   * Subscribe to real-time notifications
   */
  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();
  }

  /**
   * Unsubscribe from notifications
   */
  unsubscribeFromNotifications(subscription: any) {
    supabase.removeChannel(subscription);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();