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
  Share,
} from 'react-native';
import { MainStackScreenProps } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import UserAvatar from '@/components/common/UserAvatar';
import { supabase } from '@/config/supabase';
import { groupService } from '@/services/api/groupService';

interface GroupMember {
  id: string;
  user_id: string;
  user_display_name: string;
  user_avatar_url?: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  // Note: is_online would need to be calculated from profiles.last_active
  // last_seen should come from profiles.last_active
  // Note: prayer_count and interaction_count would need to be calculated separately
  // as they don't exist in the group_members table
}

/**
 * Group Member Management Screen - Manage group members and roles
 * Based on manage_group_members mockups
 */
const GroupMemberManagementScreen: React.FC<MainStackScreenProps<'GroupMemberManagement'>> = ({ navigation, route }) => {
  const { groupId } = route.params;
  const { profile } = useAuthStore();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'moderator' | 'member' | null>(null);

  useEffect(() => {
    fetchGroupMembers();
  }, [groupId]);

  const fetchGroupMembers = async () => {
    try {
      setIsLoading(true);

      // Fetch group members with profile data
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          profiles!group_members_user_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true });

      if (membersError) throw membersError;

      const formattedMembers: GroupMember[] = (membersData || []).map((member: any) => ({
        id: member.id,
        user_id: member.user_id,
        user_display_name: member.profiles?.display_name || 'Unknown User',
        user_avatar_url: member.profiles?.avatar_url || null,
        role: member.role,
        joined_at: member.joined_at,
      }));

      setMembers(formattedMembers);

      // Get current user's role in the group
      const currentUserMember = formattedMembers.find(m => m.user_id === profile?.id);
      setUserRole(currentUserMember?.role || 'member');
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

  const handleRoleChange = async (memberId: string, newRole: 'admin' | 'moderator' | 'member') => {
    try {
      // TODO: Implement role change API call
      setMembers(prev => prev.map(member =>
        member.id === memberId
          ? { ...member, role: newRole }
          : member
      ));
      Alert.alert('Success', 'Member role updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update member role');
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement remove member API call
              setMembers(prev => prev.filter(member => member.id !== memberId));
              Alert.alert('Success', 'Member removed from group');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const handleInviteMembers = async () => {
    try {
      // Fetch group details to get the invite code
      const group = await groupService.getGroup(groupId);

      if (!group.invite_code) {
        Alert.alert('Error', 'This group does not have an invite code.');
        return;
      }

      const message = `Join my prayer group "${group.name}" on Amen! Use code: ${group.invite_code}`;

      await Share.share({
        message,
        title: 'Join my Prayer Group',
      });
    } catch (error) {
      console.error('Error sharing invite:', error);
      Alert.alert('Error', 'Failed to share invite');
    }
  };

  const getFilteredMembers = () => {
    if (!searchQuery.trim()) return members;

    const query = searchQuery.toLowerCase();
    return members.filter(member =>
      member.user_display_name.toLowerCase().includes(query)
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'theme.colors.error[700]';
      case 'moderator': return 'theme.colors.warning[700]';
      case 'member': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search members..."
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

  const renderMemberItem = (member: GroupMember) => (
    <View key={member.id} style={styles.memberItem}>
      <View style={styles.memberContent}>
        <View style={styles.avatarContainer}>
          <UserAvatar
            avatarUrl={member.user_avatar_url}
            size={48}
            style={styles.avatar}
          />
          {/* Online indicator would need to be calculated from profiles.last_active */}
        </View>

        <View style={styles.memberInfo}>
          <View style={styles.memberHeader}>
            <Text style={styles.memberName}>{member.user_display_name}</Text>
            <View style={[styles.roleBadge, { backgroundColor: `${getRoleColor(member.role)}15` }]}>
              <Text style={[styles.roleText, { color: getRoleColor(member.role) }]}>
                {member.role}
              </Text>
            </View>
          </View>

          <Text style={styles.memberJoined}>
            Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
          </Text>

          {/* Last seen would need to be calculated from profiles.last_active */}
        </View>

        {userRole === 'admin' && member.role !== 'admin' && (
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => {
              Alert.alert(
                'Manage Member',
                `What would you like to do with ${member.user_display_name}?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  ...(member.role !== 'moderator' ? [{
                    text: 'Make Moderator',
                    onPress: () => handleRoleChange(member.id, 'moderator'),
                  }] : []),
                  ...(member.role !== 'member' ? [{
                    text: 'Make Member',
                    onPress: () => handleRoleChange(member.id, 'member'),
                  }] : []),
                  {
                    text: 'Remove from Group',
                    style: 'destructive',
                    onPress: () => handleRemoveMember(member.id, member.user_display_name),
                  },
                ]
              );
            }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Group Members</Text>
        <Text style={styles.memberCount}>{members.length} members</Text>
      </View>
      <TouchableOpacity style={styles.inviteButton} onPress={handleInviteMembers}>
        <Ionicons name="person-add" size={20} color="#5B21B6" />
        <Text style={styles.inviteButtonText}>Invite</Text>
      </TouchableOpacity>
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
        {filteredMembers.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.membersList}>
            {filteredMembers.map(renderMemberItem)}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  memberCount: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  inviteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B21B6',
    marginLeft: 4,
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
  membersList: {
    paddingTop: 8,
  },
  memberItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  memberContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'theme.colors.success[700]',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  memberStats: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  memberJoined: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  lastSeen: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  moreButton: {
    padding: 8,
    marginLeft: 8,
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

export default GroupMemberManagementScreen;
