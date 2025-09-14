import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  style?: any;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'heart-outline',
  title,
  description,
  actionText,
  onAction,
  style,
}) => {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const iconScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Staggered animation for better UX
    Animated.sequence([
      // Icon animation
      Animated.spring(iconScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      // Content animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [fadeAnim, translateY, iconScale]);

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [{ scale: iconScale }],
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={64}
          color={theme.colors.neutral[300]}
          accessibilityLabel={`${title} icon`}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY }],
          },
        ]}
      >
        <Text
          style={[
            styles.title,
            {
              ...theme.typography.heading.h2,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing[2],
            },
          ]}
          accessibilityRole="header"
        >
          {title}
        </Text>

        <Text
          style={[
            styles.description,
            {
              ...theme.typography.body.medium,
              color: theme.colors.text.secondary,
              marginBottom: actionText ? theme.spacing[6] : 0,
            },
          ]}
        >
          {description}
        </Text>

        {actionText && onAction && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.colors.primary[600],
                borderRadius: theme.borderRadius.lg,
                paddingVertical: theme.spacing[3],
                paddingHorizontal: theme.spacing[6],
                minHeight: theme.layout.minTouchTarget,
                ...theme.shadows.sm,
                shadowColor: theme.colors.neutral[1000],
              },
            ]}
            onPress={onAction}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={actionText}
            accessibilityHint="Double tap to perform this action"
          >
            <Text
              style={[
                styles.actionText,
                {
                  ...theme.typography.button.medium,
                  color: theme.colors.text.inverse,
                },
              ]}
            >
              {actionText}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconContainer: {
    marginBottom: 16,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    lineHeight: 24,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    textAlign: 'center',
  },
});

export default EmptyState;