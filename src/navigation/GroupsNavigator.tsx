import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GroupsStackParamList } from '@/types/navigation.types';
import { theme } from '@/theme';
import { createStackScreenOptions } from './headerUtils';

// Groups Screen imports
import GroupsListScreen from '@/screens/groups/GroupsListScreen';
import MyGroupsScreen from '@/screens/groups/MyGroupsScreen';
import DiscoverGroupsScreen from '@/screens/groups/DiscoverGroupsScreen';
import GroupChatScreen from '@/screens/groups/GroupChatScreen';
import GroupMembersScreen from '@/screens/groups/GroupMembersScreen';
import GroupSettingsScreen from '@/screens/groups/GroupSettingsScreen';

const Stack = createStackNavigator<GroupsStackParamList>();

/**
 * Groups Navigator - Manages group-related navigation
 */
const GroupsNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <Stack.Navigator
      initialRouteName="GroupsList"
      screenOptions={createStackScreenOptions(insets)}
    >
      <Stack.Screen
        name="GroupsList"
        component={GroupsListScreen}
        options={({ navigation }) => ({
          title: 'Groups',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('CreateGroup')}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#5B21B6',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16,
                ...Platform.select({
                  ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                  },
                  android: {
                    elevation: 4,
                  },
                }),
              }}
              accessibilityLabel="Create Group"
              accessibilityRole="button"
              accessibilityHint="Create a new group"
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        })}
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
    </Stack.Navigator>
  );
};

export default GroupsNavigator;