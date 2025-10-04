/**
 * Header Utilities - Consistent header configuration across all navigators
 * Provides unified header styling and spacing for iOS and Android
 */

import { Platform } from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';
import { theme } from '@/theme';

/**
 * Creates consistent header style configuration for all navigators
 * @param insets - Safe area insets from useSafeAreaInsets hook
 * @param backgroundColor - Optional background color (defaults to primary)
 * @returns Header style configuration object
 */
export const createHeaderStyle = (
  insets: EdgeInsets,
  backgroundColor: string = theme.colors.primary[600]
) => ({
  backgroundColor,
  // Add top padding for Android edge-to-edge mode to account for status bar
  paddingTop: Platform.OS === 'android' ? insets.top : 0,
  // More generous height calculation for better spacing
  height: Platform.OS === 'android'
    ? 56 + insets.top
    : Math.max(100, 44 + insets.top), // Ensure minimum 100px on iOS, more for devices with notch/dynamic island
});

/**
 * Creates consistent screen options for stack navigators
 * @param insets - Safe area insets from useSafeAreaInsets hook
 * @param backgroundColor - Optional background color (defaults to primary)
 * @returns Complete screen options configuration
 */
export const createStackScreenOptions = (
  insets: EdgeInsets,
  backgroundColor: string = theme.colors.primary[600]
) => ({
  headerStyle: createHeaderStyle(insets, backgroundColor),
  headerTintColor: theme.colors.text.inverse,
  headerTitleStyle: {
    ...theme.typography.navigation.title,
    color: theme.colors.text.inverse,
  },
  // Add consistent title positioning - centered per requirement
  headerTitleAlign: 'center' as const,
  headerLeftContainerStyle: {
    paddingLeft: theme.spacing[4],
    paddingTop: Platform.OS === 'ios' ? theme.spacing[1] : 0, // Small adjustment for iOS text positioning
  },
  headerRightContainerStyle: {
    paddingRight: theme.spacing[4],
    paddingTop: Platform.OS === 'ios' ? theme.spacing[1] : 0, // Small adjustment for iOS icon positioning
  },
});

/**
 * Creates consistent screen options for tab navigators
 * @param insets - Safe area insets from useSafeAreaInsets hook
 * @returns Complete screen options configuration for tab navigator
 */
export const createTabScreenOptions = (insets: EdgeInsets) => ({
  headerStyle: createHeaderStyle(insets),
  headerTintColor: theme.colors.text.inverse,
  headerTitleStyle: {
    ...theme.typography.navigation.title,
    color: theme.colors.text.inverse,
  },
  // Add consistent title positioning - centered per requirement
  headerTitleAlign: 'center' as const,
  headerLeftContainerStyle: {
    paddingLeft: theme.spacing[4],
    paddingTop: Platform.OS === 'ios' ? theme.spacing[1] : 0, // Small adjustment for iOS text positioning
  },
  headerRightContainerStyle: {
    paddingRight: theme.spacing[4],
    paddingTop: Platform.OS === 'ios' ? theme.spacing[1] : 0, // Small adjustment for iOS icon positioning
  },
});

/**
 * Creates screen options for colored headers (e.g., Bible Study, Events, Groups)
 * @param insets - Safe area insets from useSafeAreaInsets hook
 * @param backgroundColor - Header background color
 * @param textColor - Header text color (defaults to white)
 * @returns Screen options with custom colored header
 */
export const createColoredHeaderOptions = (
  insets: EdgeInsets,
  backgroundColor: string,
  textColor: string = '#FFFFFF'
) => ({
  headerStyle: createHeaderStyle(insets, backgroundColor),
  headerTintColor: textColor,
  headerTitleStyle: {
    ...theme.typography.navigation.title,
    color: textColor,
  },
  headerTitleAlign: 'center' as const,
  headerLeftContainerStyle: {
    paddingLeft: theme.spacing[4],
    paddingTop: Platform.OS === 'ios' ? theme.spacing[1] : 0,
  },
  headerRightContainerStyle: {
    paddingRight: theme.spacing[4],
    paddingTop: Platform.OS === 'ios' ? theme.spacing[1] : 0,
  },
});

/**
 * Header height calculation function - useful for layout calculations
 * @param insets - Safe area insets
 * @returns Calculated header height
 */
export const getHeaderHeight = (insets: EdgeInsets): number => {
  return Platform.OS === 'android'
    ? 56 + insets.top
    : Math.max(100, 44 + insets.top);
};

/**
 * Creates a standardized header left action button (typically back button)
 * @param onPress - Function to call when button is pressed
 * @param iconName - Ionicon name (defaults to chevron-back)
 * @param accessibilityLabel - Accessibility label for the button
 * @returns TouchableOpacity component with consistent styling
 */
export const createHeaderLeftAction = (
  onPress: () => void,
  iconName: string = 'chevron-back',
  accessibilityLabel: string = 'Go back'
) => {
  const React = require('react');
  const { TouchableOpacity } = require('react-native');
  const { Ionicons } = require('@expo/vector-icons');

  return React.createElement(TouchableOpacity, {
    onPress,
    style: {
      padding: theme.spacing[2],
      marginLeft: theme.spacing[1],
    },
    accessibilityLabel,
    accessibilityRole: 'button',
  }, React.createElement(Ionicons, {
    name: iconName,
    size: 24,
    color: theme.colors.text.inverse,
  }));
};

/**
 * Creates a standardized header right action button
 * @param onPress - Function to call when button is pressed
 * @param iconName - Ionicon name
 * @param accessibilityLabel - Accessibility label for the button
 * @param accessibilityHint - Accessibility hint for the button
 * @returns TouchableOpacity component with consistent styling
 */
export const createHeaderRightAction = (
  onPress: () => void,
  iconName: string,
  accessibilityLabel: string,
  accessibilityHint?: string
) => {
  const React = require('react');
  const { TouchableOpacity } = require('react-native');
  const { Ionicons } = require('@expo/vector-icons');

  return React.createElement(TouchableOpacity, {
    onPress,
    style: {
      padding: theme.spacing[2],
      marginRight: theme.spacing[1],
    },
    accessibilityLabel,
    accessibilityRole: 'button',
    accessibilityHint,
  }, React.createElement(Ionicons, {
    name: iconName,
    size: 24,
    color: theme.colors.text.inverse,
  }));
};

/**
 * Creates multiple header right actions with proper spacing
 * @param actions - Array of action configurations
 * @returns View component containing multiple action buttons
 */
export const createHeaderRightActions = (actions: Array<{
  onPress: () => void;
  iconName: string;
  accessibilityLabel: string;
  accessibilityHint?: string;
}>) => {
  const React = require('react');
  const { View, TouchableOpacity } = require('react-native');
  const { Ionicons } = require('@expo/vector-icons');

  return React.createElement(View, {
    style: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: theme.spacing[1],
    }
  }, actions.map((action, index) =>
    React.createElement(TouchableOpacity, {
      key: index,
      onPress: action.onPress,
      style: {
        padding: theme.spacing[2],
        marginLeft: index > 0 ? theme.spacing[1] : 0,
      },
      accessibilityLabel: action.accessibilityLabel,
      accessibilityRole: 'button',
      accessibilityHint: action.accessibilityHint,
    }, React.createElement(Ionicons, {
      name: action.iconName,
      size: 24,
      color: theme.colors.text.inverse,
    }))
  ));
};