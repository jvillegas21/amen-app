import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { RootStackScreenProps } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

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
}

/**
 * Support Screen - Main support hub with ticket management
 * Based on support ticket mockups
 */
const SupportScreen: React.FC<RootStackScreenProps<'Support'>> = ({ navigation }) => {
  const { profile } = useAuthStore();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSupportTickets();
  }, []);

  const fetchSupportTickets = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement support tickets fetch from API
      // For now, using mock data
      const mockTickets: SupportTicket[] = [
        {
          id: '1',
          title: 'Unable to upload profile picture',
          description: 'I\'m having trouble uploading my profile picture. The app keeps showing an error.',
          status: 'open',
          priority: 'medium',
          category: 'Technical Issue',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString(),
          response_count: 0,
        },
        {
          id: '2',
          title: 'Prayer notifications not working',
          description: 'I\'m not receiving notifications when someone prays for my requests.',
          status: 'in_progress',
          priority: 'high',
          category: 'Notifications',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString(),
          response_count: 2,
        },
        {
          id: '3',
          title: 'Account security question',
          description: 'I want to change my password and enable two-factor authentication.',
          status: 'resolved',
          priority: 'low',
          category: 'Account',
          created_at: new Date(Date.now() - 259200000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString(),
          response_count: 1,
        },
      ];
      setTickets(mockTickets);
    } catch (error) {
      Alert.alert('Error', 'Failed to load support tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = () => {
    navigation.navigate('CreateTicket');
  };

  const handleViewTicket = (ticketId: string) => {
    navigation.navigate('TicketDetails', { ticketId });
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

  const renderTicketItem = (ticket: SupportTicket) => (
    <TouchableOpacity
      key={ticket.id}
      style={styles.ticketItem}
      onPress={() => handleViewTicket(ticket.id)}
      activeOpacity={0.7}
    >
      <View style={styles.ticketHeader}>
        <Text style={styles.ticketTitle} numberOfLines={1}>
          {ticket.title}
        </Text>
        <View style={styles.ticketStatus}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
            <Text style={styles.statusText}>{ticket.status.replace('_', ' ')}</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.ticketDescription} numberOfLines={2}>
        {ticket.description}
      </Text>
      
      <View style={styles.ticketMeta}>
        <View style={styles.ticketCategory}>
          <Ionicons name="folder-outline" size={16} color="#6B7280" />
          <Text style={styles.categoryText}>{ticket.category}</Text>
        </View>
        
        <View style={styles.ticketPriority}>
          <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(ticket.priority) }]} />
          <Text style={styles.priorityText}>{ticket.priority}</Text>
        </View>
        
        <Text style={styles.ticketTime}>
          {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
        </Text>
      </View>
      
      {ticket.response_count > 0 && (
        <View style={styles.responseIndicator}>
          <Ionicons name="chatbubble" size={16} color="#5B21B6" />
          <Text style={styles.responseText}>{ticket.response_count} response{ticket.response_count !== 1 ? 's' : ''}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionCard} onPress={handleCreateTicket}>
          <View style={styles.actionIcon}>
            <Ionicons name="add-circle" size={32} color="#5B21B6" />
          </View>
          <Text style={styles.actionTitle}>New Ticket</Text>
          <Text style={styles.actionSubtitle}>Submit a support request</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Help')}>
          <View style={styles.actionIcon}>
            <Ionicons name="help-circle" size={32} color="theme.colors.success[700]" />
          </View>
          <Text style={styles.actionTitle}>Help Center</Text>
          <Text style={styles.actionSubtitle}>Browse FAQs and guides</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionCard} onPress={() => {
          // TODO: Implement contact support
          Alert.alert('Coming Soon', 'Direct contact feature will be available soon');
        }}>
          <View style={styles.actionIcon}>
            <Ionicons name="mail" size={32} color="theme.colors.warning[700]" />
          </View>
          <Text style={styles.actionTitle}>Contact Us</Text>
          <Text style={styles.actionSubtitle}>Get in touch directly</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionCard} onPress={() => {
          // TODO: Implement feedback
          Alert.alert('Coming Soon', 'Feedback feature will be available soon');
        }}>
          <View style={styles.actionIcon}>
            <Ionicons name="thumbs-up" size={32} color="#3B82F6" />
          </View>
          <Text style={styles.actionTitle}>Feedback</Text>
          <Text style={styles.actionSubtitle}>Share your thoughts</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTicketsList = () => (
    <View style={styles.ticketsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Support Tickets</Text>
        <TouchableOpacity onPress={handleCreateTicket}>
          <Text style={styles.createButton}>Create New</Text>
        </TouchableOpacity>
      </View>
      
      {tickets.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="ticket-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>No Support Tickets</Text>
          <Text style={styles.emptyStateText}>
            You haven't submitted any support tickets yet. Need help? Create your first ticket.
          </Text>
          <TouchableOpacity style={styles.emptyStateButton} onPress={handleCreateTicket}>
            <Text style={styles.emptyStateButtonText}>Create Ticket</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.ticketsList}>
          {tickets.map(renderTicketItem)}
        </View>
      )}
    </View>
  );

  const renderSupportInfo = () => (
    <View style={styles.supportInfo}>
      <View style={styles.supportInfoContent}>
        <Ionicons name="headset" size={24} color="#5B21B6" />
        <Text style={styles.supportInfoTitle}>We're Here to Help</Text>
        <Text style={styles.supportInfoText}>
          Our support team is available to assist you with any questions or issues. 
          We typically respond within 24 hours.
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Loading support tickets...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderSupportInfo()}
        {renderQuickActions()}
        {renderTicketsList()}
        
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
  scrollView: {
    flex: 1,
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
  supportInfo: {
    backgroundColor: '#F0F9FF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  supportInfoContent: {
    alignItems: 'center',
  },
  supportInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369A1',
    marginTop: 8,
    marginBottom: 8,
  },
  supportInfoText: {
    fontSize: 14,
    color: '#0369A1',
    textAlign: 'center',
    lineHeight: 20,
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 16,
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  ticketsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  createButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5B21B6',
  },
  ticketsList: {
    marginHorizontal: 16,
  },
  ticketItem: {
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
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  ticketStatus: {
    flexShrink: 0,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  ticketDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ticketCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  ticketPriority: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  priorityText: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  ticketTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  responseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  responseText: {
    fontSize: 12,
    color: '#5B21B6',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
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

export default SupportScreen;
