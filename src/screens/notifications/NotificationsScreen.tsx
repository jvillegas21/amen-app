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
} from 'react-native';
import { MainTabScreenProps } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'prayer_response' | 'new_follower' | 'group_invite' | 'prayer_reminder' | 'system' | 'comment' | 'group_update';
  title: string;
  message: string;
  user_id?: string;
  user_display_name?: string;
  user_avatar_url?: string;
  prayer_id?: string;
  group_id?: string;
  is_read: boolean;
  created_at: string;
  action_data?: any;
}

/**
 * Notifications Screen - Manage and view all notifications
 * Based on notifications mockups
 */
const NotificationsScreen: React.FC<MainTabScreenProps<'Notifications'>> = ({ navigation }) => {
  const { profile } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'prayers' | 'social' | 'system'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement notifications fetch from API
      // For now, using mock data
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'prayer_response',
          title: 'Someone prayed for your request',
          message: 'Sarah Johnson prayed for your job interview request',
          user_id: 'user2',
          user_display_name: 'Sarah Johnson',
          user_avatar_url: 'https://via.placeholder.com/40',
          prayer_id: 'prayer1',
          is_read: false,
          created_at: new Date(Date.now() - 300000).toISOString(),
        },
        {
          id: '2',
          type: 'new_follower',
          title: 'New follower',
          message: 'Mike Wilson started following you',
          user_id: 'user3',
          user_display_name: 'Mike Wilson',
          user_avatar_url: 'https://via.placeholder.com/40',
          is_read: false,
          created_at: new Date(Date.now() - 900000).toISOString(),
        },
        {
          id: '3',
          type: 'comment',
          title: 'New comment on your prayer',
          message: 'Emily Chen commented on your prayer request',
          user_id: 'user4',
          user_display_name: 'Emily Chen',
          user_avatar_url: 'https://via.placeholder.com/40',
          prayer_id: 'prayer2',
          is_read: true,
          created_at: new Date(Date.now() - 1800000).toISOString(),
        },
        {
          id: '4',
          type: 'group_invite',
          title: 'Group invitation',
          message: 'You\'ve been invited to join "Prayer Warriors" group',
          group_id: 'group1',
          is_read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '5',
          type: 'prayer_reminder',
          title: 'Daily prayer reminder',
          message: 'Don\'t forget to share your prayers and support others today',
          is_read: true,
          created_at: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: '6',
          type: 'group_update',
          title: 'Group activity',
          message: 'New prayer request posted in "Prayer Warriors" group',
          group_id: 'group1',
          is_read: true,
          created_at: new Date(Date.now() - 10800000).toISOString(),
        },
        {
          id: '7',
          type: 'system',
          title: 'App update available',
          message: 'A new version of Amenity is available with exciting features',
          is_read: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
      setNotifications(mockNotifications);
    } catch (error) {
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    setIsRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      // TODO: Implement mark as read API call
      setNotifications(prev => prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, is_read: true }
          : notification
      ));
    } catch (error) {
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // TODO: Implement mark all as read API call
      setNotifications(prev => prev.map(notification => ({
        ...notification,
        is_read: true,
      })));
    } catch (error) {
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'prayer_response':
      case 'comment':
        if (notification.prayer_id) {
          navigation.navigate('PrayerDetails', { prayerId: notification.prayer_id });
        }
        break;
      case 'new_follower':
        if (notification.user_id) {
          navigation.navigate('UserProfile', { userId: notification.user_id });
        }
        break;
      case 'group_invite':
      case 'group_update':
        if (notification.group_id) {
          navigation.navigate('GroupDetails', { groupId: notification.group_id });
        }
        break;
      default:
        // For system notifications, do nothing or show details
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'prayer_response': return 'heart';
      case 'new_follower': return 'person-add';
      case 'comment': return 'chatbubble';
      case 'group_invite': return 'people';
      case 'group_update': return 'people-circle';
      case 'prayer_reminder': return 'time';
      case 'system': return 'information-circle';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'prayer_response': return '#EF4444';
      case 'new_follower': return '#10B981';
      case 'comment': return '#3B82F6';
      case 'group_invite': return '#8B5CF6';
      case 'group_update': return '#F59E0B';
      case 'prayer_reminder': return '#5B21B6';
      case 'system': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;

    switch (filter) {
      case 'unread':
        filtered = notifications.filter(n => !n.is_read);
        break;
      case 'prayers':
        filtered = notifications.filter(n => ['prayer_response', 'comment', 'prayer_reminder'].includes(n.type));
        break;
      case 'social':
        filtered = notifications.filter(n => ['new_follower', 'group_invite', 'group_update'].includes(n.type));
        break;
      case 'system':
        filtered = notifications.filter(n => n.type === 'system');
        break;
    }

    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const renderFilterTabs = () => {
    const filters = [
      { key: 'all', label: 'All', count: notifications.length },
      { key: 'unread', label: 'Unread', count: notifications.filter(n => !n.is_read).length },
      { key: 'prayers', label: 'Prayers', count: notifications.filter(n => ['prayer_response', 'comment', 'prayer_reminder'].includes(n.type)).length },
      { key: 'social', label: 'Social', count: notifications.filter(n => ['new_follower', 'group_invite', 'group_update'].includes(n.type)).length },
      { key: 'system', label: 'System', count: notifications.filter(n => n.type === 'system').length },
    ];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterTabs}
        contentContainerStyle={styles.filterTabsContent}
      >
        {filters.map((filterItem) => (
          <TouchableOpacity
            key={filterItem.key}
            style={[
              styles.filterTab,
              filter === filterItem.key && styles.filterTabActive
            ]}
            onPress={() => setFilter(filterItem.key as any)}
          >
            <Text style={[
              styles.filterTabText,
              filter === filterItem.key && styles.filterTabTextActive
            ]}>
              {filterItem.label}
            </Text>
            {filterItem.count > 0 && (
              <View style={[
                styles.filterTabBadge,
                filter === filterItem.key && styles.filterTabBadgeActive
              ]}>
                <Text style={[
                  styles.filterTabBadgeText,
                  filter === filterItem.key && styles.filterTabBadgeTextActive
                ]}>
                  {filterItem.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderNotificationItem = (notification: Notification) => (
    <TouchableOpacity
      key={notification.id}
      style={[
        styles.notificationItem,
        !notification.is_read && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(notification)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={[
          styles.notificationIcon,
          { backgroundColor: `${getNotificationColor(notification.type)}15` }
        ]}>
          <Ionicons
            name={getNotificationIcon(notification.type) as any}
            size={20}
            color={getNotificationColor(notification.type)}
          />
        </View>
        
        <View style={styles.notificationText}>
          <Text style={[
            styles.notificationTitle,
            !notification.is_read && styles.unreadText
          ]}>
            {notification.title}
          </Text>
          <Text style={styles.notificationMessage}>
            {notification.message}
          </Text>
          <Text style={styles.notificationTime}>
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </Text>
        </View>
        
        {notification.user_avatar_url && (
          <Image
            source={{ uri: notification.user_avatar_url }}
            style={styles.userAvatar}
          />
        )}
        
        {!notification.is_read && (
          <View style={styles.unreadDot} />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    const emptyMessages = {
      all: 'No notifications yet',
      unread: 'No unread notifications',
      prayers: 'No prayer-related notifications',
      social: 'No social notifications',
      system: 'No system notifications',
    };

    return (
      <View style={styles.emptyState}>
        <Ionicons name="notifications-outline" size={64} color="#D1D5DB" />
        <Text style={styles.emptyStateTitle}>{emptyMessages[filter]}</Text>
        <Text style={styles.emptyStateText}>
          {filter === 'all' 
            ? 'You\'ll see notifications about prayers, followers, and app updates here.'
            : 'New notifications will appear here when they arrive.'
          }
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Notifications</Text>
      {notifications.some(n => !n.is_read) && (
        <TouchableOpacity onPress={handleMarkAllAsRead}>
          <Text style={styles.markAllButton}>Mark all read</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredNotifications = getFilteredNotifications();

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderFilterTabs()}
      
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
        {filteredNotifications.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.notificationsList}>
            {filteredNotifications.map(renderNotificationItem)}
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  markAllButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5B21B6',
  },
  filterTabs: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterTabActive: {
    backgroundColor: '#5B21B6',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  filterTabBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    minWidth: 20,
    alignItems: 'center',
  },
  filterTabBadgeActive: {
    backgroundColor: '#FFFFFF',
  },
  filterTabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTabBadgeTextActive: {
    color: '#5B21B6',
  },
  scrollView: {
    flex: 1,
  },
  notificationsList: {
    paddingTop: 8,
  },
  notificationItem: {
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
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#5B21B6',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: '700',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5B21B6',
    marginLeft: 8,
    marginTop: 4,
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

export default NotificationsScreen;
