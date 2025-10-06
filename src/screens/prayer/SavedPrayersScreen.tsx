import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth/authStore';
import { prayerService } from '@/services/api/prayerService';
import { Prayer } from '@/types/database.types';
import { formatDistanceToNow } from 'date-fns';
import { theme } from '@/theme';
import PrayerCard from '@/components/prayer/PrayerCard';
import { OptimizedPrayerList } from '@/components/performance/OptimizedPrayerList';
import { useSharing } from '@/hooks/useSharing';

export default function SavedPrayersScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { sharePrayer, isSharing } = useSharing();
  
  const [savedPrayers, setSavedPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [prayingPrayers, setPrayingPrayers] = useState<Set<string>>(new Set());
  const [savingPrayers, setSavingPrayers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (profile?.id) {
      fetchSavedPrayers();
    }
  }, [profile?.id]);

  const fetchSavedPrayers = async (pageNum = 1, isRefresh = false) => {
    if (!profile?.id) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
        setHasMore(true);
      } else {
        setLoading(true);
      }

      const prayers = await prayerService.getSavedPrayers(pageNum, 20);
      
      if (isRefresh || pageNum === 1) {
        setSavedPrayers(prayers);
      } else {
        setSavedPrayers(prev => [...prev, ...prayers]);
      }

      setHasMore(prayers.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching saved prayers:', error);
      Alert.alert('Error', 'Failed to load saved prayers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchSavedPrayers(1, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchSavedPrayers(page + 1);
    }
  };

  const handlePrayerPress = (prayer: Prayer) => {
    router.push(`/prayer/${prayer.id}`);
  };

  const handlePrayPress = async (prayerId: string) => {
    if (prayingPrayers.has(prayerId)) return;
    setPrayingPrayers(prev => new Set(prev).add(prayerId));
    try {
      // TODO: Implement prayer interaction
      console.log('Praying for:', prayerId);
    } catch (error) {
      console.error('Failed to interact with prayer:', error);
      Alert.alert('Error', 'Failed to pray for this request. Please try again.');
    } finally {
      setTimeout(() => {
        setPrayingPrayers(prev => {
          const newSet = new Set(prev);
          newSet.delete(prayerId);
          return newSet;
        });
      }, 200);
    }
  };

  const handleCommentPress = (prayerId: string) => {
    router.push(`/prayer/${prayerId}`);
  };

  const handleSharePress = async (prayerId: string) => {
    try {
      const prayer = savedPrayers.find(p => p.id === prayerId);
      if (prayer) {
        await sharePrayer(prayer, {
          showAlert: true,
          alertTitle: 'Prayer Shared',
          alertMessage: 'Thank you for sharing this prayer request.',
        });
      }
    } catch (error) {
      console.error('Failed to share prayer:', error);
      Alert.alert('Error', 'Failed to share prayer. Please try again.');
    }
  };

  const handleSavePress = async (prayerId: string) => {
    if (savingPrayers.has(prayerId)) return;
    setSavingPrayers(prev => new Set(prev).add(prayerId));
    try {
      await prayerService.savePrayer(prayerId); // This toggles save/unsave
      setSavedPrayers(prev => prev.filter(prayer => prayer.id !== prayerId));
    } catch (error) {
      console.error('Error unsaving prayer:', error);
      Alert.alert('Error', 'Failed to unsave prayer');
    } finally {
      setTimeout(() => {
        setSavingPrayers(prev => {
          const newSet = new Set(prev);
          newSet.delete(prayerId);
          return newSet;
        });
      }, 200);
    }
  };

  const renderPrayerCard = (prayer: Prayer) => (
    <PrayerCard
      prayer={prayer}
      onPress={() => handlePrayerPress(prayer)}
      onPrayPress={() => handlePrayPress(prayer.id)}
      onCommentPress={() => handleCommentPress(prayer.id)}
      onSharePress={() => handleSharePress(prayer.id)}
      onSavePress={() => handleSavePress(prayer.id)}
      isSaved={true} // All prayers in this screen are saved
      isPraying={prayingPrayers.has(prayer.id)}
      isSharing={isSharing}
      isSaving={savingPrayers.has(prayer.id)}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.primary[600]} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Saved Prayers</Text>
      <View style={styles.placeholder} />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="bookmark-outline" size={64} color={theme.colors.text.tertiary} />
      <Text style={styles.emptyStateTitle}>No Saved Prayers</Text>
      <Text style={styles.emptyStateText}>
        Save prayers you want to revisit later by tapping the bookmark icon
      </Text>
    </View>
  );

  const handleLoadMoreOptimized = async () => {
    if (hasMore && !loading) {
      await fetchSavedPrayers(page + 1);
    }
  };

  const handleRefreshOptimized = async () => {
    await handleRefresh();
  };

  if (loading && page === 1) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[600]} />
          <Text style={styles.loadingText}>Loading saved prayers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <OptimizedPrayerList
        prayers={savedPrayers}
        onLoadMore={handleLoadMoreOptimized}
        onRefresh={handleRefreshOptimized}
        renderPrayerCard={renderPrayerCard}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        isLoading={loading}
        hasMore={hasMore}
        refreshing={refreshing}
        testID="saved-prayer-list"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
    backgroundColor: theme.colors.surface.primary,
  },
  backButton: {
    padding: theme.spacing[2],
  },
  headerTitle: {
    ...theme.typography.heading.h3,
    color: theme.colors.text.primary,
  },
  placeholder: {
    width: theme.spacing[10],
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[8],
    paddingVertical: theme.spacing[24],
  },
  emptyStateTitle: {
    ...theme.typography.heading.h2,
    color: theme.colors.text.primary,
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[2],
  },
  emptyStateText: {
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});