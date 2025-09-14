import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { MainTabScreenProps } from '@/types/navigation.types';
import { Prayer } from '@/types/database.types';
import { usePrayerStore } from '@/store/prayer/prayerStore';
import PrayerCard from '@/components/prayer/PrayerCard';
import { Ionicons } from '@expo/vector-icons';

/**
 * Home Screen - Main prayer feed
 * Implements Open/Closed Principle: Extensible for new feed types without modification
 */
const HomeScreen: React.FC<MainTabScreenProps<'Home'>> = ({ navigation }) => {
  const {
    prayers,
    isLoading,
    isRefreshing,
    fetchPrayers,
    refreshPrayers,
    loadMorePrayers,
    interactWithPrayer,
  } = usePrayerStore();

  const [feedType, setFeedType] = useState<'following' | 'discover'>('following');

  useEffect(() => {
    fetchPrayers(feedType);
  }, [feedType]);

  const handleRefresh = useCallback(() => {
    refreshPrayers(feedType);
  }, [feedType, refreshPrayers]);

  const handleLoadMore = useCallback(() => {
    if (!isLoading) {
      loadMorePrayers(feedType);
    }
  }, [feedType, isLoading, loadMorePrayers]);

  const handlePrayerPress = (prayerId: string) => {
    navigation.navigate('PrayerDetails', { prayerId });
  };

  const handleCreatePress = () => {
    navigation.navigate('CreatePrayer', {});
  };

  const handlePrayPress = async (prayerId: string) => {
    try {
      await interactWithPrayer(prayerId, 'PRAY');
    } catch (error) {
      console.error('Failed to interact with prayer:', error);
    }
  };

  const handleCommentPress = (prayerId: string) => {
    navigation.navigate('PrayerDetails', { prayerId });
  };

  const handleSharePress = async (prayerId: string) => {
    try {
      await interactWithPrayer(prayerId, 'SHARE');
      // TODO: Implement native sharing
    } catch (error) {
      console.error('Failed to share prayer:', error);
    }
  };

  const renderPrayerItem = ({ item }: { item: Prayer }) => (
    <PrayerCard
      prayer={item}
      onPress={() => handlePrayerPress(item.id)}
      onPrayPress={() => handlePrayPress(item.id)}
      onCommentPress={() => handleCommentPress(item.id)}
      onSharePress={() => handleSharePress(item.id)}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.feedToggle}>
        <TouchableOpacity
          style={[
            styles.feedButton,
            feedType === 'following' && styles.feedButtonActive,
          ]}
          onPress={() => setFeedType('following')}
        >
          <Text
            style={[
              styles.feedButtonText,
              feedType === 'following' && styles.feedButtonTextActive,
            ]}
          >
            Following
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.feedButton,
            feedType === 'discover' && styles.feedButtonActive,
          ]}
          onPress={() => setFeedType('discover')}
        >
          <Text
            style={[
              styles.feedButtonText,
              feedType === 'discover' && styles.feedButtonTextActive,
            ]}
          >
            Discover
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="heart-outline" size={64} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>No prayers yet</Text>
        <Text style={styles.emptyText}>
          {feedType === 'following'
            ? 'Follow others to see their prayers here'
            : 'Be the first to share a prayer'}
        </Text>
        <TouchableOpacity style={styles.emptyButton} onPress={handleCreatePress}>
          <Text style={styles.emptyButtonText}>Share a Prayer</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFooter = () => {
    if (!isLoading || prayers.length === 0) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#5B21B6" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={prayers}
        keyExtractor={(item) => item.id}
        renderItem={renderPrayerItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#5B21B6']}
            tintColor="#5B21B6"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreatePress}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  listContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  feedToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  feedButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  feedButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  feedButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  feedButtonTextActive: {
    color: '#5B21B6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#5B21B6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#5B21B6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default HomeScreen;