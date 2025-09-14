import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation.types';

/**
 * Navigation reference for accessing navigation outside of React components
 * Useful for navigation from services, utilities, or Redux/Zustand actions
 */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Navigate to a screen from outside a React component
 */
export function navigate<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params?: RootStackParamList[RouteName]
) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as any, params as any);
  }
}

/**
 * Go back in navigation stack
 */
export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

/**
 * Reset navigation stack
 */
export function resetRoot(state?: any) {
  if (navigationRef.isReady()) {
    navigationRef.resetRoot(state);
  }
}