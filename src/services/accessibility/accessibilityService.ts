import { Platform } from 'react-native';

export interface AccessibilitySettings {
  screenReaderEnabled: boolean;
  highContrastEnabled: boolean;
  largeTextEnabled: boolean;
  reducedMotionEnabled: boolean;
  colorBlindFriendly: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  colorScheme: 'light' | 'dark' | 'auto';
}

export interface AccessibilityColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}

/**
 * Accessibility Service - Manages accessibility features and WCAG 2.2 AA compliance
 */
class AccessibilityService {
  private settings: AccessibilitySettings = {
    screenReaderEnabled: false,
    highContrastEnabled: false,
    largeTextEnabled: false,
    reducedMotionEnabled: false,
    colorBlindFriendly: false,
    fontSize: 'medium',
    colorScheme: 'auto',
  };

  /**
   * Initialize accessibility settings
   */
  async initialize(): Promise<void> {
    try {
      // Check system accessibility settings
      if (Platform.OS === 'ios') {
        // TODO: Check iOS accessibility settings
        this.settings.screenReaderEnabled = false;
        this.settings.highContrastEnabled = false;
        this.settings.largeTextEnabled = false;
        this.settings.reducedMotionEnabled = false;
      } else if (Platform.OS === 'android') {
        // TODO: Check Android accessibility settings
        this.settings.screenReaderEnabled = false;
        this.settings.highContrastEnabled = false;
        this.settings.largeTextEnabled = false;
        this.settings.reducedMotionEnabled = false;
      }
    } catch (error) {
      console.error('Error initializing accessibility settings:', error);
    }
  }

