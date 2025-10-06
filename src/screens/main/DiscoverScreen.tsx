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

  useEffect(() => {
    fetchDiscoverData();
  }, []);

  const fetchDiscoverData = async () => {
    try {
      setIsLoading(true);

      // Categories are hardcoded for now - they represent tags that can be used on prayers
      const predefinedCategories: Category[] = [
        { id: 'health_healing', name: 'Health & Healing', icon: 'medical', color: '#DC2626', prayerCount: 0 },
        { id: 'family_relationships', name: 'Family & Relationships', icon: 'people', color: '#059669', prayerCount: 0 },
        { id: 'spiritual_growth', name: 'Spiritual Growth', icon: 'book', color: '#5B21B6', prayerCount: 0 },
        { id: 'work_career', name: 'Work & Career', icon: 'briefcase', color: '#D97706', prayerCount: 0 },
        { id: 'peace_comfort', name: 'Peace & Comfort', icon: 'heart', color: '#06B6D4', prayerCount: 0 },
        { id: 'community_world', name: 'Community & World', icon: 'globe', color: '#8B5CF6', prayerCount: 0 },
        { id: 'financial_provision', name: 'Financial Provision', icon: 'cash', color: '#10B981', prayerCount: 0 },
        { id: 'guidance_decisions', name: 'Guidance & Decisions', icon: 'compass', color: '#F59E0B', prayerCount: 0 },
      ];

      // TODO: Fetch featured prayers from Supabase
      // For now, show empty state
      setFeaturedPrayers([]);
      setCategories(predefinedCategories);
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
    // Navigate to CategoryPrayers screen
    navigation.navigate('CategoryPrayers', {
      categoryId: category.id,
      categoryName: category.name,
      categoryIcon: category.icon,
      categoryColor: category.color,
    });
  };

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={theme.colors.text.tertiary} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search prayers, topics, or users..."
          placeholderTextColor={theme.colors.text.tertiary}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.colors.text.tertiary} />
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
          <Ionicons name="heart" size={16} color="#DC2626" />
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
        <Text style={styles.categoryCount}>
          {item.prayerCount > 0 ? `${item.prayerCount} prayers` : 'No prayers yet'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[600]} />
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
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Ionicons name="heart-outline" size={64} color={theme.colors.text.tertiary} />
                <Text style={styles.emptyStateTitle}>No featured prayers yet</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Check back soon for featured prayers from the community
                </Text>
              </View>
            )}
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
                  <Ionicons name="library" size={32} color={theme.colors.text.inverse} />
                </View>
                <View style={styles.bibleStudiesButtonText}>
                  <Text style={styles.bibleStudiesButtonTitle}>Browse All Studies</Text>
                  <Text style={styles.bibleStudiesButtonSubtitle}>
                    View featured, recent, and your studies
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bibleStudiesButton}
              onPress={() => navigation.navigate('CreateBibleStudy', {})}
              activeOpacity={0.7}
            >
              <View style={styles.bibleStudiesButtonContent}>
                <View style={[styles.bibleStudiesIcon, { backgroundColor: theme.colors.primary[600] }]}>
                  <Ionicons name="add" size={32} color={theme.colors.text.inverse} />
                </View>
                <View style={styles.bibleStudiesButtonText}>
                  <Text style={styles.bibleStudiesButtonTitle}>Create New Study</Text>
                  <Text style={styles.bibleStudiesButtonSubtitle}>
                    Start a new Bible study with AI insights
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
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
    backgroundColor: theme.colors.background.secondary,
  },
  searchContainer: {
    backgroundColor: theme.colors.surface.primary,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing[2],
    ...theme.typography.body.medium,
    color: theme.colors.text.primary,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing[4],
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.primary[600],
  },
  tabText: {
    ...theme.typography.label.medium,
    color: theme.colors.text.secondary,
  },
  activeTabText: {
    color: theme.colors.primary[600],
    ...theme.typography.label.semibold,
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
    marginTop: theme.spacing[3],
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
  },
  listContainer: {
    flexGrow: 1,
  },
  featuredItem: {
    backgroundColor: theme.colors.surface.primary,
    paddingVertical: theme.spacing[4],
    paddingHorizontal: theme.spacing[4],
    borderRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[3],
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: theme.spacing[10],
    height: theme.spacing[10],
    borderRadius: theme.spacing[5],
    backgroundColor: theme.colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing[3],
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...theme.typography.label.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[0.5],
  },
  location: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.secondary,
    flex: 1,
    minWidth: 0,
  },
  timeAgo: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.tertiary,
  },
  prayerText: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[3],
  },
  prayerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing[4],
  },
  statText: {
    marginLeft: theme.spacing[1],
    ...theme.typography.caption.medium,
    color: theme.colors.text.secondary,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.primary,
    padding: theme.spacing[4],
    borderRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  categoryIcon: {
    width: theme.spacing[12],
    height: theme.spacing[12],
    borderRadius: theme.spacing[6],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing[4],
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    ...theme.typography.label.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[0.5],
  },
  categoryCount: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.secondary,
  },
  bibleStudiesContainer: {
    padding: theme.spacing[4],
  },
  bibleStudiesHeader: {
    marginBottom: theme.spacing[6],
  },
  bibleStudiesTitle: {
    ...theme.typography.heading.h1,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  bibleStudiesSubtitle: {
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
  },
  bibleStudiesButton: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: 0,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  bibleStudiesButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bibleStudiesIcon: {
    width: theme.spacing[14],
    height: theme.spacing[14],
    borderRadius: theme.spacing[7],
    backgroundColor: theme.colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing[4],
  },
  bibleStudiesButtonText: {
    flex: 1,
  },
  bibleStudiesButtonTitle: {
    ...theme.typography.heading.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  bibleStudiesButtonSubtitle: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.secondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing[20],
    paddingHorizontal: theme.spacing[8],
  },
  emptyStateTitle: {
    ...theme.typography.heading.h2,
    color: theme.colors.text.primary,
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[2],
  },
  emptyStateSubtitle: {
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});

export default DiscoverScreen;
