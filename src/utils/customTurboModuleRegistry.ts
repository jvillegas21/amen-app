/**
 * Custom TurboModule Registry Compatibility Layer
 * Provides compatibility for the old index.ts import structure
 * This file bridges the gap between the new bridgeless polyfill and existing code
 */

import { turboModuleManager } from './turboModulePolyfill';

// Ensure the manager is installed (though bridgeless polyfill should handle this)
turboModuleManager.install();

// Export for compatibility with existing imports
export default turboModuleManager;

// Also export the manager instance for direct access
export { turboModuleManager };

console.log('🔗 CustomTurboModuleRegistry: Compatibility layer loaded');