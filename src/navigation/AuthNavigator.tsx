import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthStackParamList } from '@/types/navigation.types';

// Auth Screen imports
import WelcomeScreen from '@/screens/auth/WelcomeScreen';
import SignInScreen from '@/screens/auth/SignInScreen';
import SignUpScreen from '@/screens/auth/SignUpScreen';
import ForgotPasswordScreen from '@/screens/auth/ForgotPasswordScreen';
import VerifyEmailScreen from '@/screens/auth/VerifyEmailScreen';
import OnboardingScreen from '@/screens/auth/OnboardingScreen';
import ProfileSetupScreen from '@/screens/auth/ProfileSetupScreen';
import LocationPermissionScreen from '@/screens/auth/LocationPermissionScreen';
import NotificationPermissionScreen from '@/screens/auth/NotificationPermissionScreen';

const Stack = createStackNavigator<AuthStackParamList>();

/**
 * Auth Navigator - Handles authentication and onboarding flow
 * Follows Open/Closed Principle: Extensible for new auth methods without modification
 */
const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        cardStyleInterpolator: ({ current: { progress } }) => ({
          cardStyle: {
            opacity: progress,
          },
        }),
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      
      {/* Onboarding Flow */}
      <Stack.Group>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        <Stack.Screen name="LocationPermission" component={LocationPermissionScreen} />
        <Stack.Screen name="NotificationPermission" component={NotificationPermissionScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
};

export default AuthNavigator;