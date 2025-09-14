import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ProfileStackParamList } from '@/types/navigation.types';

// Profile Screen imports
import MyProfileScreen from '@/screens/profile/MyProfileScreen';
import EditProfileScreen from '@/screens/profile/EditProfileScreen';
import SavedPrayersScreen from '@/screens/profile/SavedPrayersScreen';
import PrayerHistoryScreen from '@/screens/profile/PrayerHistoryScreen';
import FollowingScreen from '@/screens/profile/FollowingScreen';
import FollowersScreen from '@/screens/profile/FollowersScreen';
import StatisticsScreen from '@/screens/profile/StatisticsScreen';

const Stack = createStackNavigator<ProfileStackParamList>();

/**
 * Profile Navigator - Manages user profile navigation
 */
const ProfileNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="MyProfile"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#5B21B6',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="MyProfile"
        component={MyProfileScreen}
        options={{ title: 'My Profile' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <Stack.Screen
        name="SavedPrayers"
        component={SavedPrayersScreen}
        options={{ title: 'Saved Prayers' }}
      />
      <Stack.Screen
        name="PrayerHistory"
        component={PrayerHistoryScreen}
        options={{ title: 'Prayer History' }}
      />
      <Stack.Screen
        name="Following"
        component={FollowingScreen}
        options={{ title: 'Following' }}
      />
      <Stack.Screen
        name="Followers"
        component={FollowersScreen}
        options={{ title: 'Followers' }}
      />
      <Stack.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{ title: 'Statistics' }}
      />
    </Stack.Navigator>
  );
};

export default ProfileNavigator;