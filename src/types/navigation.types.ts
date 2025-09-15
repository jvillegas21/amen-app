// Navigation types for React Navigation

import { NavigatorScreenParams } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';

// Root Stack Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Search: { query?: string };
  PrayerDetails: { prayerId: string };
  CreatePrayer: { groupId?: string };
  EditPrayer: { prayerId: string };
  UserProfile: { userId: string };
  GroupDetails: { groupId: string };
  CreateGroup: undefined;
  EditGroup: { groupId: string };
  BibleStudy: { studyId: string };
  BibleStudyDetails: { studyId: string; prayerId: string };
  BibleStudySuggestions: undefined;
  Settings: undefined;
  Privacy: undefined;
  Notifications: undefined;
  Support: undefined;
  CreateTicket: undefined;
  ReportContent: { type: 'prayer' | 'comment' | 'user' | 'group'; id: string };
  TicketDetails: { ticketId: string };
  About: undefined;
  Help: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  BlockedUsers: undefined;
  GroupMemberManagement: { groupId: string };
  GroupChat: { prayerId: string; groupId: string };
};

// Auth Stack Navigator
export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  VerifyEmail: { email: string };
  Onboarding: undefined;
  ProfileSetup: undefined;
  LocationPermission: undefined;
  NotificationPermission: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Discover: undefined;
  Groups: undefined;
  Create: undefined;
  Messages: undefined;
  Notifications: undefined;
  Profile: undefined;
};

// Groups Stack Navigator
export type GroupsStackParamList = {
  GroupsList: undefined;
  MyGroups: undefined;
  DiscoverGroups: undefined;
  CreateGroup: undefined;
  GroupDetails: { groupId: string };
  GroupChat: { prayerId: string; groupId: string };
  GroupMembers: { groupId: string };
  GroupSettings: { groupId: string };
};

// Profile Stack Navigator
export type ProfileStackParamList = {
  MyProfile: undefined;
  EditProfile: undefined;
  SavedPrayers: undefined;
  PrayerHistory: undefined;
  Following: undefined;
  Followers: undefined;
  Statistics: undefined;
};

// Type helpers for navigation props
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  CompositeScreenProps<
    StackScreenProps<AuthStackParamList, T>,
    RootStackScreenProps<'Auth'>
  >;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<'Main'>
  >;

export type GroupsStackScreenProps<T extends keyof GroupsStackParamList> =
  CompositeScreenProps<
    StackScreenProps<GroupsStackParamList, T>,
    MainTabScreenProps<'Groups'>
  >;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> =
  CompositeScreenProps<
    StackScreenProps<ProfileStackParamList, T>,
    MainTabScreenProps<'Profile'>
  >;

// Navigation state types
export interface NavigationState {
  isAuthenticated: boolean;
  isOnboardingComplete: boolean;
  initialRoute?: keyof RootStackParamList;
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}