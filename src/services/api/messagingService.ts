import { supabase } from '@/config/supabase';
import { DirectMessage, Profile } from '@/types/database.types';
import { ErrorTransformationService } from '@/services/errorTransformationService';

export interface Conversation {
  id: string;
  user_id: string;
  user_display_name: string;
  user_avatar_url?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_online?: boolean;
  last_seen?: string;
}

export interface MessageThread {
  id: string;
  sender_id: string;
  recipient_id: string;
  messages: DirectMessage[];
  participant: Profile;
}

/**
 * Messaging Service - Handles direct messaging functionality
 */
class MessagingService {
  /**
   * Get user's conversations (list of people they've messaged)
   */
  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      // Get conversations where user is either sender or recipient
      const { data: conversations, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:profiles!sender_id(
            id,
            display_name,
            avatar_url,
            last_active
          ),
          recipient:profiles!recipient_id(
            id,
            display_name,
            avatar_url,
            last_active
          )
        `)
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(ErrorTransformationService.transformError(error, 'getConversations'));
      }

      // Group messages by conversation partner and get latest message
      const conversationMap = new Map<string, Conversation>();

      conversations?.forEach((message) => {
        const isSender = message.sender_id === userId;
        const partner = isSender ? message.recipient : message.sender;
        const partnerId = isSender ? message.recipient_id : message.sender_id;

        if (!partner) return;

        const existingConversation = conversationMap.get(partnerId);
        
        if (!existingConversation || new Date(message.created_at) > new Date(existingConversation.last_message_time)) {
          // Count unread messages for this conversation
          const unreadCount = isSender ? 0 : (message.is_read ? 0 : 1);
          
          conversationMap.set(partnerId, {
            id: partnerId,
            user_id: partnerId,
            user_display_name: partner.display_name,
            user_avatar_url: partner.avatar_url,
            last_message: message.content,
            last_message_time: message.created_at,
            unread_count: unreadCount,
            is_online: this.isUserOnline(partner.last_active),
            last_seen: partner.last_active,
          });
        } else if (!isSender && !message.is_read) {
          // Increment unread count for existing conversation
          existingConversation.unread_count += 1;
        }
      });

      return Array.from(conversationMap.values());
    } catch (error) {
      throw new Error(ErrorTransformationService.transformError(error, 'getConversations'));
    }
  }

  /**
   * Get messages between two users
   */
  async getMessages(userId: string, otherUserId: string, page = 1, limit = 50): Promise<DirectMessage[]> {
    try {
      const offset = (page - 1) * limit;

      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(ErrorTransformationService.transformError(error, 'getMessages'));
      }

      return (data || []).reverse(); // Reverse to show oldest first
    } catch (error) {
      throw new Error(ErrorTransformationService.transformError(error, 'getMessages'));
    }
  }

  /**
   * Send a message
   */
  async sendMessage(recipientId: string, content: string): Promise<DirectMessage> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      if (user.id === recipientId) {
        throw new Error('Cannot send message to yourself');
      }

      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content: content.trim(),
          is_read: false,
        })
        .select()
        .single();

      if (error) {
        throw new Error(ErrorTransformationService.transformError(error, 'sendMessage'));
      }

      if (!data) {
        throw new Error('Failed to send message');
      }

      return data;
    } catch (error) {
      throw new Error(ErrorTransformationService.transformError(error, 'sendMessage'));
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(senderId: string, recipientId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('sender_id', senderId)
        .eq('recipient_id', user.id);

      if (error) {
        throw new Error(ErrorTransformationService.transformError(error, 'markMessagesAsRead'));
      }
    } catch (error) {
      throw new Error(ErrorTransformationService.transformError(error, 'markMessagesAsRead'));
    }
  }

  /**
   * Get unread message count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('is_read', false);

      if (error) {
        throw new Error(ErrorTransformationService.transformError(error, 'getUnreadCount'));
      }

      return count || 0;
    } catch (error) {
      throw new Error(ErrorTransformationService.transformError(error, 'getUnreadCount'));
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Only allow sender to delete their own messages
      const { error } = await supabase
        .from('direct_messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) {
        throw new Error(ErrorTransformationService.transformError(error, 'deleteMessage'));
      }
    } catch (error) {
      throw new Error(ErrorTransformationService.transformError(error, 'deleteMessage'));
    }
  }

  /**
   * Block a user (prevents messaging)
   */
  async blockUser(userId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      if (user.id === userId) {
        throw new Error('Cannot block yourself');
      }

      const { error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: user.id,
          blocked_id: userId,
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('User is already blocked');
        }
        throw new Error(ErrorTransformationService.transformError(error, 'blockUser'));
      }
    } catch (error) {
      throw new Error(ErrorTransformationService.transformError(error, 'blockUser'));
    }
  }

  /**
   * Unblock a user
   */
  async unblockUser(userId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', userId);

      if (error) {
        throw new Error(ErrorTransformationService.transformError(error, 'unblockUser'));
      }
    } catch (error) {
      throw new Error(ErrorTransformationService.transformError(error, 'unblockUser'));
    }
  }

  /**
   * Check if user is blocked
   */
  async isUserBlocked(userId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return false;
      }

      const { data, error } = await supabase
        .from('blocked_users')
        .select('id')
        .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${userId}),and(blocker_id.eq.${userId},blocked_id.eq.${user.id})`)
        .limit(1);

