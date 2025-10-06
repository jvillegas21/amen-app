/**
 * Search Screen - Advanced search and filtering for prayers, users, and groups
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MainStackScreenProps } from '@/types/navigation.types';
import { searchService, SearchSuggestion, SearchFilters } from '@/services/search/searchService';
import { Prayer, Profile, Group } from '@/types/database.types';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';

interface SearchScreenProps extends MainStackScreenProps<'Search'> {}

type SearchTab = 'prayers' | 'users' | 'groups';
type SearchResult = Prayer | Profile | Group;

const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('prayers');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search suggestions
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const newSuggestions = await searchService.getSearchSuggestions(query);
        setSuggestions(newSuggestions);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error loading suggestions:', error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSearch = useCallback(async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setShowSuggestions(false);
    setHasSearched(true);

    try {
      let searchResults: any;
      
      switch (activeTab) {
        case 'prayers':
          searchResults = await searchService.searchPrayers({
            query: searchQuery,
            filters,
            sortBy: 'relevance',
          });
          break;
        case 'users':
          searchResults = await searchService.searchUsers({
            query: searchQuery,
            filters,
            sortBy: 'relevance',
          });
          break;
        case 'groups':
          searchResults = await searchService.searchGroups({
            query: searchQuery,
            filters,
            sortBy: 'relevance',
          });
          break;
      }

      setResults(searchResults.data);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to perform search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [query, activeTab, filters]);

  const handleSuggestionPress = useCallback((suggestion: SearchSuggestion) => {
    setQuery(suggestion.title);
    setShowSuggestions(false);
    handleSearch(suggestion.title);
  }, [handleSearch]);

  const handleClearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setShowSuggestions(false);
    setHasSearched(false);
  }, []);

  const renderSuggestion = ({ item }: { item: SearchSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
    >
      <View style={styles.suggestionIcon}>
        <Ionicons
          name={
            item.type === 'prayer' ? 'heart' :
            item.type === 'user' ? 'person' :
            item.type === 'group' ? 'people' :
            item.type === 'tag' ? 'pricetag' : 'search'
          }
          size={20}
          color={theme.colors.primary[600]}
        />
      </View>
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionTitle}>{item.title}</Text>
        {item.subtitle && (
          <Text style={styles.suggestionSubtitle}>{item.subtitle}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderPrayerResult = ({ item }: { item: Prayer }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => navigation.navigate('PrayerDetails', { prayerId: item.id })}
    >
      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle} numberOfLines={2}>
          {item.text}
        </Text>
        <Text style={styles.resultMeta}>
          {item.user?.display_name} • {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.resultStats}>
        <View style={styles.statItem}>
          <Ionicons name="heart" size={16} color={theme.colors.text.secondary} />
          <Text style={styles.statText}>{item.interaction_count || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble" size={16} color={theme.colors.text.secondary} />
          <Text style={styles.statText}>{item.comment_count || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderUserResult = ({ item }: { item: Profile }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
    >
      <View style={styles.userResult}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {item.display_name?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.display_name}</Text>
          <Text style={styles.userUsername}>@{item.username}</Text>
          {item.bio && (
            <Text style={styles.userBio} numberOfLines={2}>
              {item.bio}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderGroupResult = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => navigation.navigate('GroupDetails', { groupId: item.id })}
    >
      <View style={styles.groupResult}>
        <View style={styles.groupIcon}>
          <Ionicons name="people" size={24} color={theme.colors.primary[600]} />
        </View>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.groupDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <Text style={styles.groupMeta}>
            {item.member_count} members • {item.privacy_level}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderResult = ({ item }: { item: SearchResult }) => {
    switch (activeTab) {
      case 'prayers':
        return renderPrayerResult({ item: item as Prayer });
      case 'users':
        return renderUserResult({ item: item as Profile });
      case 'groups':
        return renderGroupResult({ item: item as Group });
      default:
        return null;
    }
  };

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[600]} />
          <Text style={styles.emptyText}>Searching...</Text>
        </View>
      );
    }

    if (hasSearched && results.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={64} color={theme.colors.neutral[400]} />
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptyText}>
            Try adjusting your search terms or filters
          </Text>
        </View>
      );
    }

    if (!hasSearched) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={64} color={theme.colors.neutral[400]} />
          <Text style={styles.emptyTitle}>Search for prayers, people, and groups</Text>
          <Text style={styles.emptyText}>
            Find prayer requests, connect with others, and discover groups
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search prayers, people, groups..."
            placeholderTextColor={theme.colors.text.secondary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Ionicons name="close-circle" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="options" size={20} color={theme.colors.primary[600]} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        {(['prayers', 'users', 'groups'] as SearchTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item) => item.id}
            style={styles.suggestionsList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      <FlatList
        data={results}
        renderItem={renderResult}
        keyExtractor={(item) => item.id}
        style={styles.resultsList}
        contentContainerStyle={results.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    marginRight: theme.spacing[3],
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body.medium,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing[2],
  },
  filterButton: {
    padding: theme.spacing[2],
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing[3],
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary[600],
  },
  tabText: {
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
  },
  activeTabText: {
    color: theme.colors.primary[600],
    fontWeight: '600',
  },
  suggestionsContainer: {
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
    maxHeight: 200,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  suggestionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    ...theme.typography.body.medium,
    color: theme.colors.text.primary,
  },
  suggestionSubtitle: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  resultHeader: {
    marginBottom: theme.spacing[2],
  },
  resultTitle: {
    ...theme.typography.body.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  resultMeta: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.secondary,
  },
  resultStats: {
    flexDirection: 'row',
    gap: theme.spacing[4],
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  statText: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.secondary,
  },
  userResult: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },
  userAvatarText: {
    ...theme.typography.body.medium,
    color: theme.colors.text.inverse,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...theme.typography.body.medium,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  userUsername: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
  },
  userBio: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
  },
  groupResult: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    ...theme.typography.body.medium,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  groupDescription: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
  },
  groupMeta: {
    ...theme.typography.caption.small,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[8],
  },
  emptyTitle: {
    ...theme.typography.heading.h3,
    color: theme.colors.text.primary,
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },
  emptyText: {
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});

export default SearchScreen;