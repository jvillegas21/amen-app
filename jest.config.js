module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/android/',
    '<rootDir>/ios/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@expo|expo|@unimodules|unimodules|sentry-expo|native-base|react-native-svg|react-native-vector-icons|@react-native-community|react-native-gesture-handler|react-native-reanimated|react-native-screens|react-native-safe-area-context|@react-native-async-storage|@react-native-community/netinfo|@react-native-community/datetimepicker|expo-image-picker|expo-location|expo-notifications|expo-constants|expo-device|expo-file-system|expo-font|expo-linking|expo-router|expo-splash-screen|expo-status-bar|expo-system-ui|expo-web-browser|@expo/vector-icons|expo-av|expo-camera|expo-media-library|expo-barcode-scanner|expo-sensors|expo-haptics|expo-linear-gradient|expo-blur|expo-secure-store|expo-crypto|expo-random|expo-asset|expo-constants|expo-device|expo-file-system|expo-font|expo-linking|expo-router|expo-splash-screen|expo-status-bar|expo-system-ui|expo-web-browser|@expo/vector-icons|expo-av|expo-camera|expo-media-library|expo-barcode-scanner|expo-sensors|expo-haptics|expo-linear-gradient|expo-blur|expo-secure-store|expo-crypto|expo-random|expo-asset)/)',
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
  verbose: true,
};
