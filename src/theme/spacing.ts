/**
 * Spacing System - Consistent spacing scale for layouts and components
 * Based on 4px base unit for visual consistency
 */

export const spacing = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  36: 144,
  40: 160,
  44: 176,
  48: 192,
  52: 208,
  56: 224,
  60: 240,
  64: 256,
  72: 288,
  80: 320,
  96: 384,
} as const;

// Semantic spacing aliases for common use cases
export const layout = {
  // Container spacing
  containerPadding: spacing[4], // 16px
  containerMargin: spacing[6], // 24px

  // Screen spacing
  screenPadding: spacing[4], // 16px
  screenMargin: spacing[6], // 24px

  // Card spacing
  cardPadding: spacing[4], // 16px
  cardMargin: spacing[3], // 12px
  cardRadius: spacing[3], // 12px

  // List spacing
  listItemPadding: spacing[4], // 16px
  listItemSpacing: spacing[2], // 8px

  // Form spacing
  inputPadding: spacing[3], // 12px
  inputMargin: spacing[4], // 16px
  formSpacing: spacing[6], // 24px

  // Button spacing
  buttonPadding: spacing[4], // 16px
  buttonMargin: spacing[3], // 12px

  // Navigation spacing
  tabBarHeight: 60,
  headerHeight: 56,

  // Touch targets (accessibility)
  minTouchTarget: 44, // Minimum 44px for accessibility

  // Safe areas
  safeAreaTop: spacing[12], // 48px - for status bar
  safeAreaBottom: spacing[8], // 32px - for home indicator
} as const;

// Border radius system
export const borderRadius = {
  none: 0,
  sm: 2,
  base: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
} as const;

// Shadow system for elevation
export const shadows = {
  none: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  base: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
  },
  md: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 5.46,
    elevation: 8,
  },
  lg: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 7.49,
    elevation: 12,
  },
  xl: {
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.29,
    shadowRadius: 13.16,
    elevation: 20,
  },
  '2xl': {
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.35,
    shadowRadius: 21.0,
    elevation: 30,
  },
} as const;

// Type definitions
export type Spacing = typeof spacing;
export type SpacingKey = keyof Spacing;
export type Layout = typeof layout;
export type BorderRadius = typeof borderRadius;
export type Shadows = typeof shadows;