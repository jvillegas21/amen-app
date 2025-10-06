import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainStackParamList, MainTabParamList } from '@/types/navigation.types';
import { theme } from '@/theme';
import CustomTabBar from '@/components/navigation/CustomTabBar';
import { createTabScreenOptions, createStackScreenOptions, createColoredHeaderOptions, createHeaderAction } from './headerUtils';

// Tab Screen imports
import HomeScreen from '@/screens/main/HomeScreen';
import DiscoverScreen from '@/screens/main/DiscoverScreen';
import GroupsNavigator from './GroupsNavigator';
import CreateScreen from '@/screens/main/CreateScreen';
import ProfileNavigator from './ProfileNavigator';

// Stack Screen imports
import SearchScreen from '@/screens/main/SearchScreen';
import PrayerDetailsScreen from '@/screens/prayer/PrayerDetailsScreen';
import CreatePrayerScreen from '@/screens/prayer/CreatePrayerScreen';
import EditPrayerScreen from '@/screens/prayer/EditPrayerScreen';
import CreateBibleStudyScreen from '@/screens/main/CreateBibleStudyScreen';
import AIStudyAssistantScreen from '@/screens/main/AIStudyAssistantScreen';
import CreateEventScreen from '@/screens/main/CreateEventScreen';
import UserProfileScreen from '@/screens/profile/UserProfileScreen';
import SavedPrayersScreen from '@/screens/profile/SavedPrayersScreen';
import PrayerHistoryScreen from '@/screens/profile/PrayerHistoryScreen';
import FollowingScreen from '@/screens/profile/FollowingScreen';
import FollowersScreen from '@/screens/profile/FollowersScreen';
import StatisticsScreen from '@/screens/profile/StatisticsScreen';
import GroupDetailsScreen from '@/screens/groups/GroupDetailsScreen';
import CreateGroupScreen from '@/screens/groups/CreateGroupScreen';
import EditGroupScreen from '@/screens/groups/EditGroupScreen';
import MyGroupsScreen from '@/screens/groups/MyGroupsScreen';
import DiscoverGroupsScreen from '@/screens/groups/DiscoverGroupsScreen';
import GroupChatScreen from '@/screens/groups/GroupChatScreen';
import GroupMembersScreen from '@/screens/groups/GroupMembersScreen';
import GroupSettingsScreen from '@/screens/groups/GroupSettingsScreen';
import BibleStudyScreen from '@/screens/main/BibleStudyScreen';
import BibleStudyDetailsScreen from '@/screens/main/BibleStudyDetailsScreen';
import BibleStudyListScreen from '@/screens/main/BibleStudyListScreen';
import CategoryPrayersScreen from '@/screens/main/CategoryPrayersScreen';
import SettingsScreen from '@/screens/settings/SettingsScreen';
import PrivacyScreen from '@/screens/settings/PrivacyScreen';
import NotificationsScreen from '@/screens/settings/NotificationsScreen';
import SupportScreen from '@/screens/settings/SupportScreen';
import CreateTicketScreen from '@/screens/settings/CreateTicketScreen';
import ReportContentScreen from '@/screens/moderation/ReportContentScreen';
import AboutScreen from '@/screens/settings/AboutScreen';
import HelpScreen from '@/screens/help/HelpScreen';
import PrivacyPolicyScreen from '@/screens/legal/PrivacyPolicyScreen';
import TermsOfServiceScreen from '@/screens/legal/TermsOfServiceScreen';
import BlockedUsersScreen from '@/screens/settings/BlockedUsersScreen';
import TicketDetailsScreen from '@/screens/support/TicketDetailsScreen';
import GroupMemberManagementScreen from '@/screens/groups/GroupMemberManagementScreen';
import ChangePasswordScreen from '@/screens/settings/ChangePasswordScreen';
import AccountSecurityScreen from '@/screens/settings/AccountSecurityScreen';
import NotificationSettingsScreen from '@/screens/settings/NotificationSettingsScreen';
import ThemeScreen from '@/screens/settings/ThemeScreen';
import LanguageScreen from '@/screens/settings/LanguageScreen';
import DataUsageScreen from '@/screens/settings/DataUsageScreen';
import StorageBackupScreen from '@/screens/settings/StorageBackupScreen';
import LocationSettingsScreen from '@/screens/settings/LocationSettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<MainStackParamList>();

