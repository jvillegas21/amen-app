module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup.ts'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@expo|expo|@unimodules|unimodules|sentry-expo|native-base|react-native-svg|react-native-vector-icons|@react-native-community|react-native-gesture-handler|react-native-reanimated|react-native-screens|react-native-safe-area-context|@react-native-async-storage|@react-native-community/netinfo|@react-native-community/datetimepicker|expo-image-picker|expo-location|expo-notifications|expo-constants|expo-device|expo-file-system|expo-font|expo-linking|expo-router|expo-splash-screen|expo-status-bar|expo-system-ui|expo-web-browser|@expo/vector-icons|expo-av|expo-camera|expo-media-library|expo-barcode-scanner|expo-sensors|expo-haptics|expo-linear-gradient|expo-blur|expo-secure-store|expo-crypto|expo-random|expo-asset)/)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testMatch: [
    '**/__tests__/**/*.test.(ts|tsx|js|jsx)',
    '**/__tests__/**/*-test.(ts|tsx|js|jsx)',
    '**/__tests__/**/*.spec.(ts|tsx|js|jsx)',
    '**/__tests__/**/*-spec.(ts|tsx|js|jsx)',
    '**/__tests__/**/*-integration.test.(ts|tsx|js|jsx)',
    '**/*.(test|spec).(ts|tsx|js|jsx)',
    '**/*.(integration-test|integration.test).(ts|tsx|js|jsx)'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/**/index.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.config.{ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Specific thresholds for critical areas
    './src/services/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/repositories/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],
  testTimeout: 30000, // 30 seconds for integration tests
  verbose: true,
  // Test suites configuration
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        '<rootDir>/src/__tests__/services/**/*.test.ts',
        '<rootDir>/src/__tests__/repositories/**/*.test.ts',
        '<rootDir>/src/__tests__/components/**/*.test.tsx'
      ],
      testEnvironment: 'node'
    },
    {
      displayName: 'integration',
      testMatch: [
        '<rootDir>/src/__tests__/integration/**/*.test.ts',
        '<rootDir>/src/__tests__/database/**/*.test.ts'
      ],
      testEnvironment: 'node',
      testTimeout: 60000 // 60 seconds for integration tests
    },
    {
      displayName: 'error-handling',
      testMatch: [
        '<rootDir>/src/__tests__/error-handling/**/*.test.ts'
      ],
      testEnvironment: 'node'
    }
  ],
  // Global test configuration
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  // Test result processor for better error reporting
  testResultsProcessor: '<rootDir>/src/__tests__/utils/testResultsProcessor.js',
  // Custom matchers for better assertions
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup.ts',
    '<rootDir>/src/__tests__/utils/customMatchers.ts'
  ]
};