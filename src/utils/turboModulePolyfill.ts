/**
 * TurboModule Polyfill Entry Point
 * Auto-installs the unified TurboModule manager
 * Import this file early in your app to fix TurboModule issues
 */

// IMPORTANT: Install polyfills IMMEDIATELY, before any other imports
(() => {
  console.log('TurboModulePolyfill: Initializing early polyfill installation...');

  // Emergency polyfill installation for Bridgeless mode
  const globalObj = global as any;

  // Create emergency polyfills directly on global
  const emergencyPolyfills = {
    PlatformConstants: {
      getConstants: () => ({
        osVersion: '17.0',
        systemName: 'iOS',
        interfaceIdiom: 'phone',
        isTesting: __DEV__,
        reactNativeVersion: { major: 0, minor: 73, patch: 11, prerelease: null },
        forceTouchAvailable: false,
        osBuildId: null,
        systemUptime: 0,
        timezone: 'UTC',
        is24Hour: true,
        isRTL: false,
        isTablet: false,
        isPerformanceMonitoringEnabled: false,
        isMemoryWarning: false,
      }),
    },
    NativePerformanceCxx: { getConstants: () => ({}) },
    NativePerformanceObserverCxx: { getConstants: () => ({}) },
  };

  // Install emergency polyfills
  Object.entries(emergencyPolyfills).forEach(([name, polyfill]) => {
    globalObj[`__TURBO_MODULE_${name}__`] = polyfill;
  });

  // Create emergency getEnforcing function
  globalObj.__TURBO_MODULE_GET_ENFORCING__ = (name: string) => {
    const polyfill = (emergencyPolyfills as any)[name];
    if (polyfill) {
      console.warn(`TurboModulePolyfill: Using emergency polyfill for '${name}'`);
      return polyfill;
    }
    throw new Error(`TurboModule '${name}' could not be found`);
  };

  // Patch require immediately
  const originalRequire = require;
  (require as any) = function(id: string) {
    if (id.includes('TurboModuleRegistry')) {
      try {
        const module = originalRequire(id);

        if (module && module.TurboModuleRegistry && module.TurboModuleRegistry.getEnforcing) {
          const originalGetEnforcing = module.TurboModuleRegistry.getEnforcing;

          module.TurboModuleRegistry.getEnforcing = (name: string) => {
            try {
              return originalGetEnforcing(name);
            } catch (error) {
              const polyfill = (emergencyPolyfills as any)[name];
              if (polyfill) {
                console.warn(`TurboModulePolyfill: Using emergency require-intercepted polyfill for '${name}'`);
                return polyfill;
              }
              throw error;
            }
          };

          console.log('TurboModulePolyfill: Emergency patched TurboModuleRegistry');
        }

        return module;
      } catch (error) {
        return originalRequire(id);
      }
    }
    return originalRequire(id);
  } as any;

  Object.setPrototypeOf(require, Object.getPrototypeOf(originalRequire));
  Object.defineProperties(require, Object.getOwnPropertyDescriptors(originalRequire));

  console.log('TurboModulePolyfill: Emergency polyfill installation complete');
})();

import { turboModuleManager } from './turboModuleManager';

// Auto-install the proper manager as well
const success = turboModuleManager.install();

if (!success) {
  console.warn('TurboModulePolyfill: Manager installation failed, using emergency polyfills');
} else {
  console.log('TurboModulePolyfill: Manager installation successful');
}

// Export manager for manual control if needed
export { turboModuleManager };
export { TurboModuleManager } from './turboModuleManager';
export type { TurboModulePolyfill, TurboModuleConstants } from './turboModuleManager';