/**
 * Main Tab Navigator - Primary tab-based navigation
 */
const MainTabNavigator: React.FC = () => {
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
          headerRight: () => createHeaderAction(
            () => navigation.navigate('Search' as any),
            'search',
            'Search',
            'Search prayers, people, and groups'
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
          headerRight: () => createHeaderAction(
            () => navigation.navigate('Search' as any),
            'search',
            'Search',
            'Search content and users'
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
          headerRight: () => createHeaderAction(
            () => navigation.goBack(),
            'close',
            'Close',
            'Close create screen',
            'secondary'
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

/**
 * Main Stack Navigator - Wraps tabs and provides stack screens with persistent tab bar
 * Implements Single Responsibility Principle: Manages authenticated app navigation
 */
const MainNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        presentation: 'card',
      }}
    >
      {/* Main Tab Navigator */}
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />

      {/* Stack Screens with Tab Bar Visible */}
      <Stack.Group
        screenOptions={{
          headerShown: true,
          ...createStackScreenOptions(insets),
        }}
      >
        {/* Create/Edit Screens */}
        <Stack.Screen
          name="CreatePrayer"
          component={CreatePrayerScreen}
          options={{ title: 'Create Prayer' }}
        />
        <Stack.Screen
          name="EditPrayer"
          component={EditPrayerScreen}
          options={{ title: 'Edit Prayer' }}
        />
        <Stack.Screen
          name="CreateBibleStudy"
          component={CreateBibleStudyScreen}
          options={{
            title: 'Create Bible Study',
            ...createColoredHeaderOptions(insets, '#D97706'),
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="AIStudyAssistant"
          component={AIStudyAssistantScreen}
          options={{
            title: 'AI Study Assistant',
            ...createColoredHeaderOptions(insets, '#5B21B6'),
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="CreateEvent"
          component={CreateEventScreen}
          options={{
            title: 'Create Event',
            ...createColoredHeaderOptions(insets, '#DC2626'),
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="CreateGroup"
          component={CreateGroupScreen}
          options={{
            title: 'Create Group',
            ...createColoredHeaderOptions(insets, '#059669'),
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="EditGroup"
          component={EditGroupScreen}
          options={{ title: 'Edit Group' }}
        />
        <Stack.Screen
          name="CreateTicket"
          component={CreateTicketScreen}
          options={{ title: 'Contact Support' }}
        />
        <Stack.Screen
          name="ReportContent"
          component={ReportContentScreen}
          options={{ title: 'Report Content' }}
        />

        {/* Detail Screens */}
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{ title: 'Search' }}
        />
        <Stack.Screen
          name="PrayerDetails"
          component={PrayerDetailsScreen}
          options={{ title: 'Prayer Details' }}
        />
        <Stack.Screen
          name="UserProfile"
          component={UserProfileScreen}
          options={{ title: 'Profile' }}
        />
        <Stack.Screen
          name="GroupDetails"
          component={GroupDetailsScreen}
          options={{ title: 'Group' }}
        />
        <Stack.Screen
          name="MyGroups"
          component={MyGroupsScreen}
          options={{ title: 'My Groups' }}
        />
        <Stack.Screen
          name="DiscoverGroups"
          component={DiscoverGroupsScreen}
          options={{ title: 'Discover Groups' }}
        />
        <Stack.Screen
          name="GroupChat"
          component={GroupChatScreen}
          options={{ title: 'Group Chat' }}
        />
        <Stack.Screen
          name="GroupMembers"
          component={GroupMembersScreen}
          options={{ title: 'Members' }}
        />
        <Stack.Screen
          name="GroupSettings"
          component={GroupSettingsScreen}
          options={{ title: 'Group Settings' }}
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
        <Stack.Screen
          name="BibleStudy"
          component={BibleStudyScreen}
          options={{ title: 'Bible Study' }}
        />
        <Stack.Screen
          name="BibleStudyDetails"
          component={BibleStudyDetailsScreen}
          options={({ navigation }) => ({
            title: 'Bible Study',
            ...createColoredHeaderOptions(insets, '#D97706'),
          })}
        />
        <Stack.Screen
          name="BibleStudyList"
          component={BibleStudyListScreen}
          options={({ navigation }) => ({
            title: 'Bible Studies',
            headerBackTitle: 'Discover',
            ...createColoredHeaderOptions(insets, '#D97706'),
            headerRight: () => (
              <TouchableOpacity
                style={{
                  padding: theme.spacing[2],
                  marginRight: theme.spacing[1],
                }}
                onPress={() => navigation.navigate('CreateBibleStudy', {})}
                accessibilityLabel="Create Bible Study"
                accessibilityRole="button"
                accessibilityHint="Create a new Bible study"
              >
                <Ionicons name="add" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )
          })}
        />
        <Stack.Screen
          name="CategoryPrayers"
          component={CategoryPrayersScreen}
          options={({ route }) => ({
            title: route.params.categoryName,
            headerBackTitle: 'Back',
            ...createColoredHeaderOptions(
              insets,
              route.params.categoryColor || '#5B21B6'
            ),
          })}
        />

        {/* Settings Screens */}
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
        <Stack.Screen
          name="Privacy"
          component={PrivacyScreen}
          options={{ title: 'Privacy Settings' }}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{ title: 'Notification Settings' }}
        />
        <Stack.Screen
          name="Support"
          component={SupportScreen}
          options={{ title: 'Support' }}
        />
        <Stack.Screen
          name="About"
          component={AboutScreen}
          options={{ title: 'About Amenity' }}
        />
        <Stack.Screen
          name="Help"
          component={HelpScreen}
          options={{ title: 'Help & Support' }}
        />
        <Stack.Screen
          name="PrivacyPolicy"
          component={PrivacyPolicyScreen}
          options={{ title: 'Privacy Policy' }}
        />
        <Stack.Screen
          name="TermsOfService"
          component={TermsOfServiceScreen}
          options={{ title: 'Terms of Service' }}
        />
        <Stack.Screen
          name="BlockedUsers"
          component={BlockedUsersScreen}
          options={{ title: 'Blocked Users' }}
        />
        <Stack.Screen
          name="TicketDetails"
          component={TicketDetailsScreen}
          options={{ title: 'Support Ticket' }}
        />
        <Stack.Screen
          name="GroupMemberManagement"
          component={GroupMemberManagementScreen}
          options={{ title: 'Manage Members' }}
        />
        <Stack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{ title: 'Change Password' }}
        />
        <Stack.Screen
          name="AccountSecurity"
          component={AccountSecurityScreen}
          options={{ title: 'Account Security' }}
        />
        <Stack.Screen
          name="NotificationSettings"
          component={NotificationSettingsScreen}
          options={{ title: 'Notification Settings' }}
        />
        <Stack.Screen
          name="Theme"
          component={ThemeScreen}
          options={{ title: 'Theme' }}
        />
        <Stack.Screen
          name="Language"
          component={LanguageScreen}
          options={{ title: 'Language' }}
        />
        <Stack.Screen
          name="DataUsage"
          component={DataUsageScreen}
          options={{ title: 'Data Usage' }}
        />
        <Stack.Screen
          name="StorageBackup"
          component={StorageBackupScreen}
          options={{ title: 'Storage & Backup' }}
        />
        <Stack.Screen
          name="LocationSettings"
          component={LocationSettingsScreen}
          options={{ title: 'Location Settings' }}
        />
      </Stack.Group>
    </Stack.Navigator>
  );
};

export default MainNavigator;