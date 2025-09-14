/**
 * Card Component - Reusable card container with consistent styling
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  AccessibilityRole,
} from 'react-native';
import { theme } from '@/theme';
import * as Haptics from 'expo-haptics';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'flat';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  onPress,
  style,
  contentStyle,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const handlePress = async () => {
    if (disabled || !onPress) return;

    // Haptic feedback for interactive cards
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const cardStyle = [
    styles.base,
    styles[variant],
    disabled && styles.disabled,
    style,
  ];

  const content = (
    <View style={[styles.content, contentStyle]} testID={testID}>
      {children}
    </View>
  );

  if (onPress) {
    const accessibilityRole: AccessibilityRole = 'button';
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.95}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={cardStyle}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface.card,
  },
  content: {
    padding: theme.layout.cardPadding,
  },

  // Variants
  default: {
    ...theme.shadows.sm,
    borderWidth: 0,
  },
  elevated: {
    ...theme.shadows.md,
    borderWidth: 0,
  },
  outlined: {
    ...theme.shadows.none,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  flat: {
    ...theme.shadows.none,
    borderWidth: 0,
  },

  // States
  disabled: {
    opacity: 0.6,
  },
});

// Specialized card variants
export const PrayerCard: React.FC<CardProps> = (props) => (
  <Card {...props} variant="default" />
);

export const ActionCard: React.FC<CardProps> = (props) => (
  <Card {...props} variant="outlined" />
);

export const InfoCard: React.FC<CardProps> = (props) => (
  <Card {...props} variant="flat" />
);

export default Card;