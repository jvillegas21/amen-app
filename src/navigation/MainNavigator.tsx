import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '@/types/navigation.types';
import { theme } from '@/theme';

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
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Discover':
              iconName = focused ? 'compass' : 'compass-outline';
              break;
            case 'Create':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'Groups':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'alert-circle-outline';
          }

          return <Ionicons
            name={iconName}
            size={size}
            color={color}
            accessibilityLabel={`${route.name} tab`}
          />;
        },
        tabBarActiveTintColor: theme.colors.primary[600],
        tabBarInactiveTintColor: theme.colors.neutral[500],
        tabBarStyle: {
          backgroundColor: theme.colors.background.primary,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border.primary,
          paddingBottom: theme.spacing[1],
          paddingTop: theme.spacing[1],
          height: theme.layout.tabBarHeight,
        },
        tabBarLabelStyle: {
          ...theme.typography.tabBar.active,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary[600],
        },
        headerTintColor: theme.colors.text.inverse,
        headerTitleStyle: {
          ...theme.typography.navigation.title,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          title: 'Amen',
          headerShown: true,
          tabBarLabel: 'Home',
          tabBarAccessibilityLabel: 'Home, tab 1 of 4',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.getParent()?.navigate('Search')}
              style={{ marginRight: theme.spacing[4] }}
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
        options={{
          title: 'Discover',
          headerShown: true,
          tabBarLabel: 'Discover',
          tabBarAccessibilityLabel: 'Discover, tab 2 of 4',
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreateScreen}
        options={{
          title: 'Create',
          headerShown: true,
          tabBarLabel: '',
          tabBarAccessibilityLabel: 'Create content',
        }}
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