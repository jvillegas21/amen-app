import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { GroupsStackScreenProps } from '@/types/navigation.types';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth/authStore';

interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  privacy: 'public' | 'private' | 'invite_only';
  category: string;
  isJoined: boolean;
}

/**
 * Discover Groups Screen - Browse and search for groups to join
 */
const DiscoverGroupsScreen: React.FC<GroupsStackScreenProps<'DiscoverGroups'>> = ({ navigation }) => {
  const { profile } = useAuthStore();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDiscoverData();
  }, []);

  const fetchDiscoverData = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement real API calls
      const mockGroups: Group[] = [
        {
          id: '1',
          name: 'Prayer Warriors',
          description: 'A community dedicated to supporting each other through prayer',
          memberCount: 45,
          privacy: 'public',
          category: 'General',
          isJoined: false,
        },
        {
          id: '2',
          name: 'Healing & Recovery',
          description: 'Supporting those on their healing journey',
          memberCount: 67,
          privacy: 'public',
          category: 'Health',
          isJoined: false,
        },
        {
          id: '3',
          name: 'Youth Ministry',
          description: 'Prayer group for young adults',
          memberCount: 34,
          privacy: 'invite_only',
          category: 'Youth',
          isJoined: false,
        },
        {
          id: '4',
          name: 'Family Prayer Circle',
          description: 'Praying for families and their needs',
          memberCount: 23,
          privacy: 'private',
          category: 'Family',
          isJoined: false,
        },
      ];
      setGroups(mockGroups);
    } catch (error) {
      console.error('Failed to fetch discover data:', error);
      Alert.alert('Error', 'Failed to load groups');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGroup = (groupId: string, groupName: string) => {
    Alert.alert(
      'Join Group',
      `Are you sure you want to join "${groupName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: () => {
            // TODO: Implement join group API call
            setGroups(prev => prev.map(group => 
              group.id === groupId ? { ...group, isJoined: true } : group
            ));
          },
        },
      ]
    );
  };

  const handleGroupPress = (groupId: string) => {
    navigation.navigate('GroupDetails', { groupId });
  };

  const filteredGroups = groups.filter(group => 
    searchQuery === '' || 
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search groups..."
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

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.groupItem}
      onPress={() => handleGroupPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.groupAvatar}>
        <Ionicons name="people" size={24} color="#6B7280" />
      </View>
      
      <View style={styles.groupContent}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupName}>{item.name}</Text>
          <View style={styles.groupPrivacy}>
            <Ionicons
              name={item.privacy === 'public' ? 'globe' : 'lock-closed'}
              size={14}
              color={item.privacy === 'public' ? 'theme.colors.success[700]' : 'theme.colors.warning[700]'}
            />
          </View>
        </View>
        
        <Text style={styles.groupDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.groupMeta}>
          <View style={styles.groupStats}>
            <Ionicons name="people" size={14} color="#6B7280" />
            <Text style={styles.groupStatsText}>{item.memberCount} members</Text>
          </View>
          <Text style={styles.groupCategory}>{item.category}</Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={[
          styles.joinButton,
          item.isJoined && styles.joinedButton
        ]}
        onPress={() => handleJoinGroup(item.id, item.name)}
      >
        <Text style={[
          styles.joinButtonText,
          item.isJoined && styles.joinedButtonText
        ]}>
          {item.isJoined ? 'Joined' : 'Join'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="search-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>No Groups Found</Text>
      <Text style={styles.emptyStateText}>
        Try adjusting your search or browse different categories
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Discover Groups</Text>
      <Text style={styles.headerSubtitle}>
        Find prayer communities to join
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Loading groups...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderSearchBar()}
      <FlatList
        data={filteredGroups}
        renderItem={renderGroupItem}
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
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  groupContent: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  groupPrivacy: {
    padding: 2,
  },
  groupDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupStatsText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#6B7280',
  },
  groupCategory: {
    fontSize: 12,
    color: '#9CA3AF',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  joinButton: {
    backgroundColor: '#5B21B6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  joinedButton: {
    backgroundColor: '#DCFCE7',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  joinedButtonText: {
    color: '#166534',
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

export default DiscoverGroupsScreen;