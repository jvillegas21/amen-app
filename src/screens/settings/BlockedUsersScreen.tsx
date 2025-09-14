import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { RootStackScreenProps } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

interface BlockedUser {
  id: string;
  user_id: string;
  user_display_name: string;
  user_avatar_url?: string;
  blocked_at: string;
  reason?: string;
}

/**
 * Blocked Users Management Screen - Manage blocked users
 * Based on manage_blocked_users mockups
 */
const BlockedUsersScreen: React.FC<RootStackScreenProps<'BlockedUsers'>> = ({ navigation }) => {
  const { profile } = useAuthStore();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement blocked users fetch from API
      // For now, using mock data
      const mockBlockedUsers: BlockedUser[] = [
        {
          id: '1',
          user_id: 'user1',
          user_display_name: 'John Smith',
          user_avatar_url: 'https://via.placeholder.com/40',
          blocked_at: new Date(Date.now() - 86400000).toISOString(),
          reason: 'Inappropriate messages',
        },
        {
          id: '2',
          user_id: 'user2',
          user_display_name: 'Sarah Johnson',
          user_avatar_url: 'https://via.placeholder.com/40',
          blocked_at: new Date(Date.now() - 172800000).toISOString(),
          reason: 'Spam content',
        },
        {
          id: '3',
          user_id: 'user3',
          user_display_name: 'Mike Wilson',
          user_avatar_url: 'https://via.placeholder.com/40',
          blocked_at: new Date(Date.now() - 259200000).toISOString(),
          reason: 'Harassment',
        },
      ];
      setBlockedUsers(mockBlockedUsers);
    } catch (error) {
      Alert.alert('Error', 'Failed to load blocked users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBlockedUsers();
    setIsRefreshing(false);
  };

  const handleUnblockUser = async (userId: string, userName: string) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${userName}? They will be able to see your content and send you messages again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            try {
              // TODO: Implement unblock user API call
              setBlockedUsers(prev => prev.filter(user => user.user_id !== userId));
              Alert.alert('Success', `${userName} has been unblocked`);
            } catch (error) {
              Alert.alert('Error', 'Failed to unblock user');
            }
          },
        },
      ]
    );
  };

  const getFilteredUsers = () => {
    if (!searchQuery.trim()) return blockedUsers;
    
    const query = searchQuery.toLowerCase();
    return blockedUsers.filter(user =>
      user.user_display_name.toLowerCase().includes(query)
    );
  };

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search blocked users..."
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderBlockedUserItem = (user: BlockedUser) => (
    <View key={user.id} style={styles.userItem}>
      <View style={styles.userContent}>
        <Image
          source={{ uri: user.user_avatar_url || 'https://via.placeholder.com/40' }}
          style={styles.avatar}
        />
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.user_display_name}</Text>
          <Text style={styles.blockedDate}>
            Blocked {formatDistanceToNow(new Date(user.blocked_at), { addSuffix: true })}
          </Text>
          {user.reason && (
            <Text style={styles.blockReason}>Reason: {user.reason}</Text>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.unblockButton}
          onPress={() => handleUnblockUser(user.user_id, user.user_display_name)}
        >
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.unblockButtonText}>Unblock</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#111827" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Blocked Users</Text>
      <View style={styles.placeholder} />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="shield-checkmark" size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>No Blocked Users</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery 
          ? 'No blocked users match your search criteria.'
          : 'You haven\'t blocked any users yet. Blocked users won\'t be able to see your content or send you messages.'
        }
      </Text>
    </View>
  );

  const renderInfoCard = () => (
    <View style={styles.infoCard}>
      <View style={styles.infoContent}>
        <Ionicons name="information-circle" size={24} color="#3B82F6" />
        <View style={styles.infoText}>
          <Text style={styles.infoTitle}>About Blocking</Text>
          <Text style={styles.infoDescription}>
            Blocked users cannot see your prayers, send you messages, or interact with your content. 
            You can unblock them at any time.
          </Text>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Loading blocked users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredUsers = getFilteredUsers();

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderSearchBar()}
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#5B21B6']}
            tintColor="#5B21B6"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderInfoCard()}
        
        {filteredUsers.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.usersList}>
            {filteredUsers.map(renderBlockedUserItem)}
          </View>
        )}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
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
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  usersList: {
    paddingHorizontal: 16,
  },
  userItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  blockedDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  blockReason: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  unblockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  unblockButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
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
    lineHeight: 24,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default BlockedUsersScreen;
