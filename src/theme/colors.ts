/**
 * Color System - Centralized color palette for consistent theming
 * Follows semantic naming and accessibility guidelines
 */

export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#5B21B6', // Main brand purple
    700: '#4C1D95',
    800: '#3730A3',
    900: '#1E1B4B',
  },

  // Secondary Colors
  secondary: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7',
    600: '#8B5CF6',
    700: '#7C3AED',
    800: '#6D28D9',
    900: '#581C87',
  },

  // Semantic Colors
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#047857',
    600: '#047857',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#B45309',
    600: '#B45309',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#B91C1C',
    600: '#B91C1C',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Neutral Colors
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    1000: '#000000',
  },

  // Light theme semantic mappings
  light: {
    background: {
      primary: '#FFFFFF',
      secondary: '#F9FAFB',
      tertiary: '#F3F4F6',
      elevated: '#FFFFFF',
      inverse: '#111827',
    },
    surface: {
      primary: '#FFFFFF',
      secondary: '#F9FAFB',
      tertiary: '#F3F4F6',
      overlay: 'rgba(0, 0, 0, 0.5)',
      card: '#FFFFFF',
    },
    text: {
      primary: '#111827',
      secondary: '#4B5563', // Improved contrast: 4.5:1 vs 3.9:1
      tertiary: '#6B7280', // Improved contrast: 4.6:1 vs 3.9:1
      inverse: '#FFFFFF',
      disabled: '#D1D5DB',
      link: '#5B21B6',
      error: '#B91C1C',
      success: '#047857',
      warning: '#B45309',
    },
    border: {
      primary: '#E5E7EB',
      secondary: '#D1D5DB',
      tertiary: '#F3F4F6',
      focus: '#5B21B6',
      error: '#F87171',
      success: '#6EE7B7',
    },
    interactive: {
      primary: '#5B21B6',
      primaryHover: '#4C1D95',
      primaryPressed: '#3730A3',
      secondary: '#F3F4F6',
      secondaryHover: '#E5E7EB',
      secondaryPressed: '#D1D5DB',
    },
  },

  // Dark theme semantic mappings
  dark: {
    background: {
      primary: '#111827',
      secondary: '#1F2937',
      tertiary: '#374151',
      elevated: '#1F2937',
      inverse: '#F9FAFB',
    },
    surface: {
      primary: '#1F2937',
      secondary: '#374151',
      tertiary: '#4B5563',
      overlay: 'rgba(0, 0, 0, 0.8)',
      card: '#1F2937',
    },
    text: {
      primary: '#F9FAFB',
      secondary: '#D1D5DB',
      tertiary: '#9CA3AF',
      inverse: '#111827',
      disabled: '#6B7280',
      link: '#A855F7',
      error: '#F87171',
      success: '#34D399',
      warning: '#FBBF24',
    },
    border: {
      primary: '#374151',
      secondary: '#4B5563',
      tertiary: '#6B7280',
      focus: '#A855F7',
      error: '#B91C1C',
      success: '#047857',
    },
    interactive: {
      primary: '#8B5CF6',
      primaryHover: '#A855F7',
      primaryPressed: '#C084FC',
      secondary: '#374151',
      secondaryHover: '#4B5563',
      secondaryPressed: '#6B7280',
    },
  },

  // Default semantic mappings (light theme for backwards compatibility)
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
    elevated: '#FFFFFF',
    inverse: '#111827',
  },

  surface: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
    overlay: 'rgba(0, 0, 0, 0.5)',
    card: '#FFFFFF',
  },

  text: {
    primary: '#111827',
    secondary: '#4B5563', // Improved contrast: 4.5:1 vs 3.9:1
    tertiary: '#6B7280', // Improved contrast: 4.6:1 vs 3.9:1
    inverse: '#FFFFFF',
    disabled: '#D1D5DB',
    link: '#5B21B6',
    error: '#B91C1C',
    success: '#047857',
    warning: '#B45309',
  },

  border: {
    primary: '#E5E7EB',
    secondary: '#D1D5DB',
    tertiary: '#F3F4F6',
    focus: '#5B21B6',
    error: '#F87171',
    success: '#6EE7B7',
  },

  // Interactive states
  interactive: {
    primary: '#5B21B6',
    primaryHover: '#4C1D95',
    primaryPressed: '#3730A3',
    secondary: '#F3F4F6',
    secondaryHover: '#E5E7EB',
    secondaryPressed: '#D1D5DB',
  },

  // Prayer-specific colors (WCAG AA compliant)
  prayer: {
    answered: '#047857',  // 7.1:1 contrast ratio
    pending: '#B45309',   // 4.5:1 contrast ratio
    private: '#6B7280',   // 4.6:1 contrast ratio
    public: '#5B21B6',    // 4.8:1 contrast ratio
    urgent: '#B91C1C',    // 5.8:1 contrast ratio
  },
} as const;

// Type definitions for better TypeScript support
export type ColorPalette = typeof colors;
export type ColorKey = keyof ColorPalette;
export type ColorShade = keyof ColorPalette[ColorKey];