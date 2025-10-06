import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileStackParamList } from '@/types/navigation.types';
import { theme } from '@/theme';
import { createStackScreenOptions, createHeaderAction } from './headerUtils';

// Profile Screen imports
import MyProfileScreen from '@/screens/profile/MyProfileScreen';
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
  const insets = useSafeAreaInsets();

  return (
    <Stack.Navigator
      initialRouteName="MyProfile"
      screenOptions={createStackScreenOptions(insets)}
    >
      <Stack.Screen
        name="MyProfile"
        component={MyProfileScreen}
        options={({ navigation }) => ({
          title: 'My Profile',
          headerRight: () => createHeaderAction(
            () => navigation.navigate('Statistics'),
            'analytics',
            'Statistics',
            'View prayer statistics'
          ),
        })}
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