import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { theme } from '@/theme';
import { MainTabScreenProps } from '@/types/navigation.types';
import { Prayer } from '@/types/database.types';
import { usePrayerStore } from '@/store/prayer/prayerStore';
import { prayerInteractionService } from '@/services/api/prayerInteractionService';
import { contentModerationService } from '@/services/api/contentModerationService';
import { useSharing } from '@/hooks/useSharing';
import PrayerCard from '@/components/prayer/PrayerCard';
import { OptimizedPrayerList } from '@/components/performance/OptimizedPrayerList';
import OfflineStatusBanner from '@/components/offline/OfflineStatusBanner';
import { Ionicons } from '@expo/vector-icons';

/**
 * Home Screen - Main prayer feed
 * Implements Open/Closed Principle: Extensible for new feed types without modification
 */
const HomeScreen: React.FC<MainTabScreenProps<'Home'>> = ({ navigation }: MainTabScreenProps<'Home'>) => {
  const {
    prayers,
    isLoading,
    isRefreshing,
    fetchPrayers,
    refreshPrayers,
    loadMorePrayers,
    interactWithPrayer,
    subscribeToRealtime,
    unsubscribeFromRealtime,
  } = usePrayerStore();

  const [feedType, setFeedType] = useState<'following' | 'discover'>('following');
  const [savedPrayers, setSavedPrayers] = useState<Set<string>>(new Set());
  const [interactingPrayers, setInteractingPrayers] = useState<Set<string>>(new Set());
  
  const { sharePrayer, isSharing } = useSharing();

  useEffect(() => {
    fetchPrayers(feedType);
    // Subscribe to real-time updates
    subscribeToRealtime(feedType);
    
    // Cleanup on unmount or feed type change
    return () => {
      unsubscribeFromRealtime();
    };
  }, [feedType, fetchPrayers, subscribeToRealtime, unsubscribeFromRealtime]);

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
    setInteractingPrayers(prev => new Set(prev).add(prayerId));
    try {
      await interactWithPrayer(prayerId, 'PRAY');
    } catch (error) {
      console.error('Failed to interact with prayer:', error);
      Alert.alert('Error', 'Failed to pray for this request. Please try again.');
    } finally {
      setInteractingPrayers(prev => {
        const newSet = new Set(prev);
        newSet.delete(prayerId);
        return newSet;
      });
    }
  };

  const handleCommentPress = (prayerId: string) => {
    navigation.navigate('PrayerDetails', { prayerId });
  };

  const handleSharePress = async (prayerId: string) => {
    setInteractingPrayers(prev => new Set(prev).add(prayerId));
    try {
      await interactWithPrayer(prayerId, 'SHARE');
      // Use the sharing service
      const prayer = prayers.find(p => p.id === prayerId);
      if (prayer) {
        await sharePrayer(prayer, {
          showAlert: true,
          alertTitle: 'Prayer Shared',
          alertMessage: 'Thank you for sharing this prayer request. May it bring comfort and support to those who need it.',
        });
      }
    } catch (error) {
      console.error('Failed to share prayer:', error);
      Alert.alert('Error', 'Failed to share prayer. Please try again.');
    } finally {
      setInteractingPrayers(prev => {
        const newSet = new Set(prev);
        newSet.delete(prayerId);
        return newSet;
      });
    }
  };

  const handleSavePress = async (prayerId: string) => {
    setInteractingPrayers(prev => new Set(prev).add(prayerId));
    try {
      await prayerInteractionService.savePrayer(prayerId);
      setSavedPrayers((prev: Set<string>) => {
        const newSet = new Set(prev);
        if (newSet.has(prayerId)) {
          newSet.delete(prayerId);
        } else {
          newSet.add(prayerId);
        }
        return newSet;
      });
    } catch (error) {
      console.error('Failed to save prayer:', error);
      Alert.alert('Error', 'Failed to save prayer. Please try again.');
    } finally {
      setInteractingPrayers(prev => {
        const newSet = new Set(prev);
        newSet.delete(prayerId);
        return newSet;
      });
    }
  };

  const handleReportPress = (prayer: Prayer) => {
    navigation.navigate('ReportContent', {
      type: 'prayer',
      id: prayer.id,
      prayerId: prayer.id,
    });
  };

  const handleBlockUserPress = async (prayer: Prayer) => {
    if (!prayer.user?.id) return;
    
    try {
      await contentModerationService.blockUser(prayer.user.id, 'User requested block');
      Alert.alert('Success', 'User has been blocked');
    } catch (error) {
      console.error('Failed to block user:', error);
      Alert.alert('Error', 'Failed to block user');
    }
  };

  const renderPrayerCard = useCallback((prayer: Prayer) => (
    <PrayerCard
      prayer={prayer}
      onPress={() => handlePrayerPress(prayer.id)}
      onPrayPress={() => handlePrayPress(prayer.id)}
      onCommentPress={() => handleCommentPress(prayer.id)}
      onSharePress={() => handleSharePress(prayer.id)}
      onSavePress={() => handleSavePress(prayer.id)}
      isSaved={savedPrayers.has(prayer.id)}
      isInteracting={interactingPrayers.has(prayer.id) || isSharing}
      onReportPress={() => handleReportPress(prayer)}
      onBlockUserPress={() => handleBlockUserPress(prayer)}
    />
  ), [savedPrayers, interactingPrayers, isSharing, handlePrayerPress, handlePrayPress, handleCommentPress, handleSharePress, handleSavePress, handleReportPress, handleBlockUserPress]);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.feedToggle}>
        <TouchableOpacity
          style={[
            styles.feedButton,
            feedType === 'following' && styles.feedButtonActive,
          ]}
          onPress={() => setFeedType('following')}
          accessibilityRole="tab"
          accessibilityLabel="Following feed"
          accessibilityState={{ selected: feedType === 'following' }}
          accessibilityHint="Switch to prayers from people you follow"
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
          accessibilityRole="tab"
          accessibilityLabel="Discover feed"
          accessibilityState={{ selected: feedType === 'discover' }}
          accessibilityHint="Switch to discover new prayers"
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
      
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.headerActionButton}
          onPress={() => navigation.navigate('SavedPrayers')}
          accessibilityRole="button"
          accessibilityLabel="Saved prayers"
          accessibilityHint="View your saved prayers"
        >
          <Ionicons name="bookmark-outline" size={20} color={theme.colors.primary[600]} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerActionButton}
          onPress={() => navigation.navigate('PrayerReminders')}
          accessibilityRole="button"
          accessibilityLabel="Prayer reminders"
          accessibilityHint="Set up prayer reminders"
        >
          <Ionicons name="alarm-outline" size={20} color={theme.colors.primary[600]} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={64} color={theme.colors.neutral[300]} />
      <Text style={styles.emptyTitle}>No prayers yet</Text>
      <Text style={styles.emptyText}>
        {feedType === 'following'
          ? 'Follow others to see their prayers here'
          : 'Be the first to share a prayer'}
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={handleCreatePress}
        accessibilityRole="button"
        accessibilityLabel="Share a prayer"
        accessibilityHint="Create and share a new prayer"
      >
        <Text style={styles.emptyButtonText}>Share a Prayer</Text>
      </TouchableOpacity>
    </View>
  ), [feedType, handleCreatePress]);

  const handleLoadMoreOptimized = useCallback(async () => {
    if (!isLoading) {
      await loadMorePrayers(feedType);
    }
  }, [feedType, isLoading, loadMorePrayers]);

  const handleRefreshOptimized = useCallback(async () => {
    await refreshPrayers(feedType);
  }, [feedType, refreshPrayers]);

  return (
    <View style={styles.container}>
      <OfflineStatusBanner />
      <OptimizedPrayerList
        prayers={prayers}
        onLoadMore={handleLoadMoreOptimized}
        onRefresh={handleRefreshOptimized}
        renderPrayerCard={renderPrayerCard}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        isLoading={isLoading}
        hasMore={true} // TODO: Get from store
        refreshing={isRefreshing}
        testID="home-prayer-list"
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreatePress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Create prayer"
        accessibilityHint="Double tap to create a new prayer"
      >
        <Ionicons name="add" size={28} color={theme.colors.text.inverse} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  listContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: theme.colors.surface.primary,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[0.5],
  },
  feedButton: {
    flex: 1,
    paddingVertical: theme.spacing[2],
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    minHeight: theme.layout.minTouchTarget,
    justifyContent: 'center',
  },
  feedButtonActive: {
    backgroundColor: theme.colors.surface.primary,
  },
  feedButtonText: {
    ...theme.typography.label.medium,
    color: theme.colors.text.secondary,
  },
  feedButtonTextActive: {
    color: theme.colors.primary[600],
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    padding: theme.spacing[2],
    marginLeft: theme.spacing[2],
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.tertiary,
    minHeight: theme.layout.minTouchTarget,
    minWidth: theme.layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing[24],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[8],
    paddingVertical: theme.spacing[24],
  },
  emptyTitle: {
    ...theme.typography.heading.h2,
    color: theme.colors.text.primary,
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },
  emptyText: {
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing[6],
  },
  emptyButton: {
    backgroundColor: theme.colors.primary[600],
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
    minHeight: theme.layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonText: {
    color: theme.colors.text.inverse,
    ...theme.typography.button.medium,
  },
  footerLoader: {
    paddingVertical: theme.spacing[5],
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: theme.spacing[4],
    bottom: theme.spacing[4],
    width: theme.spacing[14],
    height: theme.spacing[14],
    borderRadius: theme.spacing[7],
    backgroundColor: theme.colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.lg,
    shadowColor: theme.colors.neutral[1000],
  },
});

export default HomeScreen;