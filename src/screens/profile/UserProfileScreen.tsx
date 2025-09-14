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
import { ProfileStackScreenProps } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

interface UserStats {
  prayers_posted: number;
  prayers_received: number;
  groups_joined: number;
  followers_count: number;
  following_count: number;
  joined_date: string;
}

interface UserProfile {
  id: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  is_verified: boolean;
  is_following: boolean;
  is_follower: boolean;
  stats: UserStats;
}

/**
 * User Profile Screen - View user profile with statistics and management
 * Based on user_profile mockups
 */
const UserProfileScreen: React.FC<ProfileStackScreenProps<'MyProfile'>> = ({ navigation }) => {
  const { profile, signOut } = useAuthStore();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement user profile fetch from API
      // For now, using mock data
      const mockProfile: UserProfile = {
        id: profile?.id || 'current_user',
        display_name: profile?.display_name || 'John Doe',
        bio: 'Believer in Christ, sharing prayers and encouragement with the community. 🙏',
        avatar_url: profile?.avatar_url || 'https://via.placeholder.com/120',
        location: 'Chicago, IL',
        is_verified: true,
        is_following: false,
        is_follower: false,
        stats: {
          prayers_posted: 24,
          prayers_received: 156,
          groups_joined: 5,
          followers_count: 89,
          following_count: 42,
          joined_date: '2023-01-15T00:00:00Z',
        },
      };
      setUserProfile(mockProfile);
      setIsFollowing(mockProfile.is_following);
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchUserProfile();
    setIsRefreshing(false);
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleFollowToggle = async () => {
    try {
      // TODO: Implement follow/unfollow API call
      setIsFollowing(!isFollowing);
      if (userProfile) {
        setUserProfile(prev => prev ? {
          ...prev,
          stats: {
            ...prev.stats,
            followers_count: prev.stats.followers_count + (isFollowing ? -1 : 1)
          }
        } : null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const handleViewFollowers = () => {
    navigation.navigate('Followers');
  };

  const handleViewFollowing = () => {
    navigation.navigate('Following');
  };

  const handleViewPrayerHistory = () => {
    navigation.navigate('PrayerHistory');
  };

  const handleViewSavedPrayers = () => {
    navigation.navigate('SavedPrayers');
  };

  const handleViewStatistics = () => {
    navigation.navigate('Statistics');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const renderStatsCard = () => {
    if (!userProfile) return null;

    return (
      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statItem} onPress={handleViewPrayerHistory}>
            <Text style={styles.statNumber}>{userProfile.stats.prayers_posted}</Text>
            <Text style={styles.statLabel}>Prayers Posted</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem} onPress={handleViewPrayerHistory}>
            <Text style={styles.statNumber}>{userProfile.stats.prayers_received}</Text>
            <Text style={styles.statLabel}>Prayers Received</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>{userProfile.stats.groups_joined}</Text>
            <Text style={styles.statLabel}>Groups</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.followStatsRow}>
          <TouchableOpacity style={styles.followStatItem} onPress={handleViewFollowers}>
            <Text style={styles.followStatNumber}>{userProfile.stats.followers_count}</Text>
            <Text style={styles.followStatLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.followStatItem} onPress={handleViewFollowing}>
            <Text style={styles.followStatNumber}>{userProfile.stats.following_count}</Text>
            <Text style={styles.followStatLabel}>Following</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderActionButtons = () => {
    if (!userProfile) return null;

    return (
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Ionicons name="create-outline" size={20} color="#5B21B6" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={20} color="#6B7280" />
          <Text style={styles.settingsButtonText}>Settings</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMenuItems = () => {
    const menuItems = [
      {
        icon: 'bookmark-outline',
        title: 'Saved Prayers',
        subtitle: 'Prayers you\'ve saved',
        onPress: handleViewSavedPrayers,
      },
      {
        icon: 'time-outline',
        title: 'Prayer History',
        subtitle: 'Your prayer journey',
        onPress: handleViewPrayerHistory,
      },
      {
        icon: 'bar-chart-outline',
        title: 'Statistics',
        subtitle: 'Your activity insights',
        onPress: handleViewStatistics,
      },
      {
        icon: 'help-circle-outline',
        title: 'Help & Support',
        subtitle: 'Get help and contact us',
        onPress: () => navigation.navigate('Support'),
      },
      {
        icon: 'information-circle-outline',
        title: 'About',
        subtitle: 'App version and info',
        onPress: () => navigation.navigate('About'),
      },
    ];

    return (
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconContainer}>
                <Ionicons name={item.icon as any} size={24} color="#5B21B6" />
              </View>
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={64} color="#D1D5DB" />
          <Text style={styles.errorTitle}>Profile Not Found</Text>
          <Text style={styles.errorText}>Unable to load your profile</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchUserProfile}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileInfo}>
            <Image
              source={{ uri: userProfile.avatar_url || 'https://via.placeholder.com/120' }}
              style={styles.avatar}
            />
            <View style={styles.profileDetails}>
              <View style={styles.nameContainer}>
                <Text style={styles.displayName}>{userProfile.display_name}</Text>
                {userProfile.is_verified && (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                )}
              </View>
              {userProfile.bio && (
                <Text style={styles.bio}>{userProfile.bio}</Text>
              )}
              {userProfile.location && (
                <View style={styles.locationContainer}>
                  <Ionicons name="location-outline" size={16} color="#6B7280" />
                  <Text style={styles.location}>{userProfile.location}</Text>
                </View>
              )}
              <Text style={styles.joinedDate}>
                Joined {formatDistanceToNow(new Date(userProfile.stats.joined_date), { addSuffix: true })}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Card */}
        {renderStatsCard()}

        {/* Action Buttons */}
        {renderActionButtons()}

        {/* Menu Items */}
        {renderMenuItems()}

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>

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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#5B21B6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  profileInfo: {
    flexDirection: 'row',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginRight: 16,
  },
  profileDetails: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginRight: 8,
  },
  bio: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  joinedDate: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  followStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  followStatItem: {
    alignItems: 'center',
  },
  followStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5B21B6',
    marginBottom: 4,
  },
  followStatLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5B21B6',
    paddingVertical: 12,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  settingsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
  },
  settingsButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  signOutButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default UserProfileScreen;
