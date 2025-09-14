/**
 * Button Component - Reusable button with consistent styling and accessibility
 */

import React, { useRef, useCallback } from 'react';
import {
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  AccessibilityRole,
  Animated,
  Pressable,
} from 'react-native';
import { theme } from '@/theme';
import * as Haptics from 'expo-haptics';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(async () => {
    if (disabled || loading) return;

    // Haptic feedback for better UX
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [disabled, loading, onPress]);

  const handlePressIn = useCallback(() => {
    if (disabled || loading) return;

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [disabled, loading, scaleAnim, opacityAnim]);

  const handlePressOut = useCallback(() => {
    if (disabled || loading) return;

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [disabled, loading, scaleAnim, opacityAnim]);

  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    (disabled || loading) && styles[`${variant}Disabled`],
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    (disabled || loading) && styles.disabledText,
    (disabled || loading) && styles[`${variant}DisabledText`],
    textStyle,
  ];

  const accessibilityRole: AccessibilityRole = 'button';
  const accessibilityState = {
    disabled: disabled || loading,
  };

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <Pressable
        style={buttonStyle}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityState={accessibilityState}
        testID={testID}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={getLoadingColor(variant)}
            accessibilityLabel="Loading"
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && icon}
            <Text style={textStyles} numberOfLines={1}>
              {title}
            </Text>
            {icon && iconPosition === 'right' && icon}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
};

const getLoadingColor = (variant: ButtonVariant): string => {
  switch (variant) {
    case 'primary':
    case 'danger':
      return theme.colors.text.inverse;
    case 'secondary':
    case 'outline':
    case 'ghost':
    default:
      return theme.colors.primary[600];
  }
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.lg,
    minHeight: theme.layout.minTouchTarget,
    ...theme.shadows.sm,
  },
  fullWidth: {
    width: '100%',
  },

  // Variants
  primary: {
    backgroundColor: theme.colors.primary[600],
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: theme.colors.interactive.secondary,
    borderWidth: 0,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  danger: {
    backgroundColor: theme.colors.error[500],
    borderWidth: 0,
  },

  // Sizes
  small: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    minHeight: 36,
  },
  medium: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    minHeight: theme.layout.minTouchTarget,
  },
  large: {
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[4],
    minHeight: 52,
  },

  // Text styles
  text: {
    textAlign: 'center',
    fontWeight: '600',
  },
  primaryText: {
    ...theme.typography.button.medium,
    color: theme.colors.text.inverse,
  },
  secondaryText: {
    ...theme.typography.button.medium,
    color: theme.colors.text.primary,
  },
  outlineText: {
    ...theme.typography.button.medium,
    color: theme.colors.primary[600],
  },
  ghostText: {
    ...theme.typography.button.medium,
    color: theme.colors.primary[600],
  },
  dangerText: {
    ...theme.typography.button.medium,
    color: theme.colors.text.inverse,
  },

  // Size text
  smallText: {
    ...theme.typography.button.small,
  },
  mediumText: {
    ...theme.typography.button.medium,
  },
  largeText: {
    ...theme.typography.button.large,
  },

  // Disabled states
  disabled: {
    opacity: 0.6,
    ...theme.shadows.none,
  },
  disabledText: {
    opacity: 0.8,
  },
  primaryDisabled: {
    backgroundColor: theme.colors.neutral[300],
  },
  primaryDisabledText: {
    color: theme.colors.neutral[500],
  },
  secondaryDisabled: {
    backgroundColor: theme.colors.neutral[100],
  },
  secondaryDisabledText: {
    color: theme.colors.neutral[400],
  },
  outlineDisabled: {
    borderColor: theme.colors.neutral[200],
  },
  outlineDisabledText: {
    color: theme.colors.neutral[400],
  },
  ghostDisabled: {},
  ghostDisabledText: {
    color: theme.colors.neutral[400],
  },
  dangerDisabled: {
    backgroundColor: theme.colors.neutral[300],
  },
  dangerDisabledText: {
    color: theme.colors.neutral[500],
  },
});

export default Button;