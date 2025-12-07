import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { MainStackScreenProps } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import { groupService } from '@/services/api/groupService';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { GroupMember } from '@/types/database.types';
import GroupAvatar from '@/components/common/GroupAvatar';

/**
 * Group Members Screen - Display group members
 */
const GroupMembersScreen: React.FC<MainStackScreenProps<'GroupMembers'>> = ({ navigation, route }) => {
  const { groupId } = route.params;
  const { profile } = useAuthStore();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchGroupMembers();
  }, [groupId]);

  const fetchGroupMembers = async () => {
    try {
      setIsLoading(true);
      const groupMembers = await groupService.getGroupMembers(groupId);
      setMembers(groupMembers);
    } catch (error) {
      console.error('Failed to fetch group members:', error);
      Alert.alert('Error', 'Failed to load group members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchGroupMembers();
    setIsRefreshing(false);
  };

  const getFilteredMembers = () => {
    if (!searchQuery.trim()) return members;

    return members.filter(member =>
      member.user?.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#DC2626';
      case 'moderator':
        return '#D97706';
      case 'member':
        return '#059669';
      default:
        return '#6B7280';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return 'shield';
      case 'moderator':
        return 'checkmark-circle';
      case 'member':
        return 'person';
      default:
        return 'person';
    }
  };

  const renderMemberItem = ({ item }: { item: GroupMember }) => (
    <View style={styles.memberItem}>
      <GroupAvatar
        avatarUrl={item.user?.avatar_url}
        size={48}
        style={styles.memberAvatar}
      />

      <View style={styles.memberInfo}>
        <View style={styles.memberHeader}>
          <Text style={styles.memberName}>
            {item.user?.display_name || 'Unknown User'}
          </Text>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
            <Ionicons name={getRoleIcon(item.role)} size={12} color="#FFFFFF" />
            <Text style={styles.roleText}>{item.role}</Text>
          </View>
        </View>

        <Text style={styles.memberJoined}>
          Joined {formatDistanceToNow(new Date(item.joined_at), { addSuffix: true })}
        </Text>
      </View>

      {item.user_id === profile?.id && (
        <View style={styles.currentUserBadge}>
          <Text style={styles.currentUserText}>You</Text>
        </View>
      )}
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search members..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Members',
      headerBackTitle: 'Back',
      headerTitleAlign: 'center',
      headerStyle: {
        backgroundColor: '#5B21B6',
      },
      headerTintColor: '#FFFFFF',
    });
  }, [navigation]);

  const renderMemberCount = () => (
    <View style={styles.memberCountContainer}>
      <Text style={styles.memberCountText}>
        {members.length} {members.length === 1 ? 'member' : 'members'}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>No Members Found</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery
          ? 'No members match your search criteria.'
          : 'This group doesn\'t have any members yet.'
        }
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderMemberCount()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Loading group members...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredMembers = getFilteredMembers();

  return (
    <SafeAreaView style={styles.container}>
      {renderMemberCount()}
      {renderSearchBar()}

      <FlatList
        data={filteredMembers}
        renderItem={renderMemberItem}
        keyExtractor={(item) => item.id}
        style={styles.membersList}
        contentContainerStyle={styles.membersContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#5B21B6']}
            tintColor="#5B21B6"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  memberCountContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#5B21B6',
  },
  memberCountText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  membersList: {
    flex: 1,
  },
  membersContent: {
    padding: 16,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  memberJoined: {
    fontSize: 14,
    color: '#6B7280',
  },
  currentUserBadge: {
    backgroundColor: '#5B21B6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentUserText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
});

export default GroupMembersScreen;