      if (error) {
        throw new Error(ErrorTransformationService.transformError(error, 'isUserBlocked'));
      }

      return !!data?.length;
    } catch (error) {
      throw new Error(ErrorTransformationService.transformError(error, 'isUserBlocked'));
    }
  }

  /**
   * Get blocked users
   */
  async getBlockedUsers(): Promise<Profile[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('blocked_users')
        .select(`
          blocked:profiles!blocked_id(
            id,
            display_name,
            avatar_url,
            bio
          )
        `)
        .eq('blocker_id', user.id);

      if (error) {
        throw new Error(ErrorTransformationService.transformError(error, 'getBlockedUsers'));
      }

      return data?.map(item => item.blocked).filter(Boolean) || [];
    } catch (error) {
      throw new Error(ErrorTransformationService.transformError(error, 'getBlockedUsers'));
    }
  }

  /**
   * Subscribe to new messages for a conversation
   */
  subscribeToMessages(userId: string, otherUserId: string, callback: (message: DirectMessage) => void) {
    return supabase
      .channel(`messages-${userId}-${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `or(and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId}))`,
        },
        (payload) => {
          callback(payload.new as DirectMessage);
        }
      )
      .subscribe();
  }

  /**
   * Subscribe to conversation updates
   */
  subscribeToConversations(userId: string, callback: (conversation: Conversation) => void) {
    return supabase
      .channel(`conversations-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `or(sender_id.eq.${userId},recipient_id.eq.${userId})`,
        },
        async (payload) => {
          const message = payload.new as DirectMessage;
          const isSender = message.sender_id === userId;
          const partnerId = isSender ? message.recipient_id : message.sender_id;

          // Get partner profile
          const { data: partner } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, last_active')
            .eq('id', partnerId)
            .single();

          if (partner) {
            const conversation: Conversation = {
              id: partnerId,
              user_id: partnerId,
              user_display_name: partner.display_name,
              user_avatar_url: partner.avatar_url,
              last_message: message.content,
              last_message_time: message.created_at,
              unread_count: isSender ? 0 : 1,
              is_online: this.isUserOnline(partner.last_active),
              last_seen: partner.last_active,
            };

            callback(conversation);
          }
        }
      )
      .subscribe();
  }

  /**
   * Check if user is online based on last_active timestamp
   */
  private isUserOnline(lastActive?: string): boolean {
    if (!lastActive) return false;
    
    const lastActiveTime = new Date(lastActive);
    const now = new Date();
    const diffInMinutes = (now.getTime() - lastActiveTime.getTime()) / (1000 * 60);
    
    // Consider user online if they were active in the last 5 minutes
    return diffInMinutes <= 5;
  }
}

// Export singleton instance
export const messagingService = new MessagingService();