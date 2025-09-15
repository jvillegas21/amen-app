/**
 * Unified TurboModule Manager
 * Consolidated, maintainable solution for TurboModule polyfills in React Native 0.73+
 */

import { Platform } from 'react-native';

export interface TurboModulePolyfill {
  name: string;
  factory: () => any;
  version: string;
}

export interface TurboModuleConstants {
  [key: string]: any;
}

export class TurboModuleManager {
  private static instance: TurboModuleManager;
  private polyfills: Map<string, TurboModulePolyfill> = new Map();
  private isInstalled: boolean = false;
  private originalGetEnforcing: ((name: string) => any) | null = null;

  private constructor() {
    this.initializePolyfills();
  }

  static getInstance(): TurboModuleManager {
    if (!TurboModuleManager.instance) {
      TurboModuleManager.instance = new TurboModuleManager();
    }
    return TurboModuleManager.instance;
  }

  private initializePolyfills(): void {
    this.registerPolyfill({
      name: 'PlatformConstants',
      version: '1.0.0',
      factory: () => ({
        getConstants: (): TurboModuleConstants => ({
          osVersion: Platform.Version,
          systemName: Platform.OS,
          interfaceIdiom: Platform.OS === 'ios' ? 'phone' : 'android',
          isTesting: __DEV__,
          reactNativeVersion: {
            major: 0,
            minor: 73,
            patch: 11,
            prerelease: null
          },
          forceTouchAvailable: false,
          osBuildId: null,
          systemUptime: 0,
          timezone: this.getTimezone(),
          is24Hour: true,
          isRTL: false,
          isTablet: (Platform as any).isPad || false,
          isPerformanceMonitoringEnabled: false,
          isMemoryWarning: false,
        }),
      }),
    });

    this.registerPolyfill({
      name: 'NativePerformanceCxx',
      version: '1.0.0',
      factory: () => ({
        getConstants: () => ({}),
      }),
    });

    this.registerPolyfill({
      name: 'NativePerformanceObserverCxx',
      version: '1.0.0',
      factory: () => ({
        getConstants: () => ({}),
      }),
    });
  }

