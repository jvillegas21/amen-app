import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MainStackScreenProps } from '@/types/navigation.types';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth/authStore';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  isOwn: boolean;
}

/**
 * Group Chat Screen - Group messaging functionality
 */
const GroupChatScreen: React.FC<MainStackScreenProps<'GroupChat'>> = ({ route, navigation }) => {
  const { prayerId, groupId } = route.params;
  const { profile } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Group Chat',
      headerBackTitle: 'Back',
      headerTitleAlign: 'center',
      headerStyle: {
        backgroundColor: '#5B21B6',
      },
      headerTintColor: '#FFFFFF',
    });
  }, [navigation]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement real-time messaging with Supabase
      // For now, show empty state - messages will be implemented with real-time subscriptions
      setMessages([]);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      // TODO: Implement real API call
      const message: Message = {
        id: Date.now().toString(),
        text: newMessage.trim(),
        senderId: profile?.id || 'current',
        senderName: profile?.display_name || 'You',
        timestamp: 'Just now',
        isOwn: true,
      };

      setMessages(prev => [...prev, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.isOwn ? styles.ownMessage : styles.otherMessage
    ]}>
      {!item.isOwn && (
        <Text style={styles.senderName}>{item.senderName}</Text>
      )}
      <View style={[
        styles.messageBubble,
        item.isOwn ? styles.ownBubble : styles.otherBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.isOwn ? styles.ownMessageText : styles.otherMessageText
        ]}>
          {item.text}
        </Text>
      </View>
      <Text style={[
        styles.timestamp,
        item.isOwn ? styles.ownTimestamp : styles.otherTimestamp
      ]}>
        {item.timestamp}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>No Messages Yet</Text>
      <Text style={styles.emptyStateText}>
        Start the conversation by sending a message
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >

        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !newMessage.trim() && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={newMessage.trim() ? "#FFFFFF" : "#9CA3AF"}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 16,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  ownBubble: {
    backgroundColor: '#5B21B6',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#111827',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  ownTimestamp: {
    color: '#9CA3AF',
    textAlign: 'right',
  },
  otherTimestamp: {
    color: '#9CA3AF',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5B21B6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
});

export default GroupChatScreen;