import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator, View, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { createStackScreenOptions, createColoredHeaderOptions } from './headerUtils';

import { RootStackParamList } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { navigationRef } from './navigationRef';

// Screen imports
import SearchScreen from '@/screens/main/SearchScreen';
import PrayerDetailsScreen from '@/screens/prayer/PrayerDetailsScreen';
import CreatePrayerScreen from '@/screens/prayer/CreatePrayerScreen';
import EditPrayerScreen from '@/screens/prayer/EditPrayerScreen';
import CreateBibleStudyScreen from '@/screens/main/CreateBibleStudyScreen';
import AIStudyAssistantScreen from '@/screens/main/AIStudyAssistantScreen';
import CreateEventScreen from '@/screens/main/CreateEventScreen';
import UserProfileScreen from '@/screens/profile/UserProfileScreen';
import GroupDetailsScreen from '@/screens/groups/GroupDetailsScreen';
import CreateGroupScreen from '@/screens/groups/CreateGroupScreen';
import EditGroupScreen from '@/screens/groups/EditGroupScreen';
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

const Stack = createStackNavigator<RootStackParamList>();

/**
 * Root Navigator - Manages authentication flow and main app navigation
 * Implements Single Responsibility Principle: Only handles root-level navigation
 */
/**
 * Inner Navigator Component - Uses safe area insets for header sizing
 */
const InnerNavigator: React.FC<{ isAuthenticated: boolean; theme: any }> = ({ isAuthenticated, theme }) => {
  const insets = useSafeAreaInsets();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        presentation: 'card',
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainNavigator} />

          {/* Full Screen Navigation */}
          <Stack.Group
            screenOptions={{
              headerShown: true,
              ...createStackScreenOptions(insets),
            }}
          >
            {/* Create/Edit Screens - Converted from Modal */}
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

            {/* Other Full Screen Screens */}
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
              name="BibleStudy"
              component={BibleStudyScreen}
              options={{ title: 'Bible Study' }}
            />
            <Stack.Screen
              name="BibleStudyDetails"
              component={BibleStudyDetailsScreen}
              options={{ title: 'Bible Study Details' }}
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
        </>
      )}
    </Stack.Navigator>
  );
};

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, checkAuthStatus } = useAuthStore();
  const { theme } = useTheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await checkAuthStatus();
      } finally {
        setIsReady(true);
      }
    };

    initializeAuth();
  }, [checkAuthStatus]);

  if (!isReady || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background.primary }}>
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <InnerNavigator isAuthenticated={isAuthenticated} theme={theme} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default RootNavigator;
