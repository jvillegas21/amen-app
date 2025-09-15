module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Enable TurboModule interop
      ['@babel/plugin-transform-flow-strip-types'],
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      ['@babel/plugin-proposal-class-properties', { loose: true }],
      // Add support for React Native Reanimated (must be last)
      ['react-native-worklets/plugin', {
        relativeSourceLocation: true,
      }],
    ],
  };
};
