import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth/authStore';
import { supportService, SupportTicket } from '@/services/api/supportService';
import { formatDistanceToNow } from 'date-fns';

export default function SupportTicketsScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchTickets();
    }
  }, [profile?.id]);

  const fetchTickets = async (pageNum = 1, isRefresh = false) => {
    if (!profile?.id) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
        setHasMore(true);
      } else {
        setLoading(true);
      }

      const data = await supportService.getUserTickets(profile.id, pageNum, 20);
      
      if (isRefresh || pageNum === 1) {
        setTickets(data);
      } else {
        setTickets(prev => [...prev, ...data]);
      }

      setHasMore(data.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      Alert.alert('Error', 'Failed to load support tickets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchTickets(1, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchTickets(page + 1);
    }
  };

  const handleTicketPress = (ticket: SupportTicket) => {
    router.push(`/support/ticket/${ticket.id}`);
  };

  const handleCreateTicket = () => {
    router.push('/support/create');
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

  const renderTicketItem = ({ item: ticket }: { item: SupportTicket }) => (
    <TouchableOpacity
      style={styles.ticketItem}
      onPress={() => handleTicketPress(ticket)}
    >
      <View style={styles.ticketHeader}>
        <View style={styles.ticketTitleContainer}>
          <Text style={styles.ticketTitle} numberOfLines={1}>
            {ticket.subject}
          </Text>
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
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
      
      <Text style={styles.ticketDescription} numberOfLines={2}>
        {ticket.description}
      </Text>
      
      <View style={styles.ticketFooter}>
        <Text style={styles.ticketCategory}>
          {ticket.category.replace('_', ' ')}
        </Text>
        <Text style={styles.ticketDate}>
          {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="help-circle-outline" size={64} color="#C7C7CC" />
      <Text style={styles.emptyStateTitle}>No Support Tickets</Text>
      <Text style={styles.emptyStateText}>
        Need help? Create a support ticket and we'll get back to you as soon as possible.
      </Text>
      <TouchableOpacity style={styles.createButton} onPress={handleCreateTicket}>
        <Text style={styles.createButtonText}>Create Ticket</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!loading || page === 1) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#5B21B6" />
      </View>
    );
  };

  if (loading && page === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#5B21B6" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Support Tickets</Text>
          <TouchableOpacity onPress={handleCreateTicket} style={styles.createHeaderButton}>
            <Ionicons name="add" size={24} color="#5B21B6" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Loading support tickets...</Text>
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
        <Text style={styles.headerTitle}>Support Tickets</Text>
        <TouchableOpacity onPress={handleCreateTicket} style={styles.createHeaderButton}>
          <Ionicons name="add" size={24} color="#5B21B6" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={tickets}
        renderItem={renderTicketItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          tickets.length === 0 && styles.emptyListContainer,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />
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
  createHeaderButton: {
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
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
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
  ticketTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  ticketMeta: {
    flexDirection: 'row',
    gap: 8,
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
  ticketDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketCategory: {
    fontSize: 12,
    color: '#5B21B6',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  ticketDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#5B21B6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});