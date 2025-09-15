/**
 * Preload script to fix TurboModule issues before React Native loads
 * This file must be loaded before any other React Native code
 */

// Store original require
const originalRequire = require;

// Override require to intercept TurboModuleRegistry
require = function(id) {
  if (id.includes('TurboModuleRegistry')) {
    try {
      const module = originalRequire(id);
      
      if (module && module.getEnforcing) {
        const originalGetEnforcing = module.getEnforcing;
        
        // Create polyfills for missing modules
        const polyfills = {
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
          NativePerformanceCxx: {
            getConstants: () => ({}),
          },
          NativePerformanceObserverCxx: {
            getConstants: () => ({}),
          },
        };
        
        // Override getEnforcing to use polyfills
        module.getEnforcing = function(name) {
          try {
            return originalGetEnforcing(name);
          } catch (error) {
            if (polyfills[name]) {
              console.warn(`Using preload polyfill for TurboModule: ${name}`);
              return polyfills[name];
            }
            throw error;
          }
        };
        
        console.log('Preload TurboModule fix applied');
      }
      
      return module;
    } catch (error) {
      console.warn('Could not apply preload TurboModule fix:', error);
      return originalRequire(id);
    }
  }
  
  return originalRequire(id);
};

// Mark that preload has run
global.__TURBO_MODULE_PRELOAD_FIX__ = true;
