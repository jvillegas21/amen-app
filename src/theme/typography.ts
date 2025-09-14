/**
 * Typography System - Consistent text styles throughout the app
 * Follows mobile typography best practices and accessibility guidelines
 */

import { TextStyle } from 'react-native';

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
} as const;

export const lineHeights = {
  xs: 16,
  sm: 20,
  base: 24,
  lg: 28,
  xl: 28,
  '2xl': 32,
  '3xl': 36,
  '4xl': 40,
  '5xl': 56,
  '6xl': 72,
} as const;

export const fontWeights = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

// Typography scale with semantic naming
export const typography = {
  // Display styles - for large headings
  display: {
    large: {
      fontSize: fontSizes['5xl'],
      lineHeight: lineHeights['5xl'],
      fontWeight: fontWeights.bold,
      letterSpacing: -0.5,
    } as TextStyle,
    medium: {
      fontSize: fontSizes['4xl'],
      lineHeight: lineHeights['4xl'],
      fontWeight: fontWeights.bold,
      letterSpacing: -0.25,
    } as TextStyle,
    small: {
      fontSize: fontSizes['3xl'],
      lineHeight: lineHeights['3xl'],
      fontWeight: fontWeights.semibold,
      letterSpacing: -0.25,
    } as TextStyle,
  },

  // Heading styles
  heading: {
    h1: {
      fontSize: fontSizes['2xl'],
      lineHeight: lineHeights['2xl'],
      fontWeight: fontWeights.bold,
      letterSpacing: -0.25,
    } as TextStyle,
    h2: {
      fontSize: fontSizes.xl,
      lineHeight: lineHeights.xl,
      fontWeight: fontWeights.semibold,
      letterSpacing: -0.25,
    } as TextStyle,
    h3: {
      fontSize: fontSizes.lg,
      lineHeight: lineHeights.lg,
      fontWeight: fontWeights.semibold,
    } as TextStyle,
    h4: {
      fontSize: fontSizes.base,
      lineHeight: lineHeights.base,
      fontWeight: fontWeights.semibold,
    } as TextStyle,
    h5: {
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontWeight: fontWeights.semibold,
    } as TextStyle,
    h6: {
      fontSize: fontSizes.xs,
      lineHeight: lineHeights.xs,
      fontWeight: fontWeights.semibold,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    } as TextStyle,
  },

  // Body text styles
  body: {
    large: {
      fontSize: fontSizes.lg,
      lineHeight: lineHeights.lg,
      fontWeight: fontWeights.normal,
    } as TextStyle,
    medium: {
      fontSize: fontSizes.base,
      lineHeight: lineHeights.base,
      fontWeight: fontWeights.normal,
    } as TextStyle,
    small: {
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontWeight: fontWeights.normal,
    } as TextStyle,
  },

  // Label styles
  label: {
    large: {
      fontSize: fontSizes.base,
      lineHeight: lineHeights.base,
      fontWeight: fontWeights.medium,
    } as TextStyle,
    medium: {
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontWeight: fontWeights.medium,
    } as TextStyle,
    small: {
      fontSize: fontSizes.xs,
      lineHeight: lineHeights.xs,
      fontWeight: fontWeights.medium,
    } as TextStyle,
  },

  // Caption styles
  caption: {
    large: {
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontWeight: fontWeights.normal,
    } as TextStyle,
    medium: {
      fontSize: fontSizes.xs,
      lineHeight: lineHeights.xs,
      fontWeight: fontWeights.normal,
    } as TextStyle,
  },

  // Button styles
  button: {
    large: {
      fontSize: fontSizes.base,
      lineHeight: lineHeights.base,
      fontWeight: fontWeights.semibold,
    } as TextStyle,
    medium: {
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontWeight: fontWeights.semibold,
    } as TextStyle,
    small: {
      fontSize: fontSizes.xs,
      lineHeight: lineHeights.xs,
      fontWeight: fontWeights.semibold,
    } as TextStyle,
  },

  // Tab bar styles
  tabBar: {
    active: {
      fontSize: fontSizes.xs,
      lineHeight: lineHeights.xs,
      fontWeight: fontWeights.semibold,
    } as TextStyle,
    inactive: {
      fontSize: fontSizes.xs,
      lineHeight: lineHeights.xs,
      fontWeight: fontWeights.medium,
    } as TextStyle,
  },

  // Navigation styles
  navigation: {
    title: {
      fontSize: fontSizes.lg,
      lineHeight: lineHeights.lg,
      fontWeight: fontWeights.semibold,
    } as TextStyle,
    subtitle: {
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontWeight: fontWeights.normal,
    } as TextStyle,
  },
} as const;

// Type definitions
export type Typography = typeof typography;
export type TypographyCategory = keyof Typography;
export type TypographyVariant<T extends TypographyCategory> = keyof Typography[T];