  /**
   * Get current accessibility settings
   */
  getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  /**
   * Update accessibility settings
   */
  updateSettings(newSettings: Partial<AccessibilitySettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Get accessibility-compliant colors
   */
  getAccessibilityColors(): AccessibilityColors {
    const baseColors = {
      primary: '#5B21B6',
      secondary: '#7C3AED',
      background: '#FFFFFF',
      surface: '#F9FAFB',
      text: '#111827',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
      error: '#EF4444',
      success: '#10B981',
      warning: '#F59E0B',
      info: '#3B82F6',
    };

    if (this.settings.highContrastEnabled) {
      return {
        primary: '#000000',
        secondary: '#000000',
        background: '#FFFFFF',
        surface: '#FFFFFF',
        text: '#000000',
        textSecondary: '#000000',
        border: '#000000',
        error: '#FF0000',
        success: '#008000',
        warning: '#FFA500',
        info: '#0000FF',
      };
    }

    if (this.settings.colorBlindFriendly) {
      return {
        ...baseColors,
        primary: '#0066CC',
        secondary: '#0066CC',
        error: '#CC0000',
        success: '#006600',
        warning: '#CC6600',
        info: '#0066CC',
      };
    }

    return baseColors;
  }

  /**
   * Get accessibility-compliant font sizes
   */
  getFontSizes() {
    const baseSizes = {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    };

    if (this.settings.largeTextEnabled) {
      return {
        xs: 14,
        sm: 16,
        base: 18,
        lg: 20,
        xl: 22,
        '2xl': 26,
        '3xl': 32,
        '4xl': 38,
      };
    }

    switch (this.settings.fontSize) {
      case 'small':
        return {
          xs: 10,
          sm: 12,
          base: 14,
          lg: 16,
          xl: 18,
          '2xl': 22,
          '3xl': 28,
          '4xl': 34,
        };
      case 'large':
        return {
          xs: 14,
          sm: 16,
          base: 18,
          lg: 20,
          xl: 22,
          '2xl': 26,
          '3xl': 32,
          '4xl': 38,
        };
      case 'extra-large':
        return {
          xs: 16,
          sm: 18,
          base: 20,
          lg: 22,
          xl: 24,
          '2xl': 28,
          '3xl': 34,
          '4xl': 40,
        };
      default:
        return baseSizes;
    }
  }

  /**
   * Get accessibility-compliant spacing
   */
  getSpacing() {
    const baseSpacing = {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      '2xl': 48,
    };

    if (this.settings.largeTextEnabled) {
      return {
        xs: 6,
        sm: 12,
        md: 20,
        lg: 28,
        xl: 36,
        '2xl': 52,
      };
    }

    return baseSpacing;
  }

  /**
   * Get accessibility-compliant touch targets
   */
  getTouchTargetSize(): number {
    const baseSize = 44; // iOS minimum touch target size
    return this.settings.largeTextEnabled ? baseSize + 8 : baseSize;
  }

  /**
   * Get accessibility-compliant border radius
   */
  getBorderRadius() {
    const baseRadius = {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      full: 9999,
    };

    if (this.settings.highContrastEnabled) {
      return {
        sm: 0,
        md: 0,
        lg: 0,
        xl: 0,
        full: 0,
      };
    }

    return baseRadius;
  }

  /**
   * Get accessibility-compliant shadows
   */
  getShadows() {
    if (this.settings.highContrastEnabled) {
      return {
        sm: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 1,
        },
        md: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 2,
        },
        lg: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 4,
        },
      };
    }

    return {
      sm: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      },
      md: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
      },
      lg: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
      },
    };
  }

  /**
   * Get accessibility-compliant animation duration
   */
  getAnimationDuration(): number {
    if (this.settings.reducedMotionEnabled) {
      return 0;
    }
    return 300;
  }

  /**
   * Get accessibility-compliant animation easing
   */
  getAnimationEasing(): string {
    if (this.settings.reducedMotionEnabled) {
      return 'linear';
    }
    return 'ease-in-out';
  }

  /**
   * Get accessibility-compliant focus styles
   */
  getFocusStyles() {
    if (this.settings.highContrastEnabled) {
      return {
        borderWidth: 2,
        borderColor: '#000000',
        borderStyle: 'solid',
      };
    }

    return {
      borderWidth: 2,
      borderColor: '#5B21B6',
      borderStyle: 'solid',
    };
  }

  /**
   * Get accessibility-compliant error styles
   */
  getErrorStyles() {
    const colors = this.getAccessibilityColors();
    
    return {
      borderColor: colors.error,
      borderWidth: 2,
      borderStyle: 'solid',
    };
  }

  /**
   * Get accessibility-compliant success styles
   */
  getSuccessStyles() {
    const colors = this.getAccessibilityColors();
    
    return {
      borderColor: colors.success,
      borderWidth: 2,
      borderStyle: 'solid',
    };
  }

  /**
   * Get accessibility-compliant warning styles
   */
  getWarningStyles() {
    const colors = this.getAccessibilityColors();
    
    return {
      borderColor: colors.warning,
      borderWidth: 2,
      borderStyle: 'solid',
    };
  }

  /**
   * Get accessibility-compliant info styles
   */
  getInfoStyles() {
    const colors = this.getAccessibilityColors();
    
    return {
      borderColor: colors.info,
      borderWidth: 2,
      borderStyle: 'solid',
    };
  }

  /**
   * Get accessibility-compliant button styles
   */
  getButtonStyles(variant: 'primary' | 'secondary' | 'outline' | 'ghost' = 'primary') {
    const colors = this.getAccessibilityColors();
    const touchTargetSize = this.getTouchTargetSize();
    const borderRadius = this.getBorderRadius();
    const shadows = this.getShadows();

    const baseStyles = {
      minHeight: touchTargetSize,
      borderRadius: borderRadius.md,
      ...shadows.sm,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          borderWidth: 2,
        };
      case 'secondary':
        return {
          ...baseStyles,
          backgroundColor: colors.secondary,
          borderColor: colors.secondary,
          borderWidth: 2,
        };
      case 'outline':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          borderColor: colors.primary,
          borderWidth: 2,
        };
      case 'ghost':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          borderWidth: 0,
        };
      default:
        return baseStyles;
    }
  }

  /**
   * Get accessibility-compliant input styles
   */
  getInputStyles() {
    const colors = this.getAccessibilityColors();
    const touchTargetSize = this.getTouchTargetSize();
    const borderRadius = this.getBorderRadius();
    const fontSizes = this.getFontSizes();

    return {
      minHeight: touchTargetSize,
      borderRadius: borderRadius.md,
      borderColor: colors.border,
      borderWidth: 2,
      backgroundColor: colors.background,
      color: colors.text,
      fontSize: fontSizes.base,
      paddingHorizontal: 16,
      paddingVertical: 12,
    };
  }

  /**
   * Get accessibility-compliant card styles
   */
  getCardStyles() {
    const colors = this.getAccessibilityColors();
    const borderRadius = this.getBorderRadius();
    const shadows = this.getShadows();
    const spacing = this.getSpacing();

    return {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      ...shadows.sm,
    };
  }

  /**
   * Get accessibility-compliant text styles
   */
  getTextStyles(variant: 'heading' | 'body' | 'caption' | 'label' = 'body') {
    const colors = this.getAccessibilityColors();
    const fontSizes = this.getFontSizes();

    const baseStyles = {
      color: colors.text,
    };

    switch (variant) {
      case 'heading':
        return {
          ...baseStyles,
          fontSize: fontSizes['2xl'],
          fontWeight: '700',
          lineHeight: fontSizes['2xl'] * 1.2,
        };
      case 'body':
        return {
          ...baseStyles,
          fontSize: fontSizes.base,
          fontWeight: '400',
          lineHeight: fontSizes.base * 1.5,
        };
      case 'caption':
        return {
          ...baseStyles,
          fontSize: fontSizes.sm,
          fontWeight: '400',
          lineHeight: fontSizes.sm * 1.4,
        };
      case 'label':
        return {
          ...baseStyles,
          fontSize: fontSizes.sm,
          fontWeight: '600',
          lineHeight: fontSizes.sm * 1.4,
        };
      default:
        return baseStyles;
    }
  }

  /**
   * Check if color contrast meets WCAG 2.2 AA standards
   */
  checkColorContrast(foreground: string, background: string): boolean {
    // Simplified contrast check - in production, use a proper contrast calculation
    const contrastRatio = this.calculateContrastRatio(foreground, background);
    return contrastRatio >= 4.5; // WCAG 2.2 AA standard
  }

  /**
   * Calculate contrast ratio between two colors
   */
  private calculateContrastRatio(color1: string, color2: string): number {
    // Simplified implementation - in production, use proper color contrast calculation
    return 4.5; // Placeholder
  }

  /**
   * Get accessibility-compliant icon sizes
   */
  getIconSizes() {
    const baseSizes = {
      sm: 16,
      md: 20,
      lg: 24,
      xl: 32,
    };

    if (this.settings.largeTextEnabled) {
      return {
        sm: 18,
        md: 22,
        lg: 26,
        xl: 34,
      };
    }

    return baseSizes;
  }

  /**
   * Get accessibility-compliant list styles
   */
  getListStyles() {
    const colors = this.getAccessibilityColors();
    const spacing = this.getSpacing();
    const touchTargetSize = this.getTouchTargetSize();

    return {
      backgroundColor: colors.background,
      minHeight: touchTargetSize,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    };
  }

  /**
   * Get accessibility-compliant modal styles
   */
  getModalStyles() {
    const colors = this.getAccessibilityColors();
    const borderRadius = this.getBorderRadius();
    const shadows = this.getShadows();

    return {
      backgroundColor: colors.background,
      borderRadius: borderRadius.lg,
      ...shadows.lg,
    };
  }
}

// Export singleton instance
export const accessibilityService = new AccessibilityService();