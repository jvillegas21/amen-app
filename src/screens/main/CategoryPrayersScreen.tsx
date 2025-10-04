import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { RootStackScreenProps } from '@/types/navigation.types';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/config/supabase';
import { useAuthStore } from '@/store/auth/authStore';
import { theme } from '@/theme';

interface Prayer {
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
const CategoryPrayersScreen: React.FC<RootStackScreenProps<'CategoryPrayers'>> = ({
  route,
  navigation
}) => {
  const { categoryId, categoryName, categoryIcon, categoryColor } = route.params;
  const { profile } = useAuthStore();
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
        .contains('tags', [categoryName])
        .eq('privacy_level', 'public')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch interaction counts for each prayer
      const prayersWithCounts = await Promise.all(
        (data || []).map(async (prayer) => {
          const [prayingCount, commentCount] = await Promise.all([
            supabase
              .from('interactions')
              .select('id', { count: 'exact', head: true })
              .eq('prayer_id', prayer.id)
              .eq('type', 'praying'),
            supabase
              .from('comments')
              .select('id', { count: 'exact', head: true })
              .eq('prayer_id', prayer.id),
          ]);

          return {
            ...prayer,
            prayer_count: prayingCount.count || 0,
            comment_count: commentCount.count || 0,
          };
        })
      );

      setPrayers(prayersWithCounts);
    } catch (error) {
      console.error('Failed to fetch category prayers:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [categoryName]);

  useEffect(() => {
    fetchCategoryPrayers();
  }, [fetchCategoryPrayers]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchCategoryPrayers();
  };

  const handlePrayerPress = (prayer: Prayer) => {
    navigation.navigate('PrayerDetails', { prayerId: prayer.id });
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

  const renderPrayer = ({ item }: { item: Prayer }) => (
    <TouchableOpacity
      style={styles.prayerCard}
      onPress={() => handlePrayerPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.prayerHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={theme.colors.text.tertiary} />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.profiles?.display_name || 'Anonymous'}</Text>
            {item.location_city && (
              <Text style={styles.location} numberOfLines={1}>
                {item.location_city}
              </Text>
            )}
          </View>
        </View>
        <Text style={styles.timeAgo}>{getTimeAgo(item.created_at)}</Text>
      </View>

      <Text style={styles.prayerText} numberOfLines={3}>
        {item.text}
      </Text>

      <View style={styles.prayerStats}>
        <View style={styles.statItem}>
          <Ionicons name="heart" size={16} color={theme.colors.error[700]} />
          <Text style={styles.statText}>{item.prayer_count || 0} praying</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble" size={16} color={theme.colors.text.tertiary} />
          <Text style={styles.statText}>{item.comment_count || 0} comments</Text>
        </View>
      </View>
    </TouchableOpacity>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: categoryColor }]}>
          <Ionicons name={categoryIcon as any} size={24} color="#FFFFFF" />
        </View>
        <Text style={styles.headerSubtitle}>
          {prayers.length} {prayers.length === 1 ? 'prayer' : 'prayers'} in this category
        </Text>
      </View>

      <FlatList
        data={prayers}
        renderItem={renderPrayer}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContainer,
          prayers.length === 0 && styles.emptyListContainer,
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={categoryColor}
            colors={[categoryColor]}
          />
        }
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
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing[4],
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
    fontSize: 16,
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
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  listContainer: {
    padding: theme.spacing[4],
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  prayerCard: {
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing[4],
    borderRadius: 12,
    marginBottom: theme.spacing[4],
    ...theme.shadows.sm,
  },
  prayerHeader: {
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing[3],
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  location: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  timeAgo: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
  },
  prayerText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    lineHeight: 24,
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
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[6],
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
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing[6],
    lineHeight: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[3],
    borderRadius: 24,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: theme.spacing[2],
  },
});

export default CategoryPrayersScreen;
