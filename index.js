/**
 * Custom Expo Entry Point
 * CRITICAL: Load polyfills BEFORE React Native initializes
 * This ensures TurboModules are available when RN looks for them
 */

// Load polyfills BEFORE React Native initializes
require('./src/utils/bridgelessPolyfill');

// Then load Expo's standard entry point
require('expo/AppEntry');