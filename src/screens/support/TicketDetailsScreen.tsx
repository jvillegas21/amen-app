import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { RootStackScreenProps } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  user_display_name: string;
  user_avatar_url?: string;
  message: string;
  is_support: boolean;
  created_at: string;
}

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  created_at: string;
  updated_at: string;
  response_count: number;
  messages: TicketMessage[];
}

/**
 * Ticket Details Screen - View and manage support ticket
 * Based on ticket_details mockups
 */
const TicketDetailsScreen: React.FC<RootStackScreenProps<'TicketDetails'>> = ({ navigation, route }) => {
  const { ticketId } = route.params;
  const { profile } = useAuthStore();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchTicketDetails();
  }, [ticketId]);

  const fetchTicketDetails = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement ticket details fetch from API
      // For now, using mock data
      const mockTicket: SupportTicket = {
        id: ticketId,
        title: 'Unable to upload profile picture',
        description: 'I\'m having trouble uploading my profile picture. The app keeps showing an error message when I try to select an image from my gallery.',
        status: 'in_progress',
        priority: 'medium',
        category: 'Technical Issue',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
        response_count: 2,
        messages: [
          {
            id: '1',
            ticket_id: ticketId,
            user_id: 'support_agent',
            user_display_name: 'Sarah (Support)',
            user_avatar_url: 'https://via.placeholder.com/40',
            message: 'Thank you for contacting us! I understand you\'re having trouble uploading your profile picture. Let me help you resolve this issue.',
            is_support: true,
            created_at: new Date(Date.now() - 7200000).toISOString(),
          },
          {
            id: '2',
            ticket_id: ticketId,
            user_id: profile?.id || 'current_user',
            user_display_name: profile?.display_name || 'You',
            user_avatar_url: profile?.avatar_url,
            message: 'Thanks for the quick response! The error message says "Failed to upload image" and it happens every time I try to select a photo.',
            is_support: false,
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: '3',
            ticket_id: ticketId,
            user_id: 'support_agent',
            user_display_name: 'Sarah (Support)',
            user_avatar_url: 'https://via.placeholder.com/40',
            message: 'I see the issue. This is a known problem with certain Android devices. Please try the following steps:\n\n1. Clear the app cache\n2. Restart your device\n3. Try uploading a smaller image (under 2MB)\n\nLet me know if this resolves the issue!',
            is_support: true,
            created_at: new Date(Date.now() - 1800000).toISOString(),
          },
        ],
      };
      setTicket(mockTicket);
    } catch (error) {
      Alert.alert('Error', 'Failed to load ticket details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      // TODO: Implement send message API call
      const newMsg: TicketMessage = {
        id: Date.now().toString(),
        ticket_id: ticketId,
        user_id: profile?.id || 'current_user',
        user_display_name: profile?.display_name || 'You',
        user_avatar_url: profile?.avatar_url,
        message: messageText,
        is_support: false,
        created_at: new Date().toISOString(),
      };

      if (ticket) {
        setTicket(prev => prev ? {
          ...prev,
          messages: [...prev.messages, newMsg],
          response_count: prev.response_count + 1,
        } : null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
      setNewMessage(messageText); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'theme.colors.error[700]';
      case 'in_progress': return 'theme.colors.warning[700]';
      case 'resolved': return 'theme.colors.success[700]';
      case 'closed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'theme.colors.error[700]';
      case 'high': return 'theme.colors.warning[700]';
      case 'medium': return '#3B82F6';
      case 'low': return 'theme.colors.success[700]';
      default: return '#6B7280';
    }
  };

  const renderTicketHeader = () => {
    if (!ticket) return null;

    return (
      <View style={styles.ticketHeader}>
        <View style={styles.ticketTitleRow}>
          <Text style={styles.ticketTitle}>{ticket.title}</Text>
          <View style={styles.ticketStatus}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
              <Text style={styles.statusText}>{ticket.status.replace('_', ' ')}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.ticketMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="folder-outline" size={16} color="#6B7280" />
            <Text style={styles.metaText}>{ticket.category}</Text>
          </View>
          <View style={styles.metaItem}>
            <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(ticket.priority) }]} />
            <Text style={styles.metaText}>{ticket.priority}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={styles.metaText}>
              {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
            </Text>
          </View>
        </View>
        
        <Text style={styles.ticketDescription}>{ticket.description}</Text>
      </View>
    );
  };

  const renderMessage = (message: TicketMessage) => {
    const isCurrentUser = message.user_id === profile?.id;

    return (
      <View key={message.id} style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.supportMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.supportBubble
        ]}>
          {!isCurrentUser && (
            <View style={styles.messageHeader}>
              <Text style={styles.messageSender}>{message.user_display_name}</Text>
              <Text style={styles.messageTime}>
                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
              </Text>
            </View>
          )}
          <Text style={[
            styles.messageText,
            isCurrentUser ? styles.currentUserText : styles.supportText
          ]}>
            {message.message}
          </Text>
          {isCurrentUser && (
            <Text style={styles.currentUserTime}>
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderMessagesList = () => {
    if (!ticket) return null;

    return (
      <View style={styles.messagesSection}>
        <Text style={styles.sectionTitle}>Conversation</Text>
        <View style={styles.messagesList}>
          {ticket.messages.map(renderMessage)}
        </View>
      </View>
    );
  };

  const renderInputSection = () => (
    <View style={styles.inputSection}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type your message..."
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={500}
          editable={!isSending}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newMessage.trim() || isSending) && styles.sendButtonDisabled
          ]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="send" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTicketActions = () => {
    if (!ticket) return null;

    return (
      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            Alert.alert(
              'Close Ticket',
              'Are you sure you want to close this ticket? You won\'t be able to add more messages.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Close',
                  style: 'destructive',
                  onPress: () => {
                    // TODO: Implement close ticket
                    Alert.alert('Success', 'Ticket has been closed');
                  },
                },
              ]
            );
          }}
        >
          <Ionicons name="close-circle" size={20} color="theme.colors.error[700]" />
          <Text style={styles.actionButtonText}>Close Ticket</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Loading ticket details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!ticket) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="ticket-outline" size={64} color="#D1D5DB" />
          <Text style={styles.errorTitle}>Ticket Not Found</Text>
          <Text style={styles.errorText}>Unable to load ticket details</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchTicketDetails}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderTicketHeader()}
          {renderMessagesList()}
          {renderTicketActions()}
        </ScrollView>
        
        {renderInputSection()}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#5B21B6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  ticketHeader: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  ticketTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  ticketStatus: {
    flexShrink: 0,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ticketDescription: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  messagesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  messagesList: {
    marginHorizontal: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  currentUserMessage: {
    alignItems: 'flex-end',
  },
  supportMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  currentUserBubble: {
    backgroundColor: '#5B21B6',
    borderBottomRightRadius: 4,
  },
  supportBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  messageHeader: {
    marginBottom: 8,
  },
  messageSender: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B21B6',
  },
  messageTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  currentUserText: {
    color: '#FFFFFF',
  },
  supportText: {
    color: '#111827',
  },
  currentUserTime: {
    fontSize: 12,
    color: '#E0E7FF',
    marginTop: 8,
    textAlign: 'right',
  },
  inputSection: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#5B21B6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  actionsSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  actionButtonText: {
    color: 'theme.colors.error[700]',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default TicketDetailsScreen;
