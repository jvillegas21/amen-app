import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MainStackScreenProps } from '@/types/navigation.types';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/config/supabase';
import { useAuthStore } from '@/store/auth/authStore';
import { theme } from '@/theme';
import PrayerCard from '@/components/prayer/PrayerCard';
import { useSharing } from '@/hooks/useSharing';
import { OptimizedPrayerList } from '@/components/performance/OptimizedPrayerList';
import { Prayer } from '@/types/database.types';

interface CategoryPrayer {
  id: string;
  text: string;
  user_id: string;
  location_city?: string;
  created_at: string;
  profiles: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  prayer_count?: number;
  comment_count?: number;
}

/**
 * Category Prayers Screen - Shows prayers filtered by category tag
 */
const CategoryPrayersScreen: React.FC<MainStackScreenProps<'CategoryPrayers'>> = ({
  route,
  navigation
}) => {
  const { categoryId, categoryName, categoryIcon, categoryColor } = route.params;
  const { profile } = useAuthStore();
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [prayingPrayers, setPrayingPrayers] = useState<Set<string>>(new Set());
  const [savingPrayers, setSavingPrayers] = useState<Set<string>>(new Set());
  const { sharePrayer, isSharing } = useSharing();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: categoryColor,
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        color: '#FFFFFF',
      },
    });
  }, [navigation, categoryColor]);

  const fetchCategoryPrayers = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch prayers that have this category in their tags array
      const { data, error } = await supabase
        .from('prayers')
        .select(`
          id,
          text,
          user_id,
          location_city,
          created_at,
          profiles!prayers_user_id_fkey (
            id,
            display_name,
            avatar_url
          )
        `)
        .contains('tags', [categoryId])
        .eq('privacy_level', 'public')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const prayerIds = (data || []).map(p => p.id);

      if (prayerIds.length === 0) {
        setPrayers([]);
        return;
      }

      // Batch query for interaction counts - ONE query for all prayers
      const [interactionResult, commentResult] = await Promise.all([
        supabase
          .from('interactions')
          .select('prayer_id, type')
          .in('prayer_id', prayerIds),
        supabase
          .from('comments')
          .select('prayer_id')
          .in('prayer_id', prayerIds),
      ]);

      // Aggregate counts in memory (fast operation)
      const interactionCounts: Record<string, { pray: number; like: number }> = {};
      prayerIds.forEach(id => {
        interactionCounts[id] = { pray: 0, like: 0 };
      });

      (interactionResult.data || []).forEach(interaction => {
        if (interaction.type === 'PRAY') {
          interactionCounts[interaction.prayer_id].pray++;
        } else if (interaction.type === 'LIKE') {
          interactionCounts[interaction.prayer_id].like++;
        }
      });

      const commentCounts: Record<string, number> = {};
      prayerIds.forEach(id => {
        commentCounts[id] = 0;
      });

      (commentResult.data || []).forEach(comment => {
        commentCounts[comment.prayer_id]++;
      });

      // Merge data - NO additional queries
      const prayersWithCounts = (data || []).map(prayer => ({
        ...prayer,
        pray_count: interactionCounts[prayer.id]?.pray || 0,
        comment_count: commentCounts[prayer.id] || 0,
        user: prayer.profiles,
        user_interactions: {
          isPrayed: false,
          isSaved: false,
        },
        tags: [categoryId],
        privacy_level: 'public' as const,
        is_anonymous: false,
        status: 'active' as const,
      }));

      setPrayers(prayersWithCounts as Prayer[]);
    } catch (error) {
      console.error('Failed to fetch category prayers:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [categoryId]);

  useEffect(() => {
    fetchCategoryPrayers();
  }, [fetchCategoryPrayers]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchCategoryPrayers();
  };

  const handlePrayerPress = (prayerId: string) => {
    navigation.navigate('PrayerDetails', { prayerId });
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
    navigation.navigate('PrayerDetails', { prayerId });
  };

  const handleSharePress = async (prayerId: string) => {
    try {
      const prayer = prayers.find(p => p.id === prayerId);
      if (prayer) {
        await sharePrayer(prayer as any, {
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
      // TODO: Implement save functionality
      console.log('Saving prayer:', prayerId);
    } catch (error) {
      console.error('Failed to save prayer:', error);
      Alert.alert('Error', 'Failed to save prayer. Please try again.');
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

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  };

  const renderPrayerCard = (prayer: Prayer) => (
    <PrayerCard
      prayer={prayer}
      onPress={() => handlePrayerPress(prayer.id)}
      onPrayPress={() => handlePrayPress(prayer.id)}
      onCommentPress={() => handleCommentPress(prayer.id)}
      onSharePress={() => handleSharePress(prayer.id)}
      onSavePress={() => handleSavePress(prayer.id)}
      isPraying={prayingPrayers.has(prayer.id)}
      isSharing={isSharing}
      isSaving={savingPrayers.has(prayer.id)}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={[styles.headerIcon, { backgroundColor: categoryColor }]}>
        <Ionicons name={categoryIcon as any} size={24} color="#FFFFFF" />
      </View>
      <Text style={styles.headerSubtitle}>
        {prayers.length} {prayers.length === 1 ? 'prayer' : 'prayers'} in this category
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: categoryColor }]}>
        <Ionicons name={categoryIcon as any} size={48} color="#FFFFFF" />
      </View>
      <Text style={styles.emptyTitle}>No prayers yet</Text>
      <Text style={styles.emptySubtitle}>
        Be the first to share a prayer in {categoryName}
      </Text>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: categoryColor }]}
        onPress={() => navigation.navigate('CreatePrayer', {})}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.createButtonText}>Create Prayer</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={categoryColor} />
        <Text style={styles.loadingText}>Loading prayers...</Text>
      </View>
    );
  }

  const handleLoadMore = useCallback(async () => {
    // TODO: Implement pagination for category prayers
    console.log('Load more category prayers');
  }, []);

  const handleRefreshOptimized = useCallback(async () => {
    await handleRefresh();
  }, [handleRefresh]);

  return (
    <View style={styles.container}>
      <OptimizedPrayerList
        prayers={prayers}
        onLoadMore={handleLoadMore}
        onRefresh={handleRefreshOptimized}
        renderPrayerCard={renderPrayerCard}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        isLoading={isLoading}
        hasMore={false} // TODO: Implement pagination
        refreshing={isRefreshing}
        testID="category-prayer-list"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  header: {
    backgroundColor: theme.colors.surface.primary,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
    alignItems: 'center',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  headerSubtitle: {
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
  },
  loadingText: {
    marginTop: theme.spacing[3],
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[8],
    paddingVertical: theme.spacing[24],
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
  emptyTitle: {
    ...theme.typography.heading.h2,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },
  emptySubtitle: {
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing[6],
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
    minHeight: theme.layout.minTouchTarget,
    justifyContent: 'center',
  },
  createButtonText: {
    ...theme.typography.button.medium,
    color: theme.colors.text.inverse,
    marginLeft: theme.spacing[2],
  },
});

export default CategoryPrayersScreen;
