import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth/authStore';
import { contentModerationService, BlockedUser } from '@/services/api/contentModerationService';
import { formatDistanceToNow } from 'date-fns';

export default function BlockedUsersScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchBlockedUsers();
    }
  }, [profile?.id]);

  const fetchBlockedUsers = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const data = await contentModerationService.getBlockedUsers(profile.id);
      setBlockedUsers(data);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      Alert.alert('Error', 'Failed to load blocked users');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBlockedUsers();
    setRefreshing(false);
  };

  const handleUnblockUser = (blockedUserId: string) => {
    Alert.alert(
      'Unblock User',
      'Are you sure you want to unblock this user? You will be able to see their content again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          style: 'destructive',
          onPress: async () => {
            try {
              await contentModerationService.unblockUser(blockedUserId);
              setBlockedUsers(prev => prev.filter(user => user.blocked_user_id !== blockedUserId));
              Alert.alert('Success', 'User has been unblocked');
            } catch (error) {
              console.error('Error unblocking user:', error);
              Alert.alert('Error', 'Failed to unblock user');
            }
          },
        },
      ]
    );
  };

  const renderBlockedUserItem = ({ item: blockedUser }: { item: BlockedUser }) => (
    <View style={styles.blockedUserItem}>
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={24} color="#9CA3AF" />
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>
            {blockedUser.blocked_user?.display_name || 'Unknown User'}
          </Text>
          <Text style={styles.blockDate}>
            Blocked {formatDistanceToNow(new Date(blockedUser.created_at), { addSuffix: true })}
          </Text>
          {blockedUser.reason && (
            <Text style={styles.blockReason}>
              Reason: {blockedUser.reason}
            </Text>
          )}
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.unblockButton}
        onPress={() => handleUnblockUser(blockedUser.blocked_user_id)}
      >
        <Ionicons name="person-add" size={20} color="#5B21B6" />
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="person-outline" size={64} color="#C7C7CC" />
      <Text style={styles.emptyStateTitle}>No Blocked Users</Text>
      <Text style={styles.emptyStateText}>
        Users you block will appear here. You can unblock them at any time.
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
          <Text style={styles.headerTitle}>Blocked Users</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Loading blocked users...</Text>
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
        <Text style={styles.headerTitle}>Blocked Users</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={blockedUsers}
        renderItem={renderBlockedUserItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          blockedUsers.length === 0 && styles.emptyListContainer,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
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
  blockedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  blockDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  blockReason: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  unblockButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
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