/**
 * Centralized TurboModule Polyfill Configuration
 * Single source of truth for all TurboModule polyfills
 */

import { Platform } from 'react-native';

/**
 * Factory function to create platform-aware polyfill configuration
 * Follows Factory Pattern for creating consistent polyfill objects
 */
export const createTurboModulePolyfills = () => {
  const platformConstants = {
    getConstants: () => ({
      // Dynamic platform detection
      osVersion: Platform.Version.toString(),
      systemName: Platform.OS,
      interfaceIdiom: Platform.OS === 'ios' ? 'phone' : 'android',
      isTesting: __DEV__,
      reactNativeVersion: {
        major: 0,
        minor: 81, // Updated to match actual RN version
        patch: 4,
        prerelease: null,
      },
      // Feature flags
      forceTouchAvailable: false,
      osBuildId: null,
      systemUptime: 0,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      is24Hour: true,
      isRTL: false,
      isTablet: false,
      // Performance monitoring
      isPerformanceMonitoringEnabled: false,
      isMemoryWarning: false,
    }),
  };

  const performanceModules = {
    NativePerformanceCxx: {
      getConstants: () => ({}),
    },
    NativePerformanceObserverCxx: {
      getConstants: () => ({}),
    },
  };

  return {
    PlatformConstants: platformConstants,
    ...performanceModules,
  };
};

/**
 * Singleton instance of polyfills
 * Ensures consistency across the application
 */
let polyfillsInstance: ReturnType<typeof createTurboModulePolyfills> | null = null;

export const getTurboModulePolyfills = () => {
  if (!polyfillsInstance) {
    polyfillsInstance = createTurboModulePolyfills();
  }
  return polyfillsInstance;
};

/**
 * Type definitions for better TypeScript support
 */
export interface TurboModulePolyfill {
  getConstants: () => Record<string, any>;
}

export type TurboModulePolyfills = {
  PlatformConstants: TurboModulePolyfill;
  NativePerformanceCxx: TurboModulePolyfill;
  NativePerformanceObserverCxx: TurboModulePolyfill;
};