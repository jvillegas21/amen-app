/**
 * Custom Expo Entry Point
 * CRITICAL: Load polyfills BEFORE React Native initializes
 * This ensures TurboModules are available when RN looks for them
 */

// Load URL polyfill FIRST for network requests
require('react-native-url-polyfill/auto');

// Load TurboModule polyfills BEFORE React Native initializes
require('./src/utils/bridgelessPolyfill');

// DNS Pre-warming: Resolve Supabase hostname before app starts
// This prevents DNS lookup delays on first network request
(async () => {
  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    if (supabaseUrl) {
      console.log('🔍 Pre-warming DNS for:', supabaseUrl);

      // Make a lightweight DNS lookup
      const hostname = new URL(supabaseUrl).hostname;

      // Trigger DNS resolution without waiting
      fetch(`https://${hostname}/`, { method: 'HEAD' })
        .then(() => console.log('✓ DNS pre-warmed successfully'))
        .catch(() => console.log('⚠️ DNS pre-warm failed (non-critical)'));
    }
  } catch (error) {
    // Non-critical error, app can continue
    console.log('⚠️ DNS pre-warm error (non-critical):', error?.message);
  }
})();

// Then load Expo's standard entry point
require('expo/AppEntry');