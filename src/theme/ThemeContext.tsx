import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from './colors';
import { typography } from './typography';
import { spacing, layout, borderRadius, shadows } from './spacing';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'light' | 'dark';

interface ThemeColors {
  background: typeof colors.light.background;
  surface: typeof colors.light.surface;
  text: typeof colors.light.text;
  border: typeof colors.light.border;
  interactive: typeof colors.light.interactive;
}

interface Theme {
  colors: ThemeColors & {
    // Include base color palettes for direct access
    primary: typeof colors.primary;
    secondary: typeof colors.secondary;
    success: typeof colors.success;
    warning: typeof colors.warning;
    error: typeof colors.error;
    info: typeof colors.info;
    neutral: typeof colors.neutral;
    prayer: typeof colors.prayer;
  };
  typography: typeof typography;
  spacing: typeof spacing;
  layout: typeof layout;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  isDark: boolean;
}

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  colorScheme: ColorScheme;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = '@amen_app_theme_mode';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const createTheme = (colorScheme: ColorScheme): Theme => {
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;

  return {
    colors: {
      ...themeColors,
      // Include base color palettes
      primary: colors.primary,
      secondary: colors.secondary,
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
      info: colors.info,
      neutral: colors.neutral,
      prayer: colors.prayer,
    },
    typography,
    spacing,
    layout,
    borderRadius,
    shadows,
    isDark: colorScheme === 'dark',
  };
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [systemColorScheme, setSystemColorScheme] = useState<ColorScheme>(
    (Appearance.getColorScheme() as ColorScheme) || 'light'
  );

  // Determine the actual color scheme based on mode and system preference
  const colorScheme: ColorScheme =
    themeMode === 'system' ? systemColorScheme : themeMode;

  const theme = createTheme(colorScheme);

  // Load saved theme mode on mount
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setThemeModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        console.error('Failed to load theme mode:', error);
      }
    };

    loadThemeMode();
  }, []);

  // Listen to system appearance changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme((colorScheme as ColorScheme) || 'light');
    });

    return () => subscription?.remove();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Failed to save theme mode:', error);
      // Still update the state even if storage fails
      setThemeModeState(mode);
    }
  };

  const toggleTheme = () => {
    const currentScheme = themeMode === 'system' ? systemColorScheme : themeMode;
    const newMode = currentScheme === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };

  const value: ThemeContextType = {
    theme,
    themeMode,
    colorScheme,
    setThemeMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook for components that only need the theme object
export const useThemeColors = () => {
  const { theme } = useTheme();
  return theme;
};

// Hook for accessing theme mode controls
export const useThemeMode = () => {
  const { themeMode, colorScheme, setThemeMode, toggleTheme } = useTheme();
  return { themeMode, colorScheme, setThemeMode, toggleTheme };
};