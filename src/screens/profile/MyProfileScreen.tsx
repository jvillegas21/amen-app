import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { ProfileStackScreenProps } from '@/types/navigation.types';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth/authStore';
import { formatDistanceToNow } from 'date-fns';

interface UserStats {
  prayersCreated: number;
  prayersReceived: number;
  groupsJoined: number;
  followersCount: number;
  followingCount: number;
  savedPrayers: number;
}

/**
 * My Profile Screen - Streamlined user profile with clear hierarchy and intuitive actions
 */
const MyProfileScreen: React.FC<ProfileStackScreenProps<'MyProfile'>> = ({ navigation }) => {
  const { profile, signOut } = useAuthStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement real API calls
      const mockStats: UserStats = {
        prayersCreated: 24,
        prayersReceived: 156,
        groupsJoined: 5,
        followersCount: 89,
        followingCount: 67,
        savedPrayers: 12,
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProfileData();
    setIsRefreshing(false);
  };

  const handleEditProfile = () => {
    navigation.getParent()?.navigate('Settings');
  };

  const handleViewFollowers = () => {
    navigation.navigate('Followers');
  };

  const handleViewFollowing = () => {
    navigation.navigate('Following');
  };

  const handleViewSavedPrayers = () => {
    navigation.navigate('SavedPrayers');
  };

  const handleViewPrayerHistory = () => {
    navigation.navigate('PrayerHistory');
  };

  const handleViewStatistics = () => {
    navigation.navigate('Statistics');
  };

  const handleSettings = () => {
    navigation.getParent()?.navigate('Settings');
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

  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      <View style={styles.avatarSection}>
        <View style={styles.avatarContainer}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#6B7280" />
            </View>
          )}
          <TouchableOpacity style={styles.editAvatarButton} onPress={handleEditProfile}>
            <Ionicons name="camera" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.displayName}>{profile?.display_name || 'User'}</Text>
          {profile?.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : (
            <TouchableOpacity onPress={handleEditProfile} style={styles.addBioButton}>
              <Ionicons name="add-circle-outline" size={16} color="#5B21B6" />
              <Text style={styles.addBioText}>Add a bio</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.profileMeta}>
            {profile?.location_city && (
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={16} color="#6B7280" />
                <Text style={styles.location} numberOfLines={1} ellipsizeMode="tail">
                  {profile.location_city}
                </Text>
              </View>
            )}
            <Text style={styles.joinedDate}>
              Joined {formatDistanceToNow(new Date(profile?.created_at || new Date()), { addSuffix: true })}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsCard}>
      <View style={styles.statsRow}>
        <TouchableOpacity style={styles.statItem} onPress={handleViewPrayerHistory}>
          <Text style={styles.statNumber}>{stats?.prayersCreated || 0}</Text>
          <Text style={styles.statLabel}>Prayers</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.statItem} onPress={handleViewFollowers}>
          <Text style={styles.statNumber}>{stats?.followersCount || 0}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.statItem} onPress={handleViewFollowing}>
          <Text style={styles.statNumber}>{stats?.followingCount || 0}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.statItem}>
          <Text style={styles.statNumber}>{stats?.groupsJoined || 0}</Text>
          <Text style={styles.statLabel}>Groups</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderActionButtons = () => (
    <View style={styles.actionButtonsContainer}>
      <TouchableOpacity style={styles.primaryButton} onPress={handleEditProfile}>
        <Ionicons name="create-outline" size={20} color="#FFFFFF" />
        <Text style={styles.primaryButtonText}>Edit Profile</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.secondaryButton} onPress={handleSettings}>
        <Ionicons name="settings-outline" size={20} color="#5B21B6" />
        <Text style={styles.secondaryButtonText}>Settings</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMenuItems = () => {
    const menuItems = [
      {
        icon: 'bookmark-outline',
        title: 'Saved Prayers',
        subtitle: `${stats?.savedPrayers || 0} prayers saved`,
        onPress: handleViewSavedPrayers,
        color: '#F59E0B',
      },
      {
        icon: 'time-outline',
        title: 'Prayer History',
        subtitle: 'Your prayer journey',
        onPress: handleViewPrayerHistory,
        color: '#10B981',
      },
      {
        icon: 'bar-chart-outline',
        title: 'Statistics',
        subtitle: 'Activity insights',
        onPress: handleViewStatistics,
        color: '#8B5CF6',
      },
      {
        icon: 'help-circle-outline',
        title: 'Help & Support',
        subtitle: 'Get help and contact us',
        onPress: () => navigation.getParent()?.navigate('Support'),
        color: '#3B82F6',
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
              <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#5B21B6']}
            tintColor="#5B21B6"
          />
        }
      >
        {renderProfileHeader()}
        {renderStats()}
        {renderActionButtons()}
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
  
  // Profile Header
  profileHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#5B21B6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  addBioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addBioText: {
    fontSize: 16,
    color: '#5B21B6',
    marginLeft: 4,
    fontWeight: '500',
  },
  profileMeta: {
    gap: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    marginLeft: 4,
    fontSize: 14,
    color: '#6B7280',
  },
  joinedDate: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  
  // Stats Card
  statsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  
  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5B21B6',
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#5B21B6',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Menu Items
  menuContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
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
  
  // Sign Out Button
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 20,
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

export default MyProfileScreen;