/**
 * Unified TurboModule Fix Entry Point
 * Single, clean interface for applying TurboModule compatibility fixes
 *
 * Architecture: This module follows SOLID principles:
 * - Single Responsibility: Only handles TurboModule fixes
 * - Open/Closed: New strategies can be added without modifying existing code
 * - Dependency Inversion: Depends on abstractions (strategies) not concrete implementations
 */

import { getTurboModuleFixManager } from './turboModuleStrategy';

/**
 * Apply TurboModule fixes using the best available strategy
 * This should be called as early as possible in the application lifecycle
 */
export const applyTurboModuleFix = (): boolean => {
  const manager = getTurboModuleFixManager();

  try {
    const success = manager.applyFix();

    if (success) {
      const status = manager.getStatus();
      console.log(`✅ TurboModule fix applied successfully using ${status.strategy} strategy`);
    } else {
      console.warn('⚠️ TurboModule fix could not be applied, app may experience issues');
    }

    return success;
  } catch (error) {
    console.error('❌ Critical error applying TurboModule fix:', error);
    return false;
  }
};

/**
 * Get the current status of TurboModule fixes
 */
export const getTurboModuleFixStatus = () => {
  const manager = getTurboModuleFixManager();
  return manager.getStatus();
};

/**
 * Clean up any applied fixes (useful for testing)
 */
export const cleanupTurboModuleFix = () => {
  const manager = getTurboModuleFixManager();
  manager.cleanup();
};

// Auto-apply fix when module is imported
applyTurboModuleFix();