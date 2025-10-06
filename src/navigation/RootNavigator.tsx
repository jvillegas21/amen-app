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

const Stack = createStackNavigator<RootStackParamList>();

/**
 * Root Navigator - Manages authentication flow
 * Implements Single Responsibility Principle: Only handles Auth/Main split
 */
const InnerNavigator: React.FC<{ isAuthenticated: boolean }> = ({ isAuthenticated }) => {
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
        <Stack.Screen name="Main" component={MainNavigator} />
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
        <InnerNavigator isAuthenticated={isAuthenticated} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default RootNavigator;
