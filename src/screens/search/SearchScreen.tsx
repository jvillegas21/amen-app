import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { MainTabScreenProps } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

interface SearchResult {
  id: string;
  type: 'user' | 'prayer' | 'group';
  title: string;
  subtitle: string;
  avatar_url?: string;
  user_display_name?: string;
  prayer_text?: string;
  group_description?: string;
  member_count?: number;
  interaction_count?: number;
  created_at: string;
  location?: string;
}

interface TrendingTopic {
  id: string;
  title: string;
  count: number;
  category: string;
}

/**
 * Search/Discover Screen - Search and discover content, users, and groups
 * Based on search_results mockups
 */
const SearchScreen: React.FC<MainTabScreenProps<'Discover'>> = ({ navigation }) => {
  const { profile } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'prayers' | 'groups'>('all');

  useEffect(() => {
    fetchTrendingTopics();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchTrendingTopics = async () => {
    try {
      // TODO: Implement trending topics fetch from API
      // For now, using mock data
      const mockTrending: TrendingTopic[] = [
        { id: '1', title: 'Health & Healing', count: 1247, category: 'prayers' },
        { id: '2', title: 'Job Opportunities', count: 892, category: 'prayers' },
        { id: '3', title: 'Family Unity', count: 654, category: 'prayers' },
        { id: '4', title: 'Spiritual Growth', count: 432, category: 'prayers' },
        { id: '5', title: 'Prayer Warriors', count: 321, category: 'groups' },
        { id: '6', title: 'Young Adults', count: 298, category: 'groups' },
      ];
      setTrendingTopics(mockTrending);
    } catch (error) {
      console.error('Failed to load trending topics:', error);
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // TODO: Implement search API call
      // For now, using mock data
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'user',
          title: 'Sarah Johnson',
          subtitle: 'Chicago, IL',
          avatar_url: 'https://via.placeholder.com/40',
          user_display_name: 'Sarah Johnson',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          location: 'Chicago, IL',
        },
        {
          id: '2',
          type: 'prayer',
          title: 'Prayer for healing',
          subtitle: 'Please pray for my grandmother who is in the hospital',
          user_display_name: 'Mike Wilson',
          prayer_text: 'Please pray for my grandmother who is in the hospital. She needs strength and healing.',
          interaction_count: 15,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          location: 'Dallas, TX',
        },
        {
          id: '3',
          type: 'group',
          title: 'Prayer Warriors',
          subtitle: 'A group dedicated to supporting each other through prayer',
          group_description: 'A group dedicated to supporting each other through prayer and encouragement.',
          member_count: 24,
          created_at: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          id: '4',
          type: 'user',
          title: 'Emily Chen',
          subtitle: 'San Francisco, CA',
          avatar_url: 'https://via.placeholder.com/40',
          user_display_name: 'Emily Chen',
          created_at: new Date(Date.now() - 259200000).toISOString(),
          location: 'San Francisco, CA',
        },
        {
          id: '5',
          type: 'prayer',
          title: 'Job interview prayer',
          subtitle: 'Please pray for my job interview tomorrow',
          user_display_name: 'David Rodriguez',
          prayer_text: 'Please pray for my job interview tomorrow. I really need this position to support my family.',
          interaction_count: 8,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          location: 'Miami, FL',
        },
      ];
      setSearchResults(mockResults);
    } catch (error) {
      Alert.alert('Error', 'Failed to perform search');
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultPress = (result: SearchResult) => {
    switch (result.type) {
      case 'user':
        navigation.navigate('UserProfile', { userId: result.id });
        break;
      case 'prayer':
        navigation.navigate('PrayerDetails', { prayerId: result.id });
        break;
      case 'group':
        navigation.navigate('GroupDetails', { groupId: result.id });
        break;
    }
  };

  const handleTrendingPress = (topic: TrendingTopic) => {
    setSearchQuery(topic.title);
  };

  const getFilteredResults = () => {
    if (activeTab === 'all') return searchResults;
    return searchResults.filter(result => result.type === activeTab.slice(0, -1) as any);
  };

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search prayers, users, groups..."
          placeholderTextColor="#9CA3AF"
          returnKeyType="search"
          onSubmitEditing={performSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderFilterTabs = () => {
    const tabs = [
      { key: 'all', label: 'All', count: searchResults.length },
      { key: 'users', label: 'Users', count: searchResults.filter(r => r.type === 'user').length },
      { key: 'prayers', label: 'Prayers', count: searchResults.filter(r => r.type === 'prayer').length },
      { key: 'groups', label: 'Groups', count: searchResults.filter(r => r.type === 'group').length },
    ];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterTabs}
        contentContainerStyle={styles.filterTabsContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.filterTab,
              activeTab === tab.key && styles.filterTabActive
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[
              styles.filterTabText,
              activeTab === tab.key && styles.filterTabTextActive
            ]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[
                styles.filterTabBadge,
                activeTab === tab.key && styles.filterTabBadgeActive
              ]}>
                <Text style={[
                  styles.filterTabBadgeText,
                  activeTab === tab.key && styles.filterTabBadgeTextActive
                ]}>
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderSearchResult = ({ item: result }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleResultPress(result)}
      activeOpacity={0.7}
    >
      <View style={styles.resultContent}>
        {result.avatar_url && (
          <Image
            source={{ uri: result.avatar_url }}
            style={styles.resultAvatar}
          />
        )}
        
        <View style={styles.resultText}>
          <Text style={styles.resultTitle}>{result.title}</Text>
          <Text style={styles.resultSubtitle}>{result.subtitle}</Text>
          
          {result.type === 'prayer' && result.prayer_text && (
            <Text style={styles.resultDescription} numberOfLines={2}>
              {result.prayer_text}
            </Text>
          )}
          
          {result.type === 'group' && result.group_description && (
            <Text style={styles.resultDescription} numberOfLines={2}>
              {result.group_description}
            </Text>
          )}
          
          <View style={styles.resultMeta}>
            {result.user_display_name && (
              <Text style={styles.resultMetaText}>
                by {result.user_display_name}
              </Text>
            )}
            {result.member_count && (
              <Text style={styles.resultMetaText}>
                {result.member_count} members
              </Text>
            )}
            {result.interaction_count && (
              <Text style={styles.resultMetaText}>
                {result.interaction_count} prayers
              </Text>
            )}
            <Text style={styles.resultMetaText}>
              {formatDistanceToNow(new Date(result.created_at), { addSuffix: true })}
            </Text>
          </View>
        </View>
        
        <View style={styles.resultIcon}>
          <Ionicons
            name={
              result.type === 'user' ? 'person' :
              result.type === 'prayer' ? 'heart' : 'people'
            }
            size={20}
            color="#6B7280"
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTrendingTopics = () => (
    <View style={styles.trendingSection}>
      <Text style={styles.sectionTitle}>Trending Topics</Text>
      <View style={styles.trendingGrid}>
        {trendingTopics.map((topic) => (
          <TouchableOpacity
            key={topic.id}
            style={styles.trendingItem}
            onPress={() => handleTrendingPress(topic)}
            activeOpacity={0.7}
          >
            <View style={styles.trendingContent}>
              <Text style={styles.trendingTitle}>{topic.title}</Text>
              <Text style={styles.trendingCount}>{topic.count} posts</Text>
            </View>
            <Ionicons
              name={topic.category === 'groups' ? 'people' : 'heart'}
              size={16}
              color="#5B21B6"
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>
        {searchQuery ? 'No results found' : 'Start searching'}
      </Text>
      <Text style={styles.emptyStateText}>
        {searchQuery
          ? 'Try searching with different keywords or browse trending topics below.'
          : 'Search for prayers, users, or groups to discover new content.'
        }
      </Text>
    </View>
  );

  const renderSearchResults = () => {
    const filteredResults = getFilteredResults();

    if (isSearching) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      );
    }

    if (filteredResults.length === 0) {
      return renderEmptyState();
    }

    return (
      <FlatList
        data={filteredResults}
        renderItem={renderSearchResult}
        keyExtractor={(item) => item.id}
        style={styles.resultsList}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderSearchBar()}
      
      {searchQuery ? (
        <>
          {renderFilterTabs()}
          {renderSearchResults()}
        </>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderTrendingTopics()}
          {renderEmptyState()}
        </ScrollView>
      )}
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
  filterTabs: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterTabActive: {
    backgroundColor: '#5B21B6',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  filterTabBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    minWidth: 20,
    alignItems: 'center',
  },
  filterTabBadgeActive: {
    backgroundColor: '#FFFFFF',
  },
  filterTabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTabBadgeTextActive: {
    color: '#5B21B6',
  },
  scrollView: {
    flex: 1,
  },
  trendingSection: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  trendingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: '45%',
  },
  trendingContent: {
    flex: 1,
  },
  trendingTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  trendingCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  resultsList: {
    flex: 1,
    paddingTop: 8,
  },
  resultItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  resultAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  resultText: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  resultDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  resultMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  resultMetaText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  resultIcon: {
    marginLeft: 8,
    marginTop: 4,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
    lineHeight: 24,
  },
});

export default SearchScreen;
