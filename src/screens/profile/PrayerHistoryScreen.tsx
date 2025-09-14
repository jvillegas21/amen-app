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

interface PrayerHistory {
  id: string;
  text: string;
  prayerCount: number;
  commentCount: number;
  createdAt: string;
  status: 'active' | 'answered' | 'private';
}

/**
 * Prayer History Screen - Display user's prayer creation history
 */
const PrayerHistoryScreen: React.FC<ProfileStackScreenProps<'PrayerHistory'>> = ({ navigation }) => {
  const { profile } = useAuthStore();
  const [prayers, setPrayers] = useState<PrayerHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPrayerHistory();
  }, []);

  const fetchPrayerHistory = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement real API calls
      const mockPrayers: PrayerHistory[] = [
        {
          id: '1',
          text: 'Please pray for my family during this difficult time. We need strength and guidance.',
          prayerCount: 45,
          commentCount: 12,
          createdAt: '2 days ago',
          status: 'active',
        },
        {
          id: '2',
          text: 'Praying for healing and recovery for my grandmother who is in the hospital.',
          prayerCount: 78,
          commentCount: 23,
          createdAt: '1 week ago',
          status: 'answered',
        },
        {
          id: '3',
          text: 'Thanking God for answered prayers and asking for continued blessings.',
          prayerCount: 34,
          commentCount: 8,
          createdAt: '2 weeks ago',
          status: 'answered',
        },
        {
          id: '4',
          text: 'Personal prayer for guidance in making important life decisions.',
          prayerCount: 0,
          commentCount: 0,
          createdAt: '3 weeks ago',
          status: 'private',
        },
      ];
      setPrayers(mockPrayers);
    } catch (error) {
      console.error('Failed to fetch prayer history:', error);
      Alert.alert('Error', 'Failed to load prayer history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPrayer = (prayerId: string) => {
    navigation.navigate('EditPrayer', { prayerId });
  };

  const handleDeletePrayer = (prayerId: string) => {
    Alert.alert(
      'Delete Prayer',
      'Are you sure you want to delete this prayer? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setPrayers(prev => prev.filter(prayer => prayer.id !== prayerId));
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered':
        return '#10B981';
      case 'active':
        return '#5B21B6';
      case 'private':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const filteredPrayers = prayers.filter(prayer => 
    searchQuery === '' || 
    prayer.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search your prayers..."
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

  const renderPrayerItem = ({ item }: { item: PrayerHistory }) => (
    <TouchableOpacity
      style={styles.prayerItem}
      onPress={() => console.log('View prayer:', item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.prayerHeader}>
        <View style={styles.prayerStatus}>
          <Ionicons
            name={item.status === 'answered' ? 'checkmark-circle' : 'time'}
            size={16}
            color={getStatusColor(item.status)}
          />
          <Text style={[
            styles.statusText,
            { color: getStatusColor(item.status) }
          ]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
        <View style={styles.prayerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditPrayer(item.id)}
          >
            <Ionicons name="create" size={16} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeletePrayer(item.id)}
          >
            <Ionicons name="trash" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.prayerText} numberOfLines={3}>
        {item.text}
      </Text>

      <View style={styles.prayerFooter}>
        <View style={styles.prayerStats}>
          <View style={styles.statItem}>
            <Ionicons name="heart" size={14} color="#EF4444" />
            <Text style={styles.statText}>{item.prayerCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble" size={14} color="#6B7280" />
            <Text style={styles.statText}>{item.commentCount}</Text>
          </View>
        </View>
        <Text style={styles.createdDate}>Created {item.createdAt}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="book-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>No Prayers Yet</Text>
      <Text style={styles.emptyStateText}>
        Start creating prayers to see them here
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Prayer History</Text>
      <Text style={styles.headerSubtitle}>
        {prayers.length} prayer{prayers.length !== 1 ? 's' : ''} created
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Loading prayer history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderSearchBar()}
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
  prayerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  prayerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
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
  createdDate: {
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

export default PrayerHistoryScreen;