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

interface TrendingTopic {
  id: string;
  title: string;
  prayerCount: number;
  category: string;
}

interface FeaturedPrayer {
  id: string;
  text: string;
  user: {
    id: string;
    displayName: string;
    avatarUrl?: string;
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
 * Discover Screen - Content discovery with trending topics and featured prayers
 */
const DiscoverScreen: React.FC<MainTabScreenProps<'Discover'>> = ({ navigation }) => {
  const { profile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'trending' | 'featured' | 'categories'>('trending');
  
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [featuredPrayers, setFeaturedPrayers] = useState<FeaturedPrayer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchDiscoverData();
  }, []);

  const fetchDiscoverData = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement real API calls
      const mockTrendingTopics: TrendingTopic[] = [
        { id: '1', title: 'Healing', prayerCount: 1247, category: 'Health' },
        { id: '2', title: 'Family', prayerCount: 892, category: 'Relationships' },
        { id: '3', title: 'Peace', prayerCount: 756, category: 'Spiritual' },
        { id: '4', title: 'Guidance', prayerCount: 634, category: 'Spiritual' },
        { id: '5', title: 'Strength', prayerCount: 521, category: 'Spiritual' },
      ];

      const mockFeaturedPrayers: FeaturedPrayer[] = [
        {
          id: '1',
          text: 'Please pray for my grandmother who is recovering from surgery. She needs strength and healing.',
          user: {
            id: 'user1',
            displayName: 'Sarah Johnson',
            avatarUrl: 'https://via.placeholder.com/40',
          },
          location: 'Chicago, IL',
          prayerCount: 45,
          commentCount: 12,
          createdAt: '2 hours ago',
        },
        {
          id: '2',
          text: 'Praying for peace in our community and for those who are struggling with difficult circumstances.',
          user: {
            id: 'user2',
            displayName: 'Michael Chen',
            avatarUrl: 'https://via.placeholder.com/40',
          },
          location: 'Austin, TX',
          prayerCount: 32,
          commentCount: 8,
          createdAt: '4 hours ago',
        },
      ];

      const mockCategories: Category[] = [
        { id: '1', name: 'Health & Healing', icon: 'medical', color: '#EF4444', prayerCount: 2341 },
        { id: '2', name: 'Family & Relationships', icon: 'people', color: '#10B981', prayerCount: 1892 },
        { id: '3', name: 'Spiritual Growth', icon: 'book', color: '#5B21B6', prayerCount: 1654 },
        { id: '4', name: 'Work & Career', icon: 'briefcase', color: '#F59E0B', prayerCount: 1234 },
        { id: '5', name: 'Peace & Comfort', icon: 'heart', color: '#06B6D4', prayerCount: 987 },
        { id: '6', name: 'Community', icon: 'globe', color: '#8B5CF6', prayerCount: 756 },
      ];

      setTrendingTopics(mockTrendingTopics);
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
      // TODO: Navigate to search with query
      console.log('Search for:', searchQuery);
    }
  };

  const handleTrendingTopicPress = (topic: TrendingTopic) => {
    // TODO: Navigate to search with topic
    console.log('Search topic:', topic.title);
  };

  const handleFeaturedPrayerPress = (prayer: FeaturedPrayer) => {
    navigation.navigate('PrayerDetails', { prayerId: prayer.id });
  };

  const handleCategoryPress = (category: Category) => {
    // TODO: Navigate to search with category
    console.log('Search category:', category.name);
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
        style={[styles.tab, activeTab === 'trending' && styles.activeTab]}
        onPress={() => setActiveTab('trending')}
      >
        <Text style={[styles.tabText, activeTab === 'trending' && styles.activeTabText]}>
          Trending
        </Text>
      </TouchableOpacity>
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
    </View>
  );

  const renderTrendingTopic = ({ item }: { item: TrendingTopic }) => (
    <TouchableOpacity
      style={styles.trendingItem}
      onPress={() => handleTrendingTopicPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.trendingContent}>
        <Text style={styles.trendingTitle}>{item.title}</Text>
        <Text style={styles.trendingCategory}>{item.category}</Text>
      </View>
      <View style={styles.trendingStats}>
        <Ionicons name="heart" size={16} color="#EF4444" />
        <Text style={styles.trendingCount}>{item.prayerCount}</Text>
      </View>
    </TouchableOpacity>
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
            <Text style={styles.userName}>{item.user.displayName}</Text>
            {item.location && (
              <Text style={styles.location}>{item.location}</Text>
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
          <Ionicons name="heart" size={16} color="#EF4444" />
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
      case 'trending':
        return (
          <FlatList
            data={trendingTopics}
            renderItem={renderTrendingTopic}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        );
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
        return (
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
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
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  trendingContent: {
    flex: 1,
  },
  trendingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  trendingCategory: {
    fontSize: 14,
    color: '#6B7280',
  },
  trendingStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendingCount: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
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
});

export default DiscoverScreen;
