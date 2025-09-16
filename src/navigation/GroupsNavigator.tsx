import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { GroupsStackParamList } from '@/types/navigation.types';

// Groups Screen imports
import GroupsListScreen from '@/screens/groups/GroupsListScreen';
import MyGroupsScreen from '@/screens/groups/MyGroupsScreen';
import DiscoverGroupsScreen from '@/screens/groups/DiscoverGroupsScreen';
import CreateGroupScreen from '@/screens/groups/CreateGroupScreen';
import GroupDetailsScreen from '@/screens/groups/GroupDetailsScreen';
import EditGroupScreen from '@/screens/groups/EditGroupScreen';
import GroupChatScreen from '@/screens/groups/GroupChatScreen';
import GroupMembersScreen from '@/screens/groups/GroupMembersScreen';
import GroupSettingsScreen from '@/screens/groups/GroupSettingsScreen';

const Stack = createStackNavigator<GroupsStackParamList>();

/**
 * Groups Navigator - Manages group-related navigation
 */
const GroupsNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="GroupsList"
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
        name="GroupsList"
        component={GroupsListScreen}
        options={{ title: 'Groups' }}
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
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{ title: 'Create Group' }}
      />
      <Stack.Screen
        name="GroupDetails"
        component={GroupDetailsScreen}
        options={{ title: 'Group Details' }}
      />
      <Stack.Screen
        name="EditGroup"
        component={EditGroupScreen}
        options={{ title: 'Edit Group' }}
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