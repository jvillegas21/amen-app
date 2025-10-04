import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { GroupsStackScreenProps } from '@/types/navigation.types';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth/authStore';
import { Group } from '@/types/database.types';
import { groupService } from '@/services/api/groupService';

/**
 * Groups List Screen - Main groups hub with My Groups and Discover tabs
 */
const GroupsListScreen: React.FC<GroupsStackScreenProps<'GroupsList'>> = ({ navigation }) => {
  const { profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'my_groups' | 'discover'>('my_groups');
  const [isLoading, setIsLoading] = useState(true);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [discoverGroups, setDiscoverGroups] = useState<Group[]>([]);

  useEffect(() => {
    fetchGroupsData();
  }, []);

  const fetchGroupsData = async () => {
    try {
      setIsLoading(true);
      if (!profile?.id) return;

      // Fetch user's joined groups for "My Groups" tab
      const userGroups = await groupService.getUserGroups(profile.id);
      setMyGroups(userGroups);

      // Fetch trending groups for "Discover" tab
      const trendingGroups = await groupService.getTrendingGroups(20, profile.id);
      setDiscoverGroups(trendingGroups);
    } catch (error) {
      console.error('Failed to fetch groups data:', error);
    } finally {
      setIsLoading(false);
    }
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

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'my_groups' && styles.activeTab]}
        onPress={() => setActiveTab('my_groups')}
      >
        <Text style={[styles.tabText, activeTab === 'my_groups' && styles.activeTabText]}>
          My Groups
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'discover' && styles.activeTab]}
        onPress={() => setActiveTab('discover')}
      >
        <Text style={[styles.tabText, activeTab === 'discover' && styles.activeTabText]}>
          Discover
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderGroupItem = React.useCallback(({ item }: { item: Group }) => (
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
              color="#6B7280"
            />
          </View>
        </View>

        <Text style={styles.groupDescription} numberOfLines={2}>
          {item.description || 'No description available'}
        </Text>

        <View style={styles.groupMeta}>
          <View style={styles.groupStats}>
            <Ionicons name="people" size={14} color="#6B7280" />
            <Text style={styles.groupStatsText}>{item.member_count} members</Text>
          </View>
          {item.isJoined && (
            <View style={styles.joinedBadge}>
              <Text style={styles.joinedBadgeText}>Joined</Text>
            </View>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  ), []);

  const renderEmptyState = () => {
    const isMyGroups = activeTab === 'my_groups';
    return (
      <View style={styles.emptyStateContainer}>
        <Ionicons name="people-outline" size={64} color="#D1D5DB" />
        <Text style={styles.emptyStateTitle}>
          {isMyGroups ? 'No Groups Yet' : 'No Groups Found'}
        </Text>
        <Text style={styles.emptyStateText}>
          {isMyGroups
            ? 'Join groups to connect with prayer communities or create your own'
            : 'Check back later for new groups to discover'}
        </Text>
        {isMyGroups && (
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => setActiveTab('discover')}
          >
            <Text style={styles.emptyStateButtonText}>Discover Groups</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const currentGroups = activeTab === 'my_groups' ? myGroups : discoverGroups;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        {renderTabBar()}
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
      {renderTabBar()}
      <FlatList
        data={currentGroups}
        keyExtractor={(item) => item.id}
        renderItem={renderGroupItem}
        contentContainerStyle={currentGroups.length === 0 ? styles.emptyListContainer : styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#5B21B6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#5B21B6',
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 16,
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
});

export default GroupsListScreen;