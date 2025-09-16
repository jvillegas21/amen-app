import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { GroupsStackScreenProps } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import { usePrayerStore } from '@/store/prayer/prayerStore';
import { groupService } from '@/services/api/groupService';
import { Ionicons } from '@expo/vector-icons';
import { Prayer, Group } from '@/types/database.types';
import { formatDistanceToNow } from 'date-fns';
import GroupAvatar from '@/components/common/GroupAvatar';
import UserAvatar from '@/components/common/UserAvatar';

/**
 * Group Details Screen - Group information and prayer list
 * Based on group_prayer_list mockups
 */
const GroupDetailsScreen: React.FC<GroupsStackScreenProps<'GroupDetails'>> = ({ navigation, route }) => {
  const { groupId, refresh } = route.params;
  const { profile } = useAuthStore();
  const { prayers, isLoading } = usePrayerStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [group, setGroup] = useState<any>(null);
  const [groupPrayers, setGroupPrayers] = useState<Prayer[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'moderator' | 'member' | null>(null);

  useEffect(() => {
    fetchGroupDetails();
    fetchGroupPrayers();
  }, [groupId]);

  // Refresh data when refresh parameter changes (e.g., after editing group)
  useEffect(() => {
    if (refresh) {
      fetchGroupDetails();
      fetchGroupPrayers();
    }
  }, [refresh]);

  // Refresh data when screen comes into focus (e.g., after creating a prayer or editing group)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchGroupDetails();
      fetchGroupPrayers();
    });

    return unsubscribe;
  }, [navigation, groupId]);

  const fetchGroupDetails = async () => {
    try {
      console.log('Fetching group details for groupId:', groupId);
      const groupData = await groupService.getGroup(groupId);
      console.log('Fetched group data:', groupData);
      setGroup(groupData);
      
      // Check if current user is a member
      const members = await groupService.getGroupMembers(groupId);
      const currentUserMember = members.find(member => member.user_id === profile?.id);
      
      if (currentUserMember) {
        setIsMember(true);
        setUserRole(currentUserMember.role);
      } else {
        setIsMember(false);
        setUserRole(null);
      }
    } catch (error) {
      console.error('Failed to fetch group details:', error);
      Alert.alert('Error', 'Failed to load group details');
    }
  };

  const fetchGroupPrayers = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      }
      console.log('Fetching group prayers for groupId:', groupId);
      const prayers = await groupService.getGroupPrayers(groupId);
      console.log('Fetched prayers:', prayers);
      setGroupPrayers(prayers);
    } catch (error) {
      console.error('Failed to fetch group prayers:', error);
      Alert.alert('Error', 'Failed to load group prayers');
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      }
    }
  };

  const handleJoinGroup = async () => {
    try {
      await groupService.joinGroup(groupId);
      setIsMember(true);
      setUserRole('member');
      Alert.alert('Success', 'You have joined the group!');
    } catch (error) {
      console.error('Failed to join group:', error);
      Alert.alert('Error', 'Failed to join group');
    }
  };

  const handleLeaveGroup = async () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupService.leaveGroup(groupId);
              setIsMember(false);
              setUserRole(null);
              Alert.alert('Success', 'You have left the group');
            } catch (error) {
              console.error('Failed to leave group:', error);
              Alert.alert('Error', 'Failed to leave group');
            }
          },
        },
      ]
    );
  };

  const handleCreatePrayer = () => {
    navigation.navigate('CreatePrayer', { groupId });
  };

  const handlePrayerPress = (prayerId: string) => {
    navigation.navigate('PrayerDetails', { prayerId });
  };

  const handleGroupChatPress = () => {
    // Navigate to group chat - chat works independently of prayers
    // Use a placeholder prayerId for general group discussion
    const generalChatId = 'general-chat';
    navigation.navigate('GroupChat', { prayerId: generalChatId, groupId });
  };

  const handleMembersPress = () => {
    navigation.navigate('GroupMembers', { groupId });
  };

  const handleEditGroup = () => {
    navigation.navigate('EditGroup', { groupId });
  };

  const handleSettingsPress = () => {
    if (userRole === 'admin' || userRole === 'moderator') {
      setShowSettingsModal(true);
    } else {
      navigation.navigate('GroupSettings', { groupId });
    }
  };

  const renderPrayerItem = ({ item: prayer }: { item: Prayer }) => (
    <TouchableOpacity
      style={styles.prayerCard}
      onPress={() => handlePrayerPress(prayer.id)}
      activeOpacity={0.7}
    >
      <View style={styles.prayerHeader}>
        <TouchableOpacity style={styles.userInfo}>
          <UserAvatar
            avatarUrl={prayer.user?.avatar_url}
            size={40}
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {prayer.is_anonymous ? 'Anonymous' : prayer.user?.display_name || 'Unknown User'}
            </Text>
            <Text style={styles.timeAgo}>
              {formatDistanceToNow(new Date(prayer.created_at), { addSuffix: true })}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.prayerText} numberOfLines={3}>
        {prayer.text}
      </Text>

      <View style={styles.prayerStats}>
        <View style={styles.statItem}>
          <Ionicons name="heart" size={16} color="theme.colors.error[700]" />
          <Text style={styles.statText}>{prayer.interaction_count || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble" size={16} color="#6B7280" />
          <Text style={styles.statText}>{prayer.comment_count || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => {
    if (!group) return null;

    return (
      <View style={styles.header}>
        {/* Group Info */}
        <View style={styles.groupInfo}>
          <GroupAvatar
            avatarUrl={group.avatar_url}
            size={80}
            style={styles.groupAvatar}
          />
          <View style={styles.groupDetails}>
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.groupDescription}>{group.description}</Text>
            <View style={styles.groupMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="people" size={16} color="#6B7280" />
                <Text style={styles.metaText}>{group.member_count} members</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons
                  name={group.privacy === 'public' ? 'globe' : 'lock-closed'}
                  size={16}
                  color="#6B7280"
                />
                <Text style={styles.metaText}>
                  {group.privacy === 'public' ? 'Public' : 'Private'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!isMember ? (
            <TouchableOpacity style={styles.joinButton} onPress={handleJoinGroup}>
              <Ionicons name="person-add" size={20} color="#FFFFFF" />
              <Text style={styles.joinButtonText}>Join Group</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.primaryButton} onPress={handleCreatePrayer}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Share Prayer</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.secondaryButton} onPress={handleMembersPress}>
                <Ionicons name="people" size={20} color="#5B21B6" />
                <Text style={styles.secondaryButtonText}>Members</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.secondaryButton} onPress={handleGroupChatPress}>
                <Ionicons name="chatbubbles" size={20} color="#5B21B6" />
                <Text style={styles.secondaryButtonText}>Chat</Text>
              </TouchableOpacity>
              
              {userRole === 'admin' && (
                <TouchableOpacity style={styles.secondaryButton} onPress={handleEditGroup}>
                  <Ionicons name="create" size={20} color="#5B21B6" />
                  <Text style={styles.secondaryButtonText}>Edit</Text>
                </TouchableOpacity>
              )}
              
              {(userRole === 'admin' || userRole === 'moderator') && (
                <TouchableOpacity style={styles.secondaryButton} onPress={handleSettingsPress}>
                  <Ionicons name="settings" size={20} color="#5B21B6" />
                  <Text style={styles.secondaryButtonText}>Settings</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveGroup}>
                <Ionicons name="exit" size={20} color="theme.colors.error[700]" />
                <Text style={styles.leaveButtonText}>Leave</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Prayer Count */}
        <View style={styles.prayerCountContainer}>
          <Text style={styles.prayerCountText}>
            {groupPrayers.length} prayer{groupPrayers.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="heart-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>No prayers yet</Text>
      <Text style={styles.emptyStateText}>
        Be the first to share a prayer request in this group
      </Text>
      {isMember && (
        <TouchableOpacity style={styles.emptyStateButton} onPress={handleCreatePrayer}>
          <Text style={styles.emptyStateButtonText}>Share a Prayer</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={groupPrayers}
        renderItem={renderPrayerItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchGroupPrayers(true)}
            colors={['#5B21B6']}
            tintColor="#5B21B6"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />


      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Group Settings</Text>
            <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Group settings will be implemented here</Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  listContainer: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  groupInfo: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  groupAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  groupDetails: {
    flex: 1,
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  groupDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 12,
  },
  groupMeta: {
    flexDirection: 'row',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5B21B6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5B21B6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: '#5B21B6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  leaveButtonText: {
    color: 'theme.colors.error[700]',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  prayerCountContainer: {
    alignItems: 'center',
  },
  prayerCountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  prayerCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  prayerHeader: {
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  timeAgo: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  prayerText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
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
    fontSize: 14,
    color: '#6B7280',
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
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#5B21B6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default GroupDetailsScreen;
