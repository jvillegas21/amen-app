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
} from 'react-native';
import { ProfileStackScreenProps } from '@/types/navigation.types';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth/authStore';

interface UserStats {
  prayersCreated: number;
  prayersReceived: number;
  groupsJoined: number;
  followersCount: number;
  followingCount: number;
  savedPrayers: number;
}

/**
 * My Profile Screen - User profile with stats and quick actions
 */
const MyProfileScreen: React.FC<ProfileStackScreenProps<'MyProfile'>> = ({ navigation }) => {
  const { profile, signOut } = useAuthStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleEditProfile = () => {
    // Navigate to Settings and open Edit Profile modal
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
    // Navigate to Settings in the root stack
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
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#6B7280" />
        </View>
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Ionicons name="camera" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.profileInfo}>
        <Text style={styles.displayName}>{profile?.display_name || 'User'}</Text>
        <Text style={styles.bio}>{profile?.bio || 'No bio yet'}</Text>
        {profile?.location_city && (
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color="#6B7280" />
            <Text style={styles.location} numberOfLines={1} ellipsizeMode="tail">
              {profile.location_city}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <TouchableOpacity style={styles.statItem} onPress={handleViewPrayerHistory}>
        <Text style={styles.statNumber}>{stats?.prayersCreated || 0}</Text>
        <Text style={styles.statLabel}>Prayers Created</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.statItem} onPress={handleViewPrayerHistory}>
        <Text style={styles.statNumber}>{stats?.prayersReceived || 0}</Text>
        <Text style={styles.statLabel}>Prayers Received</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.statItem}>
        <Text style={styles.statNumber}>{stats?.groupsJoined || 0}</Text>
        <Text style={styles.statLabel}>Groups Joined</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSocialStats = () => (
    <View style={styles.socialStatsContainer}>
      <TouchableOpacity style={styles.socialStatItem} onPress={handleViewFollowers}>
        <Text style={styles.socialStatNumber}>{stats?.followersCount || 0}</Text>
        <Text style={styles.socialStatLabel}>Followers</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.socialStatItem} onPress={handleViewFollowing}>
        <Text style={styles.socialStatNumber}>{stats?.followingCount || 0}</Text>
        <Text style={styles.socialStatLabel}>Following</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.socialStatItem} onPress={handleViewSavedPrayers}>
        <Text style={styles.socialStatNumber}>{stats?.savedPrayers || 0}</Text>
        <Text style={styles.socialStatLabel}>Saved Prayers</Text>
      </TouchableOpacity>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity style={styles.quickAction} onPress={handleEditProfile}>
          <View style={styles.quickActionIcon}>
            <Ionicons name="create-outline" size={24} color="#5B21B6" />
          </View>
          <Text style={styles.quickActionText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAction} onPress={handleViewStatistics}>
          <View style={styles.quickActionIcon}>
            <Ionicons name="bar-chart-outline" size={24} color="theme.colors.success[700]" />
          </View>
          <Text style={styles.quickActionText}>Statistics</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAction} onPress={handleViewSavedPrayers}>
          <View style={styles.quickActionIcon}>
            <Ionicons name="bookmark-outline" size={24} color="theme.colors.warning[700]" />
          </View>
          <Text style={styles.quickActionText}>Saved Prayers</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAction} onPress={handleSettings}>
          <View style={styles.quickActionIcon}>
            <Ionicons name="settings-outline" size={24} color="#6B7280" />
          </View>
          <Text style={styles.quickActionText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAction} onPress={handleSignOut}>
          <View style={styles.quickActionIcon}>
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          </View>
          <Text style={[styles.quickActionText, { color: '#EF4444' }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderProfileHeader()}
        {renderStats()}
        {renderSocialStats()}
        {renderQuickActions()}
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
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#5B21B6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    alignItems: 'center',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  bio: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  location: {
    marginLeft: 4,
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    minWidth: 0,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingVertical: 20,
  },
  statItem: {
    flex: 1,
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
  },
  socialStatsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginTop: 1,
    paddingVertical: 20,
  },
  socialStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  socialStatNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#5B21B6',
    marginBottom: 4,
  },
  socialStatLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  quickActionsContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
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
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default MyProfileScreen;