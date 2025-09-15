/**
 * Enhanced Bridgeless Mode TurboModule Polyfill
 * CRITICAL: Must be plain JS for early loading before React Native initialization
 *
 * This polyfill installs TurboModules on the global object BEFORE React Native
 * has a chance to look for them, preventing the "could not be found" errors.
 */

(function() {
  'use strict';

  console.log('🚀🚀🚀 BridgelessPolyfill: STARTING ENHANCED INSTALLATION...');
  console.log('🔧 BridgelessPolyfill: This should appear BEFORE any TurboModule errors!');

  const globalObj = global;

  // Get platform information for realistic constants
  const getPlatformInfo = () => {
    let osVersion = '17.0';
    let systemName = 'iOS';
    let interfaceIdiom = 'phone';

    try {
      if (typeof navigator !== 'undefined') {
        if (navigator.product === 'ReactNative') {
          systemName = globalObj.__fbBatchedBridgeConfig?.os || 'iOS';
          osVersion = globalObj.__fbBatchedBridgeConfig?.osVersion || '17.0';
        }
      }
    } catch (e) {
      // Fallback to defaults
    }

    return { osVersion, systemName, interfaceIdiom };
  };

  const { osVersion, systemName, interfaceIdiom } = getPlatformInfo();

  // Create comprehensive TurboModule polyfills
  const turboModules = {
    PlatformConstants: {
      getConstants: () => ({
        osVersion: osVersion,
        systemName: systemName,
        interfaceIdiom: interfaceIdiom,
        isTesting: __DEV__ || false,
        reactNativeVersion: {
          major: 0,
          minor: 81,
          patch: 4,
          prerelease: null
        },
        forceTouchAvailable: false,
        osBuildId: null,
        systemUptime: 0,
        timezone: (() => {
          try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
          } catch {
            return 'UTC';
          }
        })(),
        is24Hour: true,
        isRTL: false,
        isTablet: interfaceIdiom === 'pad',
        isPerformanceMonitoringEnabled: false,
        isMemoryWarning: false,
        // Add additional constants that might be expected
        Dimensions: {
          window: { width: 375, height: 812, scale: 2, fontScale: 1 },
          screen: { width: 375, height: 812, scale: 2, fontScale: 1 }
        }
      }),
    },

    NativePerformanceCxx: {
      getConstants: () => ({}),
      mark: () => {},
      measure: () => {},
      getSimpleMemoryInfo: () => ({}),
    },

    NativePerformanceObserverCxx: {
      getConstants: () => ({}),
      observe: () => {},
      disconnect: () => {},
    },
  };

  // Enhanced installation strategy
  const installTurboModules = () => {
    // Strategy 1: Create mock TurboModuleRegistry before RN creates it
    if (!globalObj.__turboModuleProxy) {
      globalObj.__turboModuleProxy = turboModules;
      console.log('✅ BridgelessPolyfill: Installed __turboModuleProxy');
    }

    // Strategy 2: Install TurboModuleRegistry with polyfills
    if (!globalObj.TurboModuleRegistry) {
      globalObj.TurboModuleRegistry = {
        getEnforcing: (name) => {
          if (turboModules[name]) {
            console.warn(`🔧 BridgelessPolyfill: Providing polyfill for TurboModule '${name}'`);
            return turboModules[name];
          }
          throw new Error(`TurboModuleRegistry.getEnforcing(...): '${name}' could not be found. Verify that a module by this name is registered in the native binary.`);
        },
        get: (name) => {
          return turboModules[name] || null;
        }
      };
      console.log('✅ BridgelessPolyfill: Created global TurboModuleRegistry');
    }

    // Strategy 3: Install on multiple possible global locations
    const installLocations = [
      '__turboModuleProxy',
      'TurboModuleRegistry',
      '__TurboModuleRegistry',
      'nativeFabricUIManager',
    ];

    installLocations.forEach(location => {
      if (!globalObj[location] && location !== 'TurboModuleRegistry') {
        globalObj[location] = turboModules;
      }
    });

    // Strategy 4: Install individual modules on global
    Object.keys(turboModules).forEach(moduleName => {
      globalObj[moduleName] = turboModules[moduleName];
    });
  };

  // Install immediately
  installTurboModules();

  // Strategy 5: Enhanced require patching
  const originalRequire = require;

  require = function(id) {
    // Intercept TurboModuleRegistry requires
    if (typeof id === 'string' && id.includes('TurboModuleRegistry')) {
      try {
        const module = originalRequire(id);

        // Patch the module if it has TurboModuleRegistry
        if (module && module.TurboModuleRegistry) {
          const originalGetEnforcing = module.TurboModuleRegistry.getEnforcing;

          module.TurboModuleRegistry.getEnforcing = (name) => {
            try {
              return originalGetEnforcing(name);
            } catch (error) {
              if (turboModules[name]) {
                console.warn(`🔧 BridgelessPolyfill: Intercepted require for '${name}'`);
                return turboModules[name];
              }
              throw error;
            }
          };
        }

        return module;
      } catch (error) {
        console.warn('BridgelessPolyfill: Could not patch required TurboModuleRegistry:', error);
        return originalRequire(id);
      }
    }

    return originalRequire(id);
  };

  // Copy require properties to maintain compatibility
  Object.setPrototypeOf(require, Object.getPrototypeOf(originalRequire));
  Object.defineProperties(require, Object.getOwnPropertyDescriptors(originalRequire));

  // Strategy 6: Set up early error handler for debugging
  const originalErrorHandler = globalObj.ErrorUtils?.reportFatalError;
  if (originalErrorHandler && typeof originalErrorHandler === 'function') {
    globalObj.ErrorUtils.reportFatalError = (error) => {
      if (error && error.message && error.message.includes('PlatformConstants')) {
        console.error('🚨 BridgelessPolyfill: TurboModule error still occurred:', error.message);
        console.error('This should not happen - our polyfills should have caught this!');
      }
      return originalErrorHandler(error);
    };
  }

  // Strategy 7: Force disable bridgeless mode if possible
  if (globalObj.__turboModuleProxy) {
    globalObj.__turboModuleProxy.__bridgelessMode = false;
  }

  // Mark installation complete
  globalObj.__BRIDGELESS_POLYFILL_INSTALLED__ = true;

  console.log('✅✅✅ BridgelessPolyfill: ENHANCED INSTALLATION COMPLETE!');
  console.log('📦 Installed modules:', Object.keys(turboModules));
  console.log('🎯 BridgelessPolyfill: TurboModules should now be available before React Native needs them');

})();