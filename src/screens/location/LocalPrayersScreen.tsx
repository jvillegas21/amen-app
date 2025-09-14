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
import { locationService, PrayerLocation } from '@/services/api/locationService';
import { Prayer } from '@/types/database.types';
import { formatDistanceToNow } from 'date-fns';

export default function LocalPrayersScreen() {
  const router = useRouter();
  
  const [prayers, setPrayers] = useState<PrayerLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; city?: string } | null>(null);
  const [stats, setStats] = useState({
    totalPrayers: 0,
    recentPrayers: 0,
    popularTags: [] as string[],
    averageDistance: 0,
  });

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    try {
      setLoading(true);
      const currentLocation = await locationService.getCurrentLocation();
      
      if (currentLocation) {
        setLocation(currentLocation);
        await fetchLocalPrayers(currentLocation.latitude, currentLocation.longitude);
        await fetchLocationStats(currentLocation.latitude, currentLocation.longitude);
      } else {
        Alert.alert(
          'Location Access Required',
          'Please enable location access to see local prayers.',
          [
            { text: 'Cancel', onPress: () => router.back() },
            { text: 'Settings', onPress: () => {
              // TODO: Open app settings
            }},
          ]
        );
      }
    } catch (error) {
      console.error('Error initializing location:', error);
      Alert.alert('Error', 'Failed to get your location');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocalPrayers = async (latitude: number, longitude: number) => {
    try {
      const localPrayers = await locationService.getNearbyPrayers(latitude, longitude, 10, 50);
      setPrayers(localPrayers);
    } catch (error) {
      console.error('Error fetching local prayers:', error);
    }
  };

  const fetchLocationStats = async (latitude: number, longitude: number) => {
    try {
      const locationStats = await locationService.getLocationStats(latitude, longitude, 10);
      setStats(locationStats);
    } catch (error) {
      console.error('Error fetching location stats:', error);
    }
  };

  const handleRefresh = async () => {
    if (!location) return;
    
    setRefreshing(true);
    await Promise.all([
      fetchLocalPrayers(location.latitude, location.longitude),
      fetchLocationStats(location.latitude, location.longitude),
    ]);
    setRefreshing(false);
  };

  const handlePrayerPress = (prayer: Prayer) => {
    router.push(`/prayer/${prayer.id}`);
  };

  const renderPrayerItem = ({ item }: { item: PrayerLocation }) => {
    const prayer = item.prayer as Prayer;
    if (!prayer) return null;

    const distance = location ? 
      locationService.calculateDistance(
        location.latitude,
        location.longitude,
        item.latitude,
        item.longitude
      ) : 0;

    return (
      <TouchableOpacity
        style={styles.prayerItem}
        onPress={() => handlePrayerPress(prayer)}
      >
        <View style={styles.prayerHeader}>
          <Text style={styles.prayerTitle} numberOfLines={2}>
            Prayer Request
          </Text>
          <View style={styles.distanceBadge}>
            <Ionicons name="location" size={12} color="#5B21B6" />
            <Text style={styles.distanceText}>
              {distance.toFixed(1)} km
            </Text>
          </View>
        </View>
        
        <Text style={styles.prayerText} numberOfLines={3}>
          {prayer.text}
        </Text>
        
        <View style={styles.prayerFooter}>
          <Text style={styles.prayerAuthor}>
            by {prayer.user?.display_name || 'Anonymous'}
          </Text>
          <Text style={styles.prayerDate}>
            {formatDistanceToNow(new Date(prayer.created_at), { addSuffix: true })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStatsCard = () => (
    <View style={styles.statsCard}>
      <Text style={styles.statsTitle}>Local Prayer Activity</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalPrayers}</Text>
          <Text style={styles.statLabel}>Total Prayers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.recentPrayers}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.averageDistance.toFixed(1)}km</Text>
          <Text style={styles.statLabel}>Avg Distance</Text>
        </View>
      </View>
      
      {stats.popularTags.length > 0 && (
        <View style={styles.tagsContainer}>
          <Text style={styles.tagsTitle}>Popular Topics</Text>
          <View style={styles.tagsList}>
            {stats.popularTags.slice(0, 5).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="location-outline" size={64} color="#C7C7CC" />
      <Text style={styles.emptyStateTitle}>No Local Prayers</Text>
      <Text style={styles.emptyStateText}>
        Be the first to share a prayer in your area
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#5B21B6" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Local Prayers</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Finding local prayers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#5B21B6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Local Prayers</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#5B21B6" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={prayers}
        renderItem={renderPrayerItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          prayers.length === 0 && styles.emptyListContainer,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={renderStatsCard}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
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
  refreshButton: {
    padding: 8,
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
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#5B21B6',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tagsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
    paddingTop: 16,
  },
  tagsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#5B21B6',
    fontWeight: '500',
  },
  prayerItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  prayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  prayerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    marginRight: 12,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 12,
    color: '#5B21B6',
    fontWeight: '500',
    marginLeft: 4,
  },
  prayerText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginBottom: 12,
  },
  prayerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prayerAuthor: {
    fontSize: 12,
    color: '#5B21B6',
    fontWeight: '500',
  },
  prayerDate: {
    fontSize: 12,
    color: '#666',
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
});