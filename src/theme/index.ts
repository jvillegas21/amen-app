/**
 * Theme System - Centralized design tokens and theme configuration
 * Provides consistent styling throughout the app
 */

import { colors } from './colors';
import { typography } from './typography';
import { spacing, layout, borderRadius, shadows } from './spacing';

// Main theme object combining all design tokens
export const theme = {
  colors,
  typography,
  spacing,
  layout,
  borderRadius,
  shadows,

  // Component-specific theme tokens
  components: {
    tabBar: {
      height: layout.tabBarHeight,
      backgroundColor: colors.background.primary,
      borderColor: colors.border.primary,
      activeColor: colors.primary[600],
      inactiveColor: colors.neutral[500],
      labelStyle: typography.tabBar.active,
    },

    header: {
      height: layout.headerHeight,
      backgroundColor: colors.primary[600],
      titleColor: colors.text.inverse,
      titleStyle: typography.navigation.title,
    },

    button: {
      primary: {
        backgroundColor: colors.primary[600],
        color: colors.text.inverse,
        borderRadius: borderRadius.lg,
        padding: layout.buttonPadding,
        typography: typography.button.medium,
        shadow: shadows.sm,
      },
      secondary: {
        backgroundColor: colors.interactive.secondary,
        color: colors.text.primary,
        borderRadius: borderRadius.lg,
        padding: layout.buttonPadding,
        typography: typography.button.medium,
        shadow: shadows.none,
      },
    },

    card: {
      backgroundColor: colors.surface.card,
      borderRadius: borderRadius.xl,
      padding: layout.cardPadding,
      margin: layout.cardMargin,
      shadow: shadows.sm,
      borderColor: colors.border.primary,
    },

    input: {
      backgroundColor: colors.background.secondary,
      borderColor: colors.border.primary,
      borderRadius: borderRadius.lg,
      padding: layout.inputPadding,
      typography: typography.body.medium,
      focusBorderColor: colors.border.focus,
    },
  },
} as const;

// Accessibility helpers
export const accessibility = {
  minTouchTarget: layout.minTouchTarget,
  highContrastRatio: 4.5, // WCAG AA standard

  // Screen reader friendly color descriptions
  colorDescriptions: {
    [colors.prayer.answered]: 'answered prayer (green)',
    [colors.prayer.pending]: 'pending prayer (amber)',
    [colors.prayer.urgent]: 'urgent prayer (red)',
    [colors.primary[600]]: 'primary brand color (purple)',
  },
} as const;

// Export individual systems for selective imports
export { colors } from './colors';
export { typography } from './typography';
export { spacing, layout, borderRadius, shadows } from './spacing';

// Type definitions for the complete theme
export type Theme = typeof theme;
export type ThemeColors = typeof colors;
export type ThemeTypography = typeof typography;
export type ThemeSpacing = typeof spacing;