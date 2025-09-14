import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

import { RootStackParamList } from '@/types/navigation.types';
import { useAuthStore } from '@/store/auth/authStore';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { navigationRef } from './navigationRef';

// Screen imports
import PrayerDetailsScreen from '@/screens/prayer/PrayerDetailsScreen';
import CreatePrayerScreen from '@/screens/prayer/CreatePrayerScreen';
import EditPrayerScreen from '@/screens/prayer/EditPrayerScreen';
import UserProfileScreen from '@/screens/profile/UserProfileScreen';
import GroupDetailsScreen from '@/screens/groups/GroupDetailsScreen';
import CreateGroupScreen from '@/screens/groups/CreateGroupScreen';
import EditGroupScreen from '@/screens/groups/EditGroupScreen';
import BibleStudyScreen from '@/screens/main/BibleStudyScreen';
import BibleStudyDetailsScreen from '@/screens/main/BibleStudyDetailsScreen';
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
import GroupChatScreen from '@/screens/groups/GroupChatScreen';

const Stack = createStackNavigator<RootStackParamList>();

/**
 * Root Navigator - Manages authentication flow and main app navigation
 * Implements Single Responsibility Principle: Only handles root-level navigation
 */
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
              
              {/* Modal Screens */}
              <Stack.Group
                screenOptions={{
                  presentation: 'modal',
                  headerShown: true,
                  headerStyle: {
                    backgroundColor: theme.colors.primary[600],
                  },
                  headerTintColor: theme.colors.text.inverse,
                }}
              >
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
                  name="CreateGroup"
                  component={CreateGroupScreen}
                  options={{ title: 'Create Group' }}
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
              </Stack.Group>

              {/* Full Screen Navigation */}
              <Stack.Group
                screenOptions={{
                  headerShown: true,
                  headerStyle: {
                    backgroundColor: theme.colors.primary[600],
                  },
                  headerTintColor: theme.colors.text.inverse,
                }}
              >
                <Stack.Screen
                  name="PrayerDetails"
                  component={PrayerDetailsScreen}
                  options={{ title: 'Prayer' }}
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
                  options={{ title: 'About Amen' }}
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
                  name="GroupChat"
                  component={GroupChatScreen}
                  options={{ title: 'Group Chat' }}
                />
              </Stack.Group>
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default RootNavigator;