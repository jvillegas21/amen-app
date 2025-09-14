import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import RootNavigator from '@/navigation/RootNavigator';
import { useAuthStore } from '@/store/auth/authStore';
import { notificationManager } from '@/services/notifications/notificationManager';
import { ThemeProvider } from '@/theme/ThemeContext';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

/**
 * Root App Component
 * Implements Dependency Injection Pattern: Provides global services to the app
 */
export default function App() {
  const { checkAuthStatus, profile } = useAuthStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check authentication status
        await checkAuthStatus();

        // Initialize notification system if user is authenticated
        if (profile?.id) {
          await notificationManager.initialize(profile.id);
        }

        // Hide splash screen
        await SplashScreen.hideAsync();
      } catch (error) {
        console.error('Failed to initialize app:', error);
        await SplashScreen.hideAsync();
      }
    };

    initializeApp();
  }, [checkAuthStatus, profile?.id]);

  // Cleanup notification system when app unmounts
  useEffect(() => {
    return () => {
      notificationManager.cleanup();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <GestureHandlerRootView style={styles.container}>
          <RootNavigator />
          <StatusBar style="auto" />
        </GestureHandlerRootView>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
