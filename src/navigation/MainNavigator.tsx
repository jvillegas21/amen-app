import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from '@/types/navigation.types';
import { theme } from '@/theme';
import CustomTabBar from '@/components/navigation/CustomTabBar';
import { createTabScreenOptions } from './headerUtils';

// Tab Screen imports
import HomeScreen from '@/screens/main/HomeScreen';
import DiscoverScreen from '@/screens/main/DiscoverScreen';
import GroupsNavigator from './GroupsNavigator';
import CreateScreen from '@/screens/main/CreateScreen';
import ProfileNavigator from './ProfileNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Main Tab Navigator - Primary app navigation after authentication
 * Implements Interface Segregation: Each tab has its own focused interface
 */
const MainNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={createTabScreenOptions(insets)}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          title: 'Amenity',
          headerShown: true,
          tabBarLabel: 'Home',
          tabBarAccessibilityLabel: 'Home, tab 1 of 4',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.getParent()?.navigate('Search')}
              style={{
                padding: theme.spacing[2],
                marginRight: theme.spacing[1],
              }}
              accessibilityLabel="Search"
              accessibilityRole="button"
              accessibilityHint="Search prayers, people, and groups"
            >
              <Ionicons
                name="search"
                size={24}
                color={theme.colors.text.inverse}
              />
            </TouchableOpacity>
          ),
        })}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={({ navigation }) => ({
          title: 'Discover',
          headerShown: true,
          tabBarLabel: 'Discover',
          tabBarAccessibilityLabel: 'Discover, tab 2 of 4',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.getParent()?.navigate('Search')}
              style={{
                padding: theme.spacing[2],
                marginRight: theme.spacing[1],
              }}
              accessibilityLabel="Search"
              accessibilityRole="button"
              accessibilityHint="Search content and users"
            >
              <Ionicons
                name="search"
                size={24}
                color={theme.colors.text.inverse}
              />
            </TouchableOpacity>
          ),
        })}
      />
      <Tab.Screen
        name="Create"
        component={CreateScreen}
        options={({ navigation }) => ({
          title: 'Create',
          headerShown: true,
          tabBarButton: () => null, // Hide the default tab button since we use floating button
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                padding: theme.spacing[2],
                marginRight: theme.spacing[1],
              }}
              accessibilityLabel="Close"
              accessibilityRole="button"
              accessibilityHint="Close create screen"
            >
              <Ionicons
                name="close"
                size={24}
                color={theme.colors.text.inverse}
              />
            </TouchableOpacity>
          ),
        })}
      />
      <Tab.Screen
        name="Groups"
        component={GroupsNavigator}
        options={{
          title: 'Groups',
          headerShown: false, // Groups has its own navigation header
          tabBarLabel: 'Groups',
          tabBarAccessibilityLabel: 'Groups, tab 3 of 4',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          title: 'Profile',
          headerShown: false, // Profile has its own navigation header
          tabBarLabel: 'Profile',
          tabBarAccessibilityLabel: 'Profile, tab 4 of 4',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;