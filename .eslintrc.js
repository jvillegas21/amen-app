module.exports = {
  extends: [
    'expo',
    '@react-native',
    '@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'react-hooks'
  ],
  env: {
    node: true,
    jest: true,
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'no-console': 'off',
    '@typescript-eslint/ban-ts-comment': 'warn'
  },
  ignorePatterns: [
    'node_modules/',
    '.expo/',
    'dist/',
    '*.config.js',
    'babel.config.js'
  ]
};