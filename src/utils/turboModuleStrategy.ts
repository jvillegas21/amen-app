/**
 * TurboModule Fix Strategy Pattern Implementation
 * Provides a clean, maintainable approach to applying TurboModule fixes
 */

import { getTurboModulePolyfills } from './turboModuleConfig';

/**
 * Base strategy interface following Strategy Pattern
 */
export interface TurboModuleFixStrategy {
  name: string;
  priority: number; // Lower number = higher priority
  canApply(): boolean;
  apply(): boolean;
  cleanup?(): void;
}

/**
 * Registry patch strategy - modifies existing TurboModuleRegistry
 */
export class RegistryPatchStrategy implements TurboModuleFixStrategy {
  name = 'RegistryPatch';
  priority = 1;

  canApply(): boolean {
    try {
      require('react-native/Libraries/TurboModule/TurboModuleRegistry');
      return true;
    } catch {
      return false;
    }
  }

  apply(): boolean {
    try {
      const { TurboModuleRegistry } = require('react-native/Libraries/TurboModule/TurboModuleRegistry');
      const originalGetEnforcing = TurboModuleRegistry.getEnforcing;
      const polyfills = getTurboModulePolyfills();

      TurboModuleRegistry.getEnforcing = (name: string) => {
        try {
          return originalGetEnforcing(name);
        } catch (error) {
          if (polyfills[name as keyof typeof polyfills]) {
            console.debug(`[RegistryPatch] Using polyfill for: ${name}`);
            return polyfills[name as keyof typeof polyfills];
          }
          throw error;
        }
      };

      console.log('[RegistryPatch] Successfully applied');
      return true;
    } catch (error) {
      console.warn('[RegistryPatch] Failed to apply:', error);
      return false;
    }
  }
}

/**
 * Global object patch strategy - modifies global scope
 */
export class GlobalPatchStrategy implements TurboModuleFixStrategy {
  name = 'GlobalPatch';
  priority = 2;

  canApply(): boolean {
    return typeof global !== 'undefined';
  }

  apply(): boolean {
    try {
      const globalObj = global as any;
      const polyfills = getTurboModulePolyfills();

      globalObj.__TURBO_MODULE_POLYFILLS__ = polyfills;

      if (globalObj.TurboModuleRegistry?.getEnforcing) {
        const originalGetEnforcing = globalObj.TurboModuleRegistry.getEnforcing;

        globalObj.TurboModuleRegistry.getEnforcing = (name: string) => {
          try {
            return originalGetEnforcing(name);
          } catch (error) {
            if (polyfills[name as keyof typeof polyfills]) {
              console.debug(`[GlobalPatch] Using polyfill for: ${name}`);
              return polyfills[name as keyof typeof polyfills];
            }
            throw error;
          }
        };
      }

      console.log('[GlobalPatch] Successfully applied');
      return true;
    } catch (error) {
      console.warn('[GlobalPatch] Failed to apply:', error);
      return false;
    }
  }
}

/**
 * Strategy manager - coordinates application of fixes
 */
export class TurboModuleFixManager {
  private strategies: TurboModuleFixStrategy[] = [];
  private appliedStrategy: TurboModuleFixStrategy | null = null;

  constructor() {
    // Register strategies in priority order
    this.strategies = [
      new RegistryPatchStrategy(),
      new GlobalPatchStrategy(),
    ];
  }

  /**
   * Apply the first viable strategy
   */
  applyFix(): boolean {
    // Sort by priority
    const sortedStrategies = [...this.strategies].sort((a, b) => a.priority - b.priority);

    for (const strategy of sortedStrategies) {
      if (strategy.canApply()) {
        console.log(`[TurboModuleFixManager] Attempting strategy: ${strategy.name}`);
        if (strategy.apply()) {
          this.appliedStrategy = strategy;
          return true;
        }
      }
    }

    console.error('[TurboModuleFixManager] No strategy could be applied');
    return false;
  }

  /**
   * Clean up applied fixes
   */
  cleanup(): void {
    if (this.appliedStrategy?.cleanup) {
      this.appliedStrategy.cleanup();
    }
  }

  /**
   * Get status information
   */
  getStatus(): { applied: boolean; strategy: string | null } {
    return {
      applied: this.appliedStrategy !== null,
      strategy: this.appliedStrategy?.name || null,
    };
  }
}

// Singleton instance
let managerInstance: TurboModuleFixManager | null = null;

export const getTurboModuleFixManager = (): TurboModuleFixManager => {
  if (!managerInstance) {
    managerInstance = new TurboModuleFixManager();
  }
  return managerInstance;
};