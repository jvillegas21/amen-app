import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supportService, SupportTicket, SupportMessage } from '@/services/api/supportService';
import { formatDistanceToNow } from 'date-fns';

export default function SupportTicketDetailsScreen() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const router = useRouter();
  
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingMessage, setSubmittingMessage] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (ticketId) {
      fetchTicketDetails();
      setupRealtimeSubscriptions();
    }

    return () => {
      // Cleanup subscriptions
      if (ticketId) {
        supportService.unsubscribe(ticketSubscription);
        supportService.unsubscribe(messageSubscription);
      }
    };
  }, [ticketId]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const [ticketData, messagesData] = await Promise.all([
        supportService.getTicket(ticketId!),
        supportService.getTicketMessages(ticketId!),
      ]);

      setTicket(ticketData);
      setMessages(messagesData);
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      Alert.alert('Error', 'Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to ticket updates
    supportService.subscribeToTicketUpdates(ticketId!, (updatedTicket) => {
      setTicket(updatedTicket);
    });

    // Subscribe to new messages
    supportService.subscribeToMessages(ticketId!, (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
      // Scroll to bottom to show new message
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTicketDetails();
    setRefreshing(false);
  };

  const handleSubmitMessage = async () => {
    if (!newMessage.trim() || submittingMessage) return;

    try {
      setSubmittingMessage(true);
      await supportService.addMessage(ticketId!, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error submitting message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSubmittingMessage(false);
    }
  };

  const handleCloseTicket = () => {
    Alert.alert(
      'Close Ticket',
      'Are you sure you want to close this ticket? You can reopen it later if needed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close',
          style: 'destructive',
          onPress: async () => {
            try {
              await supportService.closeTicket(ticketId!);
              Alert.alert('Success', 'Ticket has been closed');
            } catch (error) {
              console.error('Error closing ticket:', error);
              Alert.alert('Error', 'Failed to close ticket');
            }
          },
        },
      ]
    );
  };

  const handleReopenTicket = async () => {
    try {
      await supportService.reopenTicket(ticketId!);
      Alert.alert('Success', 'Ticket has been reopened');
    } catch (error) {
      console.error('Error reopening ticket:', error);
      Alert.alert('Error', 'Failed to reopen ticket');
    }
  };

  const getStatusColor = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open':
        return '#3B82F6';
      case 'in_progress':
        return '#F59E0B';
      case 'resolved':
        return '#10B981';
      case 'closed':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open':
        return 'mail-outline';
      case 'in_progress':
        return 'time-outline';
      case 'resolved':
        return 'checkmark-circle-outline';
      case 'closed':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const getPriorityColor = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'urgent':
        return '#EF4444';
      case 'high':
        return '#F59E0B';
      case 'medium':
        return '#3B82F6';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#5B21B6" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Support Ticket</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Loading ticket...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!ticket) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#5B21B6" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Support Ticket</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ticket not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#5B21B6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support Ticket</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={ticket.status === 'closed' ? handleReopenTicket : handleCloseTicket}
        >
          <Ionicons
            name={ticket.status === 'closed' ? 'refresh' : 'close'}
            size={20}
            color="#5B21B6"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Ticket Header */}
        <View style={styles.ticketHeader}>
          <Text style={styles.ticketSubject}>{ticket.subject}</Text>
          
          <View style={styles.ticketMeta}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
              <Ionicons 
                name={getStatusIcon(ticket.status) as any} 
                size={12} 
                color="#FFFFFF" 
              />
              <Text style={styles.statusText}>{ticket.status.replace('_', ' ')}</Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority) }]}>
              <Text style={styles.priorityText}>{ticket.priority}</Text>
            </View>
          </View>
          
          <Text style={styles.ticketCategory}>
            {ticket.category.replace('_', ' ')}
          </Text>
          <Text style={styles.ticketDate}>
            Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
          </Text>
        </View>

        {/* Ticket Description */}
        <View style={styles.ticketDescription}>
          <Text style={styles.descriptionText}>{ticket.description}</Text>
        </View>

        {/* Messages */}
        <View style={styles.messagesSection}>
          <Text style={styles.messagesTitle}>Conversation</Text>
          
          {messages.map((message) => (
            <View key={message.id} style={styles.messageItem}>
              <View style={styles.messageHeader}>
                <Text style={styles.messageAuthor}>
                  {message.is_admin ? 'Support Team' : 'You'}
                </Text>
                <Text style={styles.messageDate}>
                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                </Text>
              </View>
              <Text style={styles.messageText}>{message.message}</Text>
            </View>
          ))}

          {messages.length === 0 && (
            <Text style={styles.noMessagesText}>No messages yet. Start the conversation below.</Text>
          )}
        </View>
      </ScrollView>

      {/* Message Input */}
      {ticket.status !== 'closed' && (
        <View style={styles.messageInputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Type your message..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!newMessage.trim() || submittingMessage) && styles.sendButtonDisabled]}
            onPress={handleSubmitMessage}
            disabled={!newMessage.trim() || submittingMessage}
          >
            {submittingMessage ? (
              <ActivityIndicator size="small" color="#5B21B6" />
            ) : (
              <Ionicons name="send" size={20} color="#5B21B6" />
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  actionButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#5B21B6',
  },
  scrollView: {
    flex: 1,
  },
  ticketHeader: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  ticketSubject: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  ticketMeta: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  ticketCategory: {
    fontSize: 14,
    color: '#5B21B6',
    fontWeight: '500',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  ticketDate: {
    fontSize: 12,
    color: '#666',
  },
  ticketDescription: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  messagesSection: {
    padding: 16,
  },
  messagesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  messageItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B21B6',
  },
  messageDate: {
    fontSize: 12,
    color: '#666',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  noMessagesText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E5E7',
  },
});