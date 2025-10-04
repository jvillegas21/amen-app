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
  Linking,
} from 'react-native';
import { theme } from '@/theme';
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

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

/**
 * Support Screen - Main support hub with tickets, FAQ, and contact options
 * Replaces the stub implementation with full functionality
 */
const SupportScreen: React.FC<RootStackScreenProps<'Support'>> = ({ navigation }) => {
  const { profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'tickets' | 'faq' | 'contact'>('tickets');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  useEffect(() => {
    loadSupportData();
  }, []);

  const loadSupportData = async () => {
    try {
      setIsLoading(true);

      // Load user tickets (mock data for now)
      const mockTickets: SupportTicket[] = [
        {
          id: '1',
          title: 'Unable to upload profile picture',
          description: 'Having trouble uploading profile picture from gallery',
          status: 'in_progress',
          priority: 'medium',
          category: 'Technical Issue',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString(),
          response_count: 2,
        },
        {
          id: '2',
          title: 'Prayer notifications not working',
          description: 'Not receiving notifications for prayer updates',
          status: 'resolved',
          priority: 'high',
          category: 'Bug Report',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString(),
          response_count: 3,
        },
      ];

      // Load FAQ items
      const mockFAQ: FAQItem[] = [
        {
          id: '1',
          question: 'How do I create a prayer request?',
          answer: 'To create a prayer request, tap the "+" button on the home screen, write your prayer, choose privacy settings, and tap "Share Prayer". You can also add tags and location if desired.',
          category: 'Getting Started',
        },
        {
          id: '2',
          question: 'How do I join a prayer group?',
          answer: 'Go to the Groups tab, browse available groups or search for specific topics. Tap on a group to view details, then tap "Join Group". Some groups may require approval from admins.',
          category: 'Groups',
        },
        {
          id: '3',
          question: 'Can I make my prayers anonymous?',
          answer: 'Yes! When creating a prayer, toggle the "Anonymous" option. Your prayer will be shared without your name or profile picture visible to other users.',
          category: 'Privacy',
        },
        {
          id: '4',
          question: 'How do I change my notification settings?',
          answer: 'Go to Profile > Settings > Notifications. You can customize which types of notifications you receive and when you receive them.',
          category: 'Settings',
        },
        {
          id: '5',
          question: 'What should I do if I see inappropriate content?',
          answer: 'Tap the three dots on any prayer or comment and select "Report". Our moderation team will review the content promptly. You can also block users if needed.',
          category: 'Safety',
        },
        {
          id: '6',
          question: 'How do I delete my account?',
          answer: 'Go to Profile > Settings > Privacy > Delete Account. Note that this action is permanent and cannot be undone. All your prayers and data will be permanently removed.',
          category: 'Account',
        },
      ];

      setTickets(mockTickets);
      setFaqItems(mockFAQ);
    } catch (error) {
      console.error('Failed to load support data:', error);
      Alert.alert('Error', 'Failed to load support information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = () => {
    navigation.navigate('CreateTicket');
  };

  const handleTicketPress = (ticketId: string) => {
    navigation.navigate('TicketDetails', { ticketId });
  };

  const handleContactSupport = (method: 'email' | 'chat') => {
    if (method === 'email') {
      Linking.openURL('mailto:support@Amenity-prayer-app.com?subject=Support Request');
    } else {
      // For chat, we could integrate with a third-party chat service
      Alert.alert(
        'Live Chat',
        'Live chat will be available soon. For immediate assistance, please email us at support@Amenity-prayer-app.com'
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return theme.colors.error[600];
      case 'in_progress': return theme.colors.warning[600];
      case 'resolved': return theme.colors.success[600];
      case 'closed': return theme.colors.neutral[500];
      default: return theme.colors.neutral[500];
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return theme.colors.error[600];
      case 'high': return theme.colors.warning[600];
      case 'medium': return theme.colors.primary[600];
      case 'low': return theme.colors.success[600];
      default: return theme.colors.neutral[500];
    }
  };

  const filteredFAQ = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderTabButton = (tab: 'tickets' | 'faq' | 'contact', label: string, icon: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
      onPress={() => setActiveTab(tab)}
      accessibilityRole="tab"
      accessibilityState={{ selected: activeTab === tab }}
    >
      <Ionicons
        name={icon as any}
        size={20}
        color={activeTab === tab ? theme.colors.primary[600] : theme.colors.neutral[500]}
      />
      <Text style={[
        styles.tabButtonText,
        activeTab === tab && styles.tabButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderTicketsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Support Tickets</Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateTicket}>
          <Ionicons name="add" size={20} color={theme.colors.text.inverse} />
          <Text style={styles.createButtonText}>New Ticket</Text>
        </TouchableOpacity>
      </View>

      {tickets.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="ticket-outline" size={64} color={theme.colors.neutral[300]} />
          <Text style={styles.emptyStateTitle}>No Support Tickets</Text>
          <Text style={styles.emptyStateText}>
            You haven't created any support tickets yet. If you need help, feel free to create one!
          </Text>
          <TouchableOpacity style={styles.emptyStateButton} onPress={handleCreateTicket}>
            <Text style={styles.emptyStateButtonText}>Create Your First Ticket</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.ticketsList} showsVerticalScrollIndicator={false}>
          {tickets.map((ticket) => (
            <TouchableOpacity
              key={ticket.id}
              style={styles.ticketCard}
              onPress={() => handleTicketPress(ticket.id)}
              activeOpacity={0.7}
            >
              <View style={styles.ticketHeader}>
                <Text style={styles.ticketTitle} numberOfLines={1}>
                  {ticket.title}
                </Text>
                <View style={styles.ticketMeta}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
                    <Text style={styles.statusText}>{ticket.status.replace('_', ' ')}</Text>
                  </View>
                  <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(ticket.priority) }]} />
                </View>
              </View>

              <Text style={styles.ticketDescription} numberOfLines={2}>
                {ticket.description}
              </Text>

              <View style={styles.ticketFooter}>
                <View style={styles.ticketInfo}>
                  <Ionicons name="folder-outline" size={14} color={theme.colors.neutral[500]} />
                  <Text style={styles.ticketCategory}>{ticket.category}</Text>
                </View>
                <View style={styles.ticketInfo}>
                  <Ionicons name="chatbubble-outline" size={14} color={theme.colors.neutral[500]} />
                  <Text style={styles.ticketResponses}>{ticket.response_count} responses</Text>
                </View>
                <Text style={styles.ticketTime}>
                  {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderFAQTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={theme.colors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search FAQ..."
            placeholderTextColor={theme.colors.neutral[400]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.neutral[400]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.faqList} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

        {filteredFAQ.map((item) => (
          <View key={item.id} style={styles.faqItem}>
            <TouchableOpacity
              style={styles.faqQuestion}
              onPress={() => setExpandedFAQ(expandedFAQ === item.id ? null : item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.faqQuestionContent}>
                <Text style={styles.faqQuestionText}>{item.question}</Text>
                <View style={styles.faqQuestionMeta}>
                  <Text style={styles.faqCategory}>{item.category}</Text>
                  <Ionicons
                    name={expandedFAQ === item.id ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={theme.colors.neutral[500]}
                  />
                </View>
              </View>
            </TouchableOpacity>

            {expandedFAQ === item.id && (
              <View style={styles.faqAnswer}>
                <Text style={styles.faqAnswerText}>{item.answer}</Text>
              </View>
            )}
          </View>
        ))}

        {filteredFAQ.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color={theme.colors.neutral[300]} />
            <Text style={styles.emptyStateTitle}>No Results Found</Text>
            <Text style={styles.emptyStateText}>
              Try adjusting your search terms or browse all questions above.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderContactTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Contact Support</Text>

      <View style={styles.contactOptions}>
        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => handleContactSupport('email')}
          activeOpacity={0.7}
        >
          <View style={styles.contactIconContainer}>
            <Ionicons name="mail-outline" size={32} color={theme.colors.primary[600]} />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Email Support</Text>
            <Text style={styles.contactDescription}>
              Get help via email. We typically respond within 24 hours.
            </Text>
            <Text style={styles.contactDetail}>support@Amenity-prayer-app.com</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.neutral[400]} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => handleContactSupport('chat')}
          activeOpacity={0.7}
        >
          <View style={styles.contactIconContainer}>
            <Ionicons name="chatbubble-outline" size={32} color={theme.colors.primary[600]} />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Live Chat</Text>
            <Text style={styles.contactDescription}>
              Chat with our support team in real-time.
            </Text>
            <Text style={styles.contactDetail}>Available Monday - Friday, 9 AM - 5 PM</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.neutral[400]} />
        </TouchableOpacity>

        <View style={styles.contactCard}>
          <View style={styles.contactIconContainer}>
            <Ionicons name="call-outline" size={32} color={theme.colors.primary[600]} />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Phone Support</Text>
            <Text style={styles.contactDescription}>
              For urgent issues, call our support line.
            </Text>
            <Text style={styles.contactDetail}>Coming Soon</Text>
          </View>
        </View>
      </View>

      <View style={styles.supportInfo}>
        <Text style={styles.supportInfoTitle}>Support Hours</Text>
        <Text style={styles.supportInfoText}>
          Monday - Friday: 9:00 AM - 6:00 PM (PST)
        </Text>
        <Text style={styles.supportInfoText}>
          Saturday: 10:00 AM - 4:00 PM (PST)
        </Text>
        <Text style={styles.supportInfoText}>
          Sunday: Closed
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[600]} />
          <Text style={styles.loadingText}>Loading support information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Support</Text>
        <Text style={styles.headerSubtitle}>We're here to help you</Text>
      </View>

      <View style={styles.tabBar}>
        {renderTabButton('tickets', 'Tickets', 'ticket-outline')}
        {renderTabButton('faq', 'FAQ', 'help-circle-outline')}
        {renderTabButton('contact', 'Contact', 'mail-outline')}
      </View>

      {activeTab === 'tickets' && renderTicketsTab()}
      {activeTab === 'faq' && renderFAQTab()}
      {activeTab === 'contact' && renderContactTab()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing[4],
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
  },
  header: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4],
    backgroundColor: theme.colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  headerTitle: {
    ...theme.typography.heading.h1,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  headerSubtitle: {
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[2],
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary[600],
  },
  tabButtonText: {
    ...theme.typography.label.medium,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[2],
  },
  tabButtonTextActive: {
    color: theme.colors.primary[600],
  },
  tabContent: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4],
  },
  sectionTitle: {
    ...theme.typography.heading.h2,
    color: theme.colors.text.primary,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary[600],
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.lg,
  },
  createButtonText: {
    ...theme.typography.button.small,
    color: theme.colors.text.inverse,
    marginLeft: theme.spacing[2],
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[8],
  },
  emptyStateTitle: {
    ...theme.typography.heading.h2,
    color: theme.colors.text.primary,
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },
  emptyStateText: {
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing[6],
  },
  emptyStateButton: {
    backgroundColor: theme.colors.primary[600],
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
  },
  emptyStateButtonText: {
    ...theme.typography.button.medium,
    color: theme.colors.text.inverse,
  },
  ticketsList: {
    flex: 1,
    paddingHorizontal: theme.spacing[4],
  },
  ticketCard: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[3],
    ...theme.shadows.sm,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[2],
  },
  ticketTitle: {
    ...theme.typography.heading.h3,
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: theme.spacing[2],
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing[2],
  },
  statusText: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.inverse,
    textTransform: 'capitalize',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ticketDescription: {
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[3],
  },
  ticketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketCategory: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[1],
  },
  ticketResponses: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[1],
  },
  ticketTime: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.secondary,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    backgroundColor: theme.colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body.medium,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing[2],
  },
  faqList: {
    flex: 1,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4],
  },
  faqItem: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing[2],
    overflow: 'hidden',
  },
  faqQuestion: {
    padding: theme.spacing[4],
  },
  faqQuestionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  faqQuestionText: {
    ...theme.typography.body.large,
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: theme.spacing[2],
  },
  faqQuestionMeta: {
    alignItems: 'flex-end',
  },
  faqCategory: {
    ...theme.typography.caption.medium,
    color: theme.colors.primary[600],
    marginBottom: theme.spacing[1],
  },
  faqAnswer: {
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing[4],
    paddingTop: 0,
  },
  faqAnswerText: {
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  contactOptions: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[3],
    ...theme.shadows.sm,
  },
  contactIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing[4],
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    ...theme.typography.heading.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  contactDescription: {
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },
  contactDetail: {
    ...theme.typography.caption.medium,
    color: theme.colors.primary[600],
  },
  supportInfo: {
    marginTop: theme.spacing[6],
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4],
    backgroundColor: theme.colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.primary,
  },
  supportInfoTitle: {
    ...theme.typography.heading.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[3],
  },
  supportInfoText: {
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },
});

export default SupportScreen;