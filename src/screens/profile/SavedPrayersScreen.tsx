import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ProfileStackScreenProps } from '@/types/navigation.types';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth/authStore';
import { Prayer } from '@/types/database.types';

/**
 * Saved Prayers Screen - Display user's saved prayers with search and filtering
 */
const SavedPrayersScreen: React.FC<ProfileStackScreenProps<'SavedPrayers'>> = ({ navigation }) => {
  const { profile } = useAuthStore();
  const [savedPrayers, setSavedPrayers] = useState<Prayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchSavedPrayers();
  }, []);

  const fetchSavedPrayers = async () => {
    try {
      setIsLoading(true);
      if (!profile?.id) return;

      // Use the real API to fetch saved prayers
      const { prayerInteractionService } = await import('@/services/api/prayerInteractionService');
      const savedPrayersData = await prayerInteractionService.getSavedPrayers(profile.id, 1, 50);
      
      setSavedPrayers(savedPrayersData);
    } catch (error) {
      console.error('Failed to fetch saved prayers:', error);
      Alert.alert('Error', 'Failed to load saved prayers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsavePrayer = async (prayerId: string) => {
    Alert.alert(
      'Remove Prayer',
      'Are you sure you want to remove this prayer from your saved prayers?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { prayerInteractionService } = await import('@/services/api/prayerInteractionService');
              await prayerInteractionService.unsavePrayer(prayerId);
              setSavedPrayers(prev => prev.filter(prayer => prayer.id !== prayerId));
            } catch (error) {
              console.error('Failed to unsave prayer:', error);
              Alert.alert('Error', 'Failed to remove prayer from saved prayers');
            }
          },
        },
      ]
    );
  };

  const handlePrayerPress = (prayerId: string) => {
    // Navigate to prayer details screen
    navigation.navigate('PrayerDetails', { prayerId });
  };

  const handleAuthorPress = (authorId: string) => {
    navigation.navigate('UserProfile', { userId: authorId });
  };

  const categories = ['All', 'Family', 'Health', 'Gratitude', 'Community', 'Guidance'];

  const filteredPrayers = savedPrayers.filter(prayer => {
    const matchesSearch = searchQuery === '' || 
      prayer.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prayer.user?.display_name && prayer.user.display_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === null || 
      selectedCategory === 'All' || 
      prayer.tags?.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search saved prayers..."
          placeholderTextColor="#9CA3AF"
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

  const renderCategoryFilter = () => (
    <View style={styles.categoryContainer}>
      <FlatList
        data={categories}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === item && styles.selectedCategoryChip
            ]}
            onPress={() => setSelectedCategory(selectedCategory === item ? null : item)}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === item && styles.selectedCategoryChipText
            ]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
      />
    </View>
  );

  const renderPrayerItem = ({ item }: { item: Prayer }) => (
    <TouchableOpacity
      style={styles.prayerItem}
      onPress={() => handlePrayerPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.prayerHeader}>
        <TouchableOpacity
          style={styles.authorInfo}
          onPress={() => handleAuthorPress(item.user_id)}
        >
          <View style={styles.authorAvatar}>
            <Ionicons name="person" size={16} color="#6B7280" />
          </View>
          <Text style={styles.authorName}>
            {item.is_anonymous ? 'Anonymous' : (item.user?.display_name || 'User')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.unsaveButton}
          onPress={() => handleUnsavePrayer(item.id)}
        >
          <Ionicons name="bookmark" size={20} color="#5B21B6" />
        </TouchableOpacity>
      </View>

      <Text style={styles.prayerText} numberOfLines={3}>
        {item.text}
      </Text>

      <View style={styles.prayerFooter}>
        <View style={styles.prayerStats}>
          <View style={styles.statItem}>
            <Ionicons name="heart" size={14} color="#DC2626" />
            <Text style={styles.statText}>{item.pray_count || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble" size={14} color="#6B7280" />
            <Text style={styles.statText}>{item.comment_count || 0}</Text>
          </View>
        </View>
        <View style={styles.prayerMeta}>
          {item.tags && item.tags.length > 0 && (
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>{item.tags[0]}</Text>
            </View>
          )}
          <Text style={styles.savedDate}>Saved {new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="bookmark-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>No Saved Prayers</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery || selectedCategory ? 
          'No prayers match your current filters' : 
          'Start saving prayers to see them here'
        }
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Saved Prayers</Text>
      <Text style={styles.headerSubtitle}>
        {savedPrayers.length} prayer{savedPrayers.length !== 1 ? 's' : ''} saved
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Loading saved prayers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderSearchBar()}
      {renderCategoryFilter()}
      <FlatList
        data={filteredPrayers}
        renderItem={renderPrayerItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
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
  categoryContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryList: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedCategoryChip: {
    backgroundColor: '#5B21B6',
    borderColor: '#5B21B6',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  selectedCategoryChipText: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
  },
  prayerItem: {
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
  prayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B21B6',
  },
  unsaveButton: {
    padding: 4,
  },
  prayerText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  prayerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  prayerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
  },
  categoryTagText: {
    fontSize: 12,
    color: '#6B7280',
  },
  savedDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
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
});

export default SavedPrayersScreen;