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
  tabBarHeight: 50, // Increased base height for better touch targets
  headerHeight: 100, // Increased to provide better spacing for titles and prevent cutoff

  // Touch targets (accessibility)
  minTouchTarget: 44, // Minimum 44px for accessibility

  // Safe areas - Dynamic values that should be overridden by actual device insets
  safeAreaTop: spacing[12], // 48px - for status bar (fallback)
  safeAreaBottom: spacing[8], // 32px - for home indicator (fallback)

  // Edge-to-edge specific spacing (for Android edgeToEdgeEnabled)
  edgeToEdgeBottomPadding: spacing[6], // 24px - minimum bottom padding when edge-to-edge
  
  // Modal and drawer spacing
  modalBottomPadding: spacing[8], // 32px - for modal bottom padding
  drawerBottomPadding: spacing[8], // 32px - for drawer bottom padding
  floatingButtonBottomPadding: spacing[8], // 32px - for floating button bottom padding
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
  // iOS 26 Liquid Glass shadow system
  glass: {
    light: {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    medium: {
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 6,
    },
    heavy: {
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 20,
      elevation: 10,
    },
  },
} as const;

// iOS 26 Glassmorphism Design System
export const glassmorphism = {
  // Blur intensities for backdrop filters
  blur: {
    subtle: 10,
    medium: 20,
    strong: 40,
    intense: 60,
  },

  // Transparency levels for glass elements (increased for better visibility)
  opacity: {
    translucent: 0.95,
    semiTransparent: 0.90,
    transparent: 0.85,
    minimal: 0.75,
  },

  // Glass material colors with built-in transparency (increased opacity for visibility)
  glass: {
    // Primary glass surfaces - more opaque for better readability
    primary: 'rgba(255, 255, 255, 0.95)',
    secondary: 'rgba(249, 250, 251, 0.92)',
    tertiary: 'rgba(243, 244, 246, 0.88)',

    // Tinted glass for brand elements - more visible
    purple: 'rgba(91, 33, 182, 0.25)',
    purpleStrong: 'rgba(91, 33, 182, 0.35)',

    // Dark mode variants
    dark: {
      primary: 'rgba(31, 41, 55, 0.95)',
      secondary: 'rgba(55, 65, 81, 0.92)',
      tertiary: 'rgba(75, 85, 99, 0.88)',
    },
  },

  // Border styles for glass elements (stronger for better visibility)
  borders: {
    subtle: {
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    medium: {
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    strong: {
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.25)',
    },
  },

  // Spatial depth layers for hierarchy
  depth: {
    background: 0,
    surface: 1,
    overlay: 2,
    modal: 3,
    popover: 4,
    tooltip: 5,
    notification: 6,
  },
} as const;

// Physics-based animation curves for iOS 26
export const motionDesign = {
  // Spring animation presets
  springs: {
    gentle: {
      tension: 120,
      friction: 14,
      useNativeDriver: true,
    },
    snappy: {
      tension: 200,
      friction: 10,
      useNativeDriver: true,
    },
    bouncy: {
      tension: 180,
      friction: 6,
      useNativeDriver: true,
    },
  },

  // Timing curves for different interactions
  timings: {
    quick: { duration: 200, useNativeDriver: true },
    smooth: { duration: 300, useNativeDriver: true },
    gentle: { duration: 500, useNativeDriver: true },
  },

  // Transform presets for interactive elements
  transforms: {
    press: { scale: 0.96, opacity: 0.8 },
    hover: { scale: 1.02, opacity: 1 },
    focus: { scale: 1.05, opacity: 1 },
  },
} as const;

// Type definitions
export type Spacing = typeof spacing;
export type SpacingKey = keyof Spacing;
export type Layout = typeof layout;
export type BorderRadius = typeof borderRadius;
export type Shadows = typeof shadows;
export type Glassmorphism = typeof glassmorphism;
export type MotionDesign = typeof motionDesign;