  private getTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }

  public registerPolyfill(polyfill: TurboModulePolyfill): void {
    this.polyfills.set(polyfill.name, polyfill);
  }

  public getPolyfill(name: string): any | null {
    const polyfill = this.polyfills.get(name);
    return polyfill ? polyfill.factory() : null;
  }

  public install(): boolean {
    if (this.isInstalled) {
      console.warn('TurboModuleManager: Already installed');
      return true;
    }

    try {
      let success = false;

      // Strategy 1: Patch TurboModuleRegistry if available
      const TurboModuleRegistry = this.getTurboModuleRegistry();
      if (TurboModuleRegistry && TurboModuleRegistry.getEnforcing) {
        this.originalGetEnforcing = TurboModuleRegistry.getEnforcing;
        TurboModuleRegistry.getEnforcing = this.createPolyfillHandler();
        success = true;
        console.log('TurboModuleManager: Patched TurboModuleRegistry.getEnforcing');
      }

      // Strategy 2: Install global polyfills for Bridgeless mode
      this.installGlobalPolyfills();
      success = true;

      // Strategy 3: Patch require function as fallback
      this.patchRequireFunction();

      this.isInstalled = true;
      console.log(`TurboModuleManager: Installed with ${this.polyfills.size} polyfills (multiple strategies)`);
      return success;
    } catch (error) {
      console.error('TurboModuleManager: Installation failed', error);
      return false;
    }
  }

  private getTurboModuleRegistry(): any {
    try {
      // Try multiple ways to access TurboModuleRegistry
      let registry = null;

      // Method 1: Direct require
      try {
        registry = require('react-native/Libraries/TurboModule/TurboModuleRegistry').TurboModuleRegistry;
      } catch {}

      // Method 2: Check global
      if (!registry && (global as any).__turboModuleProxy) {
        registry = (global as any).__turboModuleProxy;
      }

      // Method 3: Check if TurboModuleRegistry is on global directly
      if (!registry && (global as any).TurboModuleRegistry) {
        registry = (global as any).TurboModuleRegistry;
      }

      return registry;
    } catch (error) {
      console.warn('TurboModuleManager: Could not access TurboModuleRegistry', error);
      return null;
    }
  }

  private createPolyfillHandler() {
    return (name: string) => {
      try {
        if (this.originalGetEnforcing) {
          return this.originalGetEnforcing(name);
        }
        throw new Error(`Original TurboModuleRegistry.getEnforcing not available`);
      } catch (error) {
        const polyfill = this.getPolyfill(name);
        if (polyfill) {
          console.warn(`TurboModuleManager: Using polyfill for '${name}'`);
          return polyfill;
        }
        console.error(`TurboModuleManager: No polyfill available for '${name}'`);
        throw error;
      }
    };
  }

  public uninstall(): boolean {
    if (!this.isInstalled || !this.originalGetEnforcing) {
      return false;
    }

    try {
      const TurboModuleRegistry = this.getTurboModuleRegistry();
      if (TurboModuleRegistry) {
        TurboModuleRegistry.getEnforcing = this.originalGetEnforcing;
      }

      this.originalGetEnforcing = null;
      this.isInstalled = false;
      console.log('TurboModuleManager: Uninstalled');
      return true;
    } catch (error) {
      console.error('TurboModuleManager: Uninstallation failed', error);
      return false;
    }
  }

  private installGlobalPolyfills(): void {
    const globalObj = global as any;

    // Install polyfills directly on global for Bridgeless mode
    for (const [name, polyfill] of this.polyfills.entries()) {
      try {
        const moduleInstance = polyfill.factory();
        globalObj[`__TURBO_MODULE_${name}__`] = moduleInstance;
        console.log(`TurboModuleManager: Installed global polyfill for ${name}`);
      } catch (error) {
        console.warn(`TurboModuleManager: Failed to install global polyfill for ${name}:`, error);
      }
    }

    // Create a custom getEnforcing function on global
    globalObj.__TURBO_MODULE_GET_ENFORCING__ = (name: string) => {
      const polyfill = this.getPolyfill(name);
      if (polyfill) {
        console.warn(`TurboModuleManager: Using global polyfill for '${name}'`);
        return polyfill;
      }
      throw new Error(`TurboModule '${name}' could not be found`);
    };
  }

  private patchRequireFunction(): void {
    const originalRequire = require;

    (require as any) = function(id: string) {
      // Intercept TurboModuleRegistry requires
      if (id.includes('TurboModuleRegistry')) {
        try {
          const module = originalRequire(id);

          if (module && module.TurboModuleRegistry && module.TurboModuleRegistry.getEnforcing) {
            const originalGetEnforcing = module.TurboModuleRegistry.getEnforcing;

            module.TurboModuleRegistry.getEnforcing = (name: string) => {
              try {
                return originalGetEnforcing(name);
              } catch (error) {
                const polyfill = turboModuleManager.getPolyfill(name);
                if (polyfill) {
                  console.warn(`TurboModuleManager: Using require-intercepted polyfill for '${name}'`);
                  return polyfill;
                }
                throw error;
              }
            };

            console.log('TurboModuleManager: Patched TurboModuleRegistry via require interception');
          }

          return module;
        } catch (error) {
          console.warn('TurboModuleManager: Could not patch via require interception:', error);
          return originalRequire(id);
        }
      }

      return originalRequire(id);
    } as any;

    // Copy over require properties
    Object.setPrototypeOf(require, Object.getPrototypeOf(originalRequire));
    Object.defineProperties(require, Object.getOwnPropertyDescriptors(originalRequire));
  }

  public getStatus(): {
    installed: boolean;
    polyfillCount: number;
    polyfills: string[];
  } {
    return {
      installed: this.isInstalled,
      polyfillCount: this.polyfills.size,
      polyfills: Array.from(this.polyfills.keys()),
    };
  }
}

export const turboModuleManager = TurboModuleManager.getInstance();