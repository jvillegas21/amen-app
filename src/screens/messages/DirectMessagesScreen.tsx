import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MainTabScreenProps } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  id: string;
  user_id: string;
  user_display_name: string;
  user_avatar_url?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_online: boolean;
  last_seen?: string;
}

/**
 * Direct Messages Screen - List of conversations
 * Based on direct_messages_list mockups
 */
const DirectMessagesScreen: React.FC<MainTabScreenProps<'Messages'>> = ({ navigation }) => {
  const { profile } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement conversations fetch from API
      // For now, using mock data
      const mockConversations: Conversation[] = [
        {
          id: '1',
          user_id: 'user2',
          user_display_name: 'Sarah Johnson',
          user_avatar_url: 'https://via.placeholder.com/40',
          last_message: 'Thank you so much for praying for my grandmother. She\'s doing much better now! 🙏',
          last_message_time: new Date(Date.now() - 300000).toISOString(),
          unread_count: 2,
          is_online: true,
        },
        {
          id: '2',
          user_id: 'user3',
          user_display_name: 'Mike Wilson',
          user_avatar_url: 'https://via.placeholder.com/40',
          last_message: 'I\'ll be praying for your job interview. You\'ve got this!',
          last_message_time: new Date(Date.now() - 1800000).toISOString(),
          unread_count: 0,
          is_online: false,
          last_seen: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          user_id: 'user4',
          user_display_name: 'Emily Chen',
          user_avatar_url: 'https://via.placeholder.com/40',
          last_message: 'Would you like to join our prayer group? We meet every Tuesday evening.',
          last_message_time: new Date(Date.now() - 7200000).toISOString(),
          unread_count: 1,
          is_online: true,
        },
        {
          id: '4',
          user_id: 'user5',
          user_display_name: 'David Rodriguez',
          user_avatar_url: 'https://via.placeholder.com/40',
          last_message: 'Thank you for the encouragement. It means a lot to me.',
          last_message_time: new Date(Date.now() - 86400000).toISOString(),
          unread_count: 0,
          is_online: false,
          last_seen: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          id: '5',
          user_id: 'user6',
          user_display_name: 'Lisa Thompson',
          user_avatar_url: 'https://via.placeholder.com/40',
          last_message: 'I\'m here if you need someone to talk to. You\'re not alone in this.',
          last_message_time: new Date(Date.now() - 172800000).toISOString(),
          unread_count: 0,
          is_online: false,
          last_seen: new Date(Date.now() - 259200000).toISOString(),
        },
      ];
      setConversations(mockConversations);
    } catch (error) {
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchConversations();
    setIsRefreshing(false);
  };

  const handleConversationPress = (conversation: Conversation) => {
    navigation.navigate('ChatConversation', {
      conversationId: conversation.id,
      userId: conversation.user_id,
      userName: conversation.user_display_name,
    });
  };

  const handleNewMessage = () => {
    // TODO: Implement new message flow
    Alert.alert('Coming Soon', 'New message feature will be available soon');
  };

  const renderConversationItem = (conversation: Conversation) => (
    <TouchableOpacity
      key={conversation.id}
      style={styles.conversationItem}
      onPress={() => handleConversationPress(conversation)}
      activeOpacity={0.7}
    >
      <View style={styles.conversationContent}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: conversation.user_avatar_url || 'https://via.placeholder.com/40' }}
            style={styles.avatar}
          />
          {conversation.is_online && (
            <View style={styles.onlineIndicator} />
          )}
        </View>
        
        <View style={styles.conversationText}>
          <View style={styles.conversationHeader}>
            <Text style={styles.userName}>{conversation.user_display_name}</Text>
            <Text style={styles.messageTime}>
              {formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: true })}
            </Text>
          </View>
          
          <Text style={[
            styles.lastMessage,
            conversation.unread_count > 0 && styles.unreadMessage
          ]} numberOfLines={2}>
            {conversation.last_message}
          </Text>
          
          {!conversation.is_online && conversation.last_seen && (
            <Text style={styles.lastSeen}>
              Last seen {formatDistanceToNow(new Date(conversation.last_seen), { addSuffix: true })}
            </Text>
          )}
        </View>
        
        {conversation.unread_count > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>
              {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>No Messages Yet</Text>
      <Text style={styles.emptyStateText}>
        Start a conversation with other users to share prayers and encouragement.
      </Text>
      <TouchableOpacity style={styles.emptyStateButton} onPress={handleNewMessage}>
        <Text style={styles.emptyStateButtonText}>Start a Conversation</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Messages</Text>
      <TouchableOpacity onPress={handleNewMessage} style={styles.newMessageButton}>
        <Ionicons name="create-outline" size={24} color="#5B21B6" />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#5B21B6']}
            tintColor="#5B21B6"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {conversations.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.conversationsList}>
            {conversations.map(renderConversationItem)}
          </View>
        )}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  newMessageButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  conversationsList: {
    paddingTop: 8,
  },
  conversationItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  conversationText: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  messageTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  unreadMessage: {
    fontWeight: '500',
    color: '#111827',
  },
  lastSeen: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  unreadBadge: {
    backgroundColor: '#5B21B6',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingHorizontal: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#5B21B6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default DirectMessagesScreen;
