import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth/authStore';
import { prayerInteractionService } from '@/services/api/prayerInteractionService';
import { Prayer } from '@/types/database.types';
import { formatDistanceToNow } from 'date-fns';

export default function SavedPrayersScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  
  const [savedPrayers, setSavedPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

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

      const prayers = await prayerInteractionService.getSavedPrayers(profile.id, pageNum, 20);
      
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

  const handleUnsave = async (prayerId: string) => {
    try {
      await prayerInteractionService.savePrayer(prayerId); // This toggles save/unsave
      setSavedPrayers(prev => prev.filter(prayer => prayer.id !== prayerId));
    } catch (error) {
      console.error('Error unsaving prayer:', error);
      Alert.alert('Error', 'Failed to unsave prayer');
    }
  };

  const renderPrayerItem = ({ item: prayer }: { item: Prayer }) => (
    <TouchableOpacity
      style={styles.prayerItem}
      onPress={() => handlePrayerPress(prayer)}
    >
      <View style={styles.prayerContent}>
        <Text style={styles.prayerTitle} numberOfLines={2}>
          {prayer.title}
        </Text>
        <Text style={styles.prayerText} numberOfLines={3}>
          {prayer.content}
        </Text>
        
        <View style={styles.prayerMeta}>
          <Text style={styles.prayerAuthor}>
            by {prayer.user?.display_name || 'Anonymous'}
          </Text>
          <Text style={styles.prayerDate}>
            {formatDistanceToNow(new Date(prayer.created_at), { addSuffix: true })}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.unsaveButton}
        onPress={() => handleUnsave(prayer.id)}
      >
        <Ionicons name="bookmark" size={20} color="#007AFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="bookmark-outline" size={64} color="#C7C7CC" />
      <Text style={styles.emptyStateTitle}>No Saved Prayers</Text>
      <Text style={styles.emptyStateText}>
        Save prayers you want to revisit later by tapping the bookmark icon
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading || page === 1) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  };

  if (loading && page === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Saved Prayers</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading saved prayers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Prayers</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={savedPrayers}
        renderItem={renderPrayerItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          savedPrayers.length === 0 && styles.emptyListContainer,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
  },
  prayerItem: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  prayerContent: {
    flex: 1,
    marginRight: 12,
  },
  prayerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  prayerText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginBottom: 12,
  },
  prayerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prayerAuthor: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  prayerDate: {
    fontSize: 12,
    color: '#666',
  },
  unsaveButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});