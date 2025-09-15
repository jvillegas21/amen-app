const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Explicitly disable new architecture features
config.resolver.unstable_enablePackageExports = false;
config.resolver.unstable_conditionNames = ['react-native', 'browser', 'main'];

// Platform support
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Enhanced resolver configuration for legacy mode
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Configure transformer for legacy mode
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
  // Disable experimental features that might enable new architecture
  experimentalImportSupport: false,
};

// Disable symlinks
config.resolver.unstable_enableSymlinks = false;

// Additional configuration for legacy stability
config.resolver.sourceExts = [...(config.resolver.sourceExts || []), 'js', 'jsx', 'ts', 'tsx', 'json'];

// Force legacy mode
config.resolver.unstable_enableSymlinks = false;

module.exports = config;
