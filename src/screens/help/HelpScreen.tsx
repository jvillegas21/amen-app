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
} from 'react-native';
import { RootStackScreenProps } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import { Ionicons } from '@expo/vector-icons';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful_count: number;
  is_helpful?: boolean;
}

interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  article_count: number;
}

const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: 'getting_started',
    title: 'Getting Started',
    description: 'Learn the basics of using Amenity',
    icon: 'rocket-outline',
    article_count: 8,
  },
  {
    id: 'prayers',
    title: 'Prayers & Requests',
    description: 'How to create and manage prayers',
    icon: 'heart-outline',
    article_count: 12,
  },
  {
    id: 'groups',
    title: 'Prayer Groups',
    description: 'Creating and managing groups',
    icon: 'people-outline',
    article_count: 6,
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Managing your notification preferences',
    icon: 'notifications-outline',
    article_count: 4,
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    description: 'Protecting your information',
    icon: 'shield-outline',
    article_count: 5,
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    description: 'Common issues and solutions',
    icon: 'construct-outline',
    article_count: 10,
  },
];

/**
 * Help & FAQ Screen - Comprehensive help center with search and categories
 * Based on help_&_faq mockups
 */
const HelpScreen: React.FC<RootStackScreenProps<'Help'>> = ({ navigation }) => {
  const { profile } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [filteredFaqItems, setFilteredFaqItems] = useState<FAQItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFAQItems();
  }, []);

  useEffect(() => {
    filterFAQItems();
  }, [searchQuery, faqItems]);

  const fetchFAQItems = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement FAQ items fetch from API
      // For now, using mock data
      const mockFAQItems: FAQItem[] = [
        {
          id: '1',
          question: 'How do I create my first prayer request?',
          answer: 'To create a prayer request, tap the "+" button on the home screen or go to the Create tab. Write your prayer request, add any relevant details, and choose your privacy settings. You can also add location tags and images to provide more context.',
          category: 'getting_started',
          helpful_count: 45,
        },
        {
          id: '2',
          question: 'Can I make my prayers private?',
          answer: 'Yes! When creating a prayer request, you can choose from three privacy levels: Public (visible to everyone), Friends Only (visible to your followers), or Private (only visible to you). You can also post anonymously if you prefer not to share your identity.',
          category: 'privacy',
          helpful_count: 32,
        },
        {
          id: '3',
          question: 'How do I join a prayer group?',
          answer: 'You can discover prayer groups by going to the Groups tab and browsing available groups. Tap on a group to view its details, then tap "Join Group" if you\'d like to become a member. Some groups may require approval from the group admin.',
          category: 'groups',
          helpful_count: 28,
        },
        {
          id: '4',
          question: 'Why am I not receiving notifications?',
          answer: 'Check your notification settings in the app by going to Settings > Notifications. Make sure push notifications are enabled and that you\'ve granted permission for the app to send notifications. Also check your device\'s notification settings for the Amenity app.',
          category: 'notifications',
          helpful_count: 41,
        },
        {
          id: '5',
          question: 'How do I change my profile picture?',
          answer: 'Go to your profile by tapping the Profile tab, then tap "Edit Profile". Tap on your current profile picture and select a new image from your photo library. Make sure the image is under 5MB for best results.',
          category: 'getting_started',
          helpful_count: 23,
        },
        {
          id: '6',
          question: 'What should I do if the app keeps crashing?',
          answer: 'Try these troubleshooting steps: 1) Close and restart the app, 2) Restart your device, 3) Check for app updates in your app store, 4) Clear the app cache in your device settings, 5) Reinstall the app if the problem persists.',
          category: 'troubleshooting',
          helpful_count: 19,
        },
        {
          id: '7',
          question: 'How do I follow other users?',
          answer: 'You can follow other users by visiting their profile and tapping the "Follow" button. You can discover new users through prayer requests, groups, or by using the search feature. Following someone allows you to see their public prayers in your feed.',
          category: 'getting_started',
          helpful_count: 36,
        },
        {
          id: '8',
          question: 'Can I delete a prayer request I posted?',
          answer: 'Yes, you can delete your own prayer requests. Go to the prayer request, tap the three dots menu, and select "Delete". Note that this action cannot be undone, and any comments or interactions on that prayer will also be removed.',
          category: 'prayers',
          helpful_count: 15,
        },
      ];
      setFaqItems(mockFAQItems);
    } catch (error) {
      Alert.alert('Error', 'Failed to load help content');
    } finally {
      setIsLoading(false);
    }
  };

  const filterFAQItems = () => {
    if (!searchQuery.trim()) {
      setFilteredFaqItems(faqItems);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = faqItems.filter(item =>
      item.question.toLowerCase().includes(query) ||
      item.answer.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
    setFilteredFaqItems(filtered);
  };

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleHelpfulVote = async (itemId: string) => {
    try {
      // TODO: Implement helpful vote API call
      setFaqItems(prev => prev.map(item =>
        item.id === itemId
          ? {
              ...item,
              helpful_count: item.helpful_count + (item.is_helpful ? -1 : 1),
              is_helpful: !item.is_helpful,
            }
          : item
      ));
    } catch (error) {
      Alert.alert('Error', 'Failed to record your feedback');
    }
  };

  const handleCategoryPress = (categoryId: string) => {
    const category = HELP_CATEGORIES.find(cat => cat.id === categoryId);
    if (category) {
      Alert.alert(
        'Coming Soon',
        `Detailed articles for "${category.title}" will be available soon.`
      );
    }
  };

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search help articles..."
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderCategories = () => (
    <View style={styles.categoriesSection}>
      <Text style={styles.sectionTitle}>Browse by Category</Text>
      <View style={styles.categoriesGrid}>
        {HELP_CATEGORIES.map(category => (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryCard}
            onPress={() => handleCategoryPress(category.id)}
            activeOpacity={0.7}
          >
            <View style={styles.categoryIcon}>
              <Ionicons name={category.icon as any} size={24} color="#5B21B6" />
            </View>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            <Text style={styles.categoryDescription}>{category.description}</Text>
            <Text style={styles.categoryCount}>{category.article_count} articles</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderFAQItem = (item: FAQItem) => {
    const isExpanded = expandedItems.has(item.id);

    return (
      <View key={item.id} style={styles.faqItem}>
        <TouchableOpacity
          style={styles.faqQuestion}
          onPress={() => toggleExpanded(item.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.faqQuestionText}>{item.question}</Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#6B7280"
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.faqAnswer}>
            <Text style={styles.faqAnswerText}>{item.answer}</Text>
            <View style={styles.faqActions}>
              <TouchableOpacity
                style={styles.helpfulButton}
                onPress={() => handleHelpfulVote(item.id)}
              >
                <Ionicons
                  name={item.is_helpful ? 'thumbs-up' : 'thumbs-up-outline'}
                  size={16}
                  color={item.is_helpful ? '#10B981' : '#6B7280'}
                />
                <Text style={[
                  styles.helpfulText,
                  item.is_helpful && styles.helpfulTextActive
                ]}>
                  {item.helpful_count} found this helpful
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderFAQSection = () => (
    <View style={styles.faqSection}>
      <Text style={styles.sectionTitle}>
        {searchQuery ? `Search Results (${filteredFaqItems.length})` : 'Frequently Asked Questions'}
      </Text>
      
      {filteredFaqItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>No Results Found</Text>
          <Text style={styles.emptyStateText}>
            Try searching with different keywords or browse our categories above.
          </Text>
        </View>
      ) : (
        <View style={styles.faqList}>
          {filteredFaqItems.map(renderFAQItem)}
        </View>
      )}
    </View>
  );

  const renderContactSupport = () => (
    <View style={styles.contactSection}>
      <View style={styles.contactCard}>
        <View style={styles.contactHeader}>
          <Ionicons name="headset" size={24} color="#5B21B6" />
          <Text style={styles.contactTitle}>Still Need Help?</Text>
        </View>
        <Text style={styles.contactDescription}>
          Can't find what you're looking for? Our support team is here to help you.
        </Text>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => navigation.navigate('Support')}
        >
          <Text style={styles.contactButtonText}>Contact Support</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Loading help content...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderSearchBar()}
        {renderCategories()}
        {renderFAQSection()}
        {renderContactSupport()}
        
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
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  categoriesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 16,
    gap: 12,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  categoryCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  faqSection: {
    marginBottom: 24,
  },
  faqList: {
    marginHorizontal: 16,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  faqAnswerText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  faqActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  helpfulText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  helpfulTextActive: {
    color: '#10B981',
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
  },
  contactSection: {
    marginBottom: 24,
  },
  contactCard: {
    backgroundColor: '#F0F9FF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0369A1',
    marginLeft: 8,
  },
  contactDescription: {
    fontSize: 14,
    color: '#0369A1',
    lineHeight: 20,
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5B21B6',
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default HelpScreen;
