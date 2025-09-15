import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { GroupsStackScreenProps } from '@/types/navigation.types';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth/authStore';
import { Group } from '@/types/database.types';
import { groupService } from '@/services/api/groupService';

/**
 * Groups List Screen - Main groups hub with navigation to MyGroups and DiscoverGroups
 */
const GroupsListScreen: React.FC<GroupsStackScreenProps<'GroupsList'>> = ({ navigation }) => {
  const { profile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [recentGroups, setRecentGroups] = useState<Group[]>([]);

  useEffect(() => {
    fetchGroupsData();
  }, []);

  const fetchGroupsData = async () => {
    try {
      setIsLoading(true);
      if (!profile?.id) return;

      // Fetch user's joined groups
      const userGroups = await groupService.getUserGroups(profile.id);
      
      // Fetch trending groups to show as suggestions
      const trendingGroups = await groupService.getTrendingGroups(5, profile.id);
      
      // Combine user groups with trending groups, removing duplicates
      const allGroups = [...userGroups];
      trendingGroups.forEach(trending => {
        if (!userGroups.find(userGroup => userGroup.id === trending.id)) {
          allGroups.push(trending);
        }
      });

      setRecentGroups(allGroups.slice(0, 6)); // Show up to 6 groups
    } catch (error) {
      console.error('Failed to fetch groups data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMyGroups = () => {
    navigation.navigate('MyGroups');
  };

  const handleDiscoverGroups = () => {
    navigation.navigate('DiscoverGroups');
  };

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };

  const handleGroupPress = (groupId: string) => {
    navigation.navigate('GroupDetails', { groupId });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Groups</Text>
      <Text style={styles.headerSubtitle}>
        Connect with prayer communities
      </Text>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <TouchableOpacity
        style={styles.quickAction}
        onPress={handleMyGroups}
        activeOpacity={0.7}
      >
        <View style={styles.quickActionIcon}>
          <Ionicons name="people" size={24} color="#5B21B6" />
        </View>
        <Text style={styles.quickActionText}>My Groups</Text>
        <Text style={styles.quickActionSubtext}>View joined groups</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.quickAction}
        onPress={handleDiscoverGroups}
        activeOpacity={0.7}
      >
        <View style={styles.quickActionIcon}>
          <Ionicons name="search" size={24} color="theme.colors.success[700]" />
        </View>
        <Text style={styles.quickActionText}>Discover</Text>
        <Text style={styles.quickActionSubtext}>Find new groups</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.quickAction}
        onPress={handleCreateGroup}
        activeOpacity={0.7}
      >
        <View style={styles.quickActionIcon}>
          <Ionicons name="add-circle" size={24} color="theme.colors.warning[700]" />
        </View>
        <Text style={styles.quickActionText}>Create</Text>
        <Text style={styles.quickActionSubtext}>Start new group</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRecentGroups = () => (
    <View style={styles.recentGroupsContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Groups</Text>
        <TouchableOpacity onPress={handleMyGroups}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      
      {recentGroups.map((group) => (
        <TouchableOpacity
          key={group.id}
          style={styles.groupItem}
          onPress={() => handleGroupPress(group.id)}
          activeOpacity={0.7}
        >
          <View style={styles.groupAvatar}>
            <Ionicons name="people" size={24} color="#6B7280" />
          </View>
          
          <View style={styles.groupContent}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupName}>{group.name}</Text>
              <View style={styles.groupPrivacy}>
                <Ionicons
                  name={group.privacy === 'public' ? 'globe' : 'lock-closed'}
                  size={14}
                  color="#6B7280"
                />
              </View>
            </View>
            
            <Text style={styles.groupDescription} numberOfLines={2}>
              {group.description || 'No description available'}
            </Text>
            
            <View style={styles.groupMeta}>
              <View style={styles.groupStats}>
                <Ionicons name="people" size={14} color="#6B7280" />
                <Text style={styles.groupStatsText}>{group.member_count} members</Text>
              </View>
              {group.isJoined && (
                <View style={styles.joinedBadge}>
                  <Text style={styles.joinedBadgeText}>Joined</Text>
                </View>
              )}
            </View>
          </View>
          
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="people-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>No Groups Yet</Text>
      <Text style={styles.emptyStateText}>
        Join groups to connect with prayer communities or create your own
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={handleDiscoverGroups}
      >
        <Text style={styles.emptyStateButtonText}>Discover Groups</Text>
      </TouchableOpacity>
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderHeader()}
        {renderQuickActions()}
        {recentGroups.length > 0 ? renderRecentGroups() : renderEmptyState()}
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
  scrollView: {
    flex: 1,
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
  quickActionsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  quickActionSubtext: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  recentGroupsContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 14,
    color: '#5B21B6',
    fontWeight: '500',
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
  joinedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  joinedBadgeText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
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
  bottomSpacing: {
    height: 20,
  },
});

export default GroupsListScreen;