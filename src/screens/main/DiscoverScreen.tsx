import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { MainTabScreenProps } from '@/types/navigation.types';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth/authStore';


interface FeaturedPrayer {
  id: string;
  text: string;
  user: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  location?: string;
  prayerCount: number;
  commentCount: number;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  prayerCount: number;
}

/**
 * Discover Screen - Content discovery with featured prayers and categories
 */
const DiscoverScreen: React.FC<MainTabScreenProps<'Discover'>> = ({ navigation }) => {
  const { profile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'featured' | 'categories' | 'bible_studies'>('featured');
  
  const [featuredPrayers, setFeaturedPrayers] = useState<FeaturedPrayer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryPrayers, setCategoryPrayers] = useState<FeaturedPrayer[]>([]);

  useEffect(() => {
    fetchDiscoverData();
  }, []);

  const fetchDiscoverData = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement real API calls

      const mockFeaturedPrayers: FeaturedPrayer[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          text: 'Please pray for my grandmother who is recovering from surgery. She needs strength and healing.',
          user: {
            id: '550e8400-e29b-41d4-a716-446655440011',
            display_name: 'Sarah Johnson',
            avatar_url: 'https://via.placeholder.com/40',
          },
          location: 'Chicago, IL',
          prayerCount: 45,
          commentCount: 12,
          createdAt: '2 hours ago',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          text: 'Praying for peace in our community and for those who are struggling with difficult circumstances.',
          user: {
            id: '550e8400-e29b-41d4-a716-446655440012',
            display_name: 'Michael Chen',
            avatar_url: 'https://via.placeholder.com/40',
          },
          location: 'Austin, TX',
          prayerCount: 32,
          commentCount: 8,
          createdAt: '4 hours ago',
        },
      ];

      const mockCategories: Category[] = [
        { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Health & Healing', icon: 'medical', color: 'theme.colors.error[700]', prayerCount: 2341 },
        { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Family & Relationships', icon: 'people', color: 'theme.colors.success[700]', prayerCount: 1892 },
        { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Spiritual Growth', icon: 'book', color: '#5B21B6', prayerCount: 1654 },
        { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Work & Career', icon: 'briefcase', color: 'theme.colors.warning[700]', prayerCount: 1234 },
        { id: '550e8400-e29b-41d4-a716-446655440005', name: 'Peace & Comfort', icon: 'heart', color: '#06B6D4', prayerCount: 987 },
        { id: '550e8400-e29b-41d4-a716-446655440006', name: 'Community', icon: 'globe', color: '#8B5CF6', prayerCount: 756 },
        { id: '550e8400-e29b-41d4-a716-446655440007', name: 'AI Bible Studies', icon: 'library', color: '#7C3AED', prayerCount: 0 },
      ];

      setFeaturedPrayers(mockFeaturedPrayers);
      setCategories(mockCategories);
    } catch (error) {
      console.error('Failed to fetch discover data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Navigate to search screen with query
      navigation.navigate('Search', { query: searchQuery });
    }
  };


  const handleFeaturedPrayerPress = (prayer: FeaturedPrayer) => {
    navigation.navigate('PrayerDetails', { prayerId: prayer.id });
  };

  const handleCategoryPress = (category: Category) => {
    if (category.id === '550e8400-e29b-41d4-a716-446655440007') { // AI Bible Studies
      navigation.navigate('BibleStudyList', {});
    } else {
      // Show prayers from this category
      setSelectedCategory(category);
      fetchCategoryPrayers(category);
    }
  };

  const fetchCategoryPrayers = async (category: Category) => {
    try {
      // TODO: Implement real API call to get prayers by category
      // For now, we'll show mock data
      const mockCategoryPrayers: FeaturedPrayer[] = [
        {
          id: `cat-${category.id}-1`,
          text: `Sample prayer for ${category.name.toLowerCase()}. This is a mock prayer request.`,
          user: {
            id: '550e8400-e29b-41d4-a716-446655440011',
            display_name: 'Community Member',
            avatar_url: 'https://via.placeholder.com/40',
          },
          location: 'Various',
          prayerCount: Math.floor(Math.random() * 50) + 10,
          commentCount: Math.floor(Math.random() * 20) + 5,
          createdAt: '2 hours ago',
        },
        {
          id: `cat-${category.id}-2`,
          text: `Another prayer request related to ${category.name.toLowerCase()}.`,
          user: {
            id: '550e8400-e29b-41d4-a716-446655440012',
            display_name: 'Prayer Warrior',
            avatar_url: 'https://via.placeholder.com/40',
          },
          location: 'Various',
          prayerCount: Math.floor(Math.random() * 50) + 10,
          commentCount: Math.floor(Math.random() * 20) + 5,
          createdAt: '4 hours ago',
        },
      ];
      setCategoryPrayers(mockCategoryPrayers);
    } catch (error) {
      console.error('Failed to fetch category prayers:', error);
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
          placeholder="Search prayers, topics, or users..."
          placeholderTextColor="#9CA3AF"
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'featured' && styles.activeTab]}
        onPress={() => setActiveTab('featured')}
      >
        <Text style={[styles.tabText, activeTab === 'featured' && styles.activeTabText]}>
          Featured
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'categories' && styles.activeTab]}
        onPress={() => setActiveTab('categories')}
      >
        <Text style={[styles.tabText, activeTab === 'categories' && styles.activeTabText]}>
          Categories
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'bible_studies' && styles.activeTab]}
        onPress={() => setActiveTab('bible_studies')}
      >
        <Text style={[styles.tabText, activeTab === 'bible_studies' && styles.activeTabText]}>
          Bible Studies
        </Text>
      </TouchableOpacity>
    </View>
  );


  const renderFeaturedPrayer = ({ item }: { item: FeaturedPrayer }) => (
    <TouchableOpacity
      style={styles.featuredItem}
      onPress={() => handleFeaturedPrayerPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.featuredHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color="#6B7280" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.user.display_name}</Text>
            {item.location && (
              <Text style={styles.location} numberOfLines={1} ellipsizeMode="tail">
                {item.location}
              </Text>
            )}
          </View>
        </View>
        <Text style={styles.timeAgo}>{item.createdAt}</Text>
      </View>
      
      <Text style={styles.prayerText} numberOfLines={3}>
        {item.text}
      </Text>
      
      <View style={styles.prayerStats}>
        <View style={styles.statItem}>
          <Ionicons name="heart" size={16} color="theme.colors.error[700]" />
          <Text style={styles.statText}>{item.prayerCount} praying</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble" size={16} color="#6B7280" />
          <Text style={styles.statText}>{item.commentCount} comments</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={24} color="#FFFFFF" />
      </View>
      <View style={styles.categoryContent}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.categoryCount}>{item.prayerCount} prayers</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Loading discover content...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'featured':
        return (
          <FlatList
            data={featuredPrayers}
            renderItem={renderFeaturedPrayer}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        );
      case 'categories':
        if (selectedCategory) {
          return (
            <View style={styles.categoryContent}>
              <View style={styles.categoryHeader}>
                <TouchableOpacity
                  style={styles.backToCategories}
                  onPress={() => setSelectedCategory(null)}
                >
                  <Ionicons name="arrow-back" size={20} color="#5B21B6" />
                  <Text style={styles.backToCategoriesText}>Back to Categories</Text>
                </TouchableOpacity>
                <Text style={styles.categoryTitle}>{selectedCategory.name}</Text>
                <Text style={styles.categorySubtitle}>
                  {selectedCategory.prayerCount} prayers in this category
                </Text>
              </View>
              <FlatList
                data={categoryPrayers}
                renderItem={renderFeaturedPrayer}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
              />
            </View>
          );
        } else {
          return (
            <FlatList
              data={categories}
              renderItem={renderCategory}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          );
        }
      case 'bible_studies':
        return (
          <View style={styles.bibleStudiesContainer}>
            <View style={styles.bibleStudiesHeader}>
              <Text style={styles.bibleStudiesTitle}>Explore Bible Studies</Text>
              <Text style={styles.bibleStudiesSubtitle}>
                Discover AI-powered Bible studies and spiritual insights
              </Text>
            </View>
            <TouchableOpacity
              style={styles.bibleStudiesButton}
              onPress={() => navigation.navigate('BibleStudyList', {})}
              activeOpacity={0.7}
            >
              <View style={styles.bibleStudiesButtonContent}>
                <View style={styles.bibleStudiesIcon}>
                  <Ionicons name="library" size={32} color="#FFFFFF" />
                </View>
                <View style={styles.bibleStudiesButtonText}>
                  <Text style={styles.bibleStudiesButtonTitle}>Browse All Studies</Text>
                  <Text style={styles.bibleStudiesButtonSubtitle}>
                    View featured, recent, and your studies
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bibleStudiesButton}
              onPress={() => navigation.navigate('CreateBibleStudy', {})}
              activeOpacity={0.7}
            >
              <View style={styles.bibleStudiesButtonContent}>
                <View style={[styles.bibleStudiesIcon, { backgroundColor: '#D97706' }]}>
                  <Ionicons name="add" size={32} color="#FFFFFF" />
                </View>
                <View style={styles.bibleStudiesButtonText}>
                  <Text style={styles.bibleStudiesButtonTitle}>Create New Study</Text>
                  <Text style={styles.bibleStudiesButtonSubtitle}>
                    Start a new Bible study with AI insights
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </View>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderSearchBar()}
      {renderTabBar()}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#5B21B6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#5B21B6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  listContainer: {
    padding: 16,
  },
  featuredItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    minWidth: 0,
  },
  timeAgo: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  prayerText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 12,
  },
  prayerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#6B7280',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  bibleStudiesContainer: {
    padding: 16,
  },
  bibleStudiesHeader: {
    marginBottom: 24,
  },
  bibleStudiesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  bibleStudiesSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  bibleStudiesButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bibleStudiesButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bibleStudiesIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#5B21B6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bibleStudiesButtonText: {
    flex: 1,
  },
  bibleStudiesButtonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  bibleStudiesButtonSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  categoryContent: {
    flex: 1,
  },
  categoryHeader: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backToCategories: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backToCategoriesText: {
    fontSize: 16,
    color: '#5B21B6',
    marginLeft: 8,
    fontWeight: '500',
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  categorySubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default DiscoverScreen;
