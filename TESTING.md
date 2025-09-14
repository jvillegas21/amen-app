# Testing Guide

This document provides comprehensive information about the testing setup for the Amenity app, including how to run tests, what types of tests are available, and how to write new tests.

## Overview

The testing suite is designed to catch database-related errors early and ensure the reliability of the application. It includes:

- **Database Schema Validation Tests** - Ensure all tables, columns, and relationships exist
- **Service Unit Tests** - Test individual service methods with proper mocking
- **Repository Tests** - Test database interactions at the repository layer
- **Integration Tests** - Test complete user flows end-to-end
- **Error Handling Tests** - Test specific error scenarios and edge cases

## Test Structure

```
src/__tests__/
├── database/
│   └── schema-validation.test.ts    # Database schema validation
├── services/
│   └── prayerService.test.ts        # Service unit tests
├── repositories/
│   └── PrayerRepository.test.ts     # Repository tests
├── integration/
│   └── prayer-flow.test.ts          # End-to-end flow tests
├── error-handling/
│   └── database-errors.test.ts      # Error scenario tests
├── utils/
│   ├── testDatabase.ts              # Test database utilities
│   ├── customMatchers.ts            # Custom Jest matchers
│   └── testResultsProcessor.js      # Test result processing
└── setup.ts                         # Test setup and mocks
```

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Types
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Error handling tests only
npm run test:error-handling

# Database tests only
npm run test:database

# Service tests only
npm run test:services

# Repository tests only
npm run test:repositories
```

### Test Modes
```bash
# Watch mode (re-runs tests on file changes)
npm run test:watch

# Coverage report
npm run test:coverage

# CI mode (no watch, with coverage)
npm run test:ci
```

## Test Categories

### 1. Database Schema Validation Tests

These tests ensure that all database tables, columns, functions, and views exist as expected. They prevent runtime errors like "table not found" or "column does not exist".

**Key Features:**
- Validates all required tables exist
- Checks column existence and types
- Verifies foreign key relationships
- Tests database functions and views
- Validates indexes and constraints

**Example:**
```typescript
test('should have table: prayers', async () => {
  const { error } = await supabase
    .from('prayers')
    .select('*')
    .limit(1);

  expect(error?.code).not.toBe('PGRST301');
});
```

### 2. Service Unit Tests

These tests verify that service methods work correctly with proper mocking of dependencies.

**Key Features:**
- Tests all service methods
- Mocks Supabase client
- Tests error handling
- Validates input/output
- Tests authentication flows

**Example:**
```typescript
it('should create prayer successfully', async () => {
  const mockUser = { id: 'user1' };
  const createRequest = { text: 'Test prayer', privacy_level: 'public' };
  
  mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
  
  const result = await prayerService.createPrayer(createRequest);
  
  expect(result).toBeValidPrayer();
});
```

### 3. Repository Tests

These tests verify database interactions at the repository layer, including batching and performance optimizations.

**Key Features:**
- Tests CRUD operations
- Tests batched requests
- Tests pagination
- Tests search functionality
- Tests error handling

### 4. Integration Tests

These tests verify complete user flows from start to finish.

**Key Features:**
- Tests prayer creation flow
- Tests interaction lifecycle
- Tests feed functionality
- Tests search and filtering
- Tests error recovery

### 5. Error Handling Tests

These tests specifically target error scenarios and edge cases.

**Key Features:**
- Tests PGRST error codes
- Tests authentication errors
- Tests validation errors
- Tests network errors
- Tests permission errors

## Custom Matchers

The test suite includes custom Jest matchers for better assertions:

```typescript
// Prayer validation
expect(prayer).toBeValidPrayer();

// User validation
expect(user).toBeValidUser();

// Database error validation
expect(error).toHaveValidDatabaseError();

// UUID validation
expect(id).toBeValidUUID();

// Timestamp validation
expect(timestamp).toHaveValidTimestamp();
```

## Test Utilities

### TestDatabaseManager

Manages test data creation and cleanup:

```typescript
const testDb = new TestDatabaseManager();

// Create test data
const user = await testDb.createTestUser();
const prayer = await testDb.createTestPrayer({ user_id: user.id });

// Create complete test scenario
const scenario = await testDb.createTestScenario();
```

### DatabaseSchemaValidator

Validates database schema:

```typescript
const validator = new DatabaseSchemaValidator();

// Validate all tables exist
const { valid, missing } = await validator.validateTables();

// Validate specific table columns
const { valid, missing } = await validator.validateTableColumns('prayers', ['id', 'text', 'user_id']);
```

### MockDataGenerator

Generates mock data for tests:

```typescript
// Generate mock prayer
const mockPrayer = MockDataGenerator.generateMockPrayer({
  text: 'Custom prayer text',
  privacy_level: 'private'
});

// Generate multiple mock users
const mockUsers = MockDataGenerator.generateMockUsers(5);
```

## Writing New Tests

### 1. Service Tests

```typescript
describe('NewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle success case', async () => {
    // Arrange
    const mockData = { /* test data */ };
    mockSupabase.from.mockReturnValue(/* mock query */);

    // Act
    const result = await newService.method(mockData);

    // Assert
    expect(result).toBeDefined();
    expect(result).toMatchObject(mockData);
  });

  it('should handle error case', async () => {
    // Arrange
    mockSupabase.from.mockReturnValue(/* error mock */);

    // Act & Assert
    await expect(newService.method()).rejects.toThrow('Expected error message');
  });
});
```

### 2. Repository Tests

```typescript
describe('NewRepository', () => {
  let repository: NewRepository;

  beforeEach(() => {
    repository = new NewRepository(mockSupabase);
  });

  it('should perform CRUD operations', async () => {
    // Test create, read, update, delete operations
  });
});
```

### 3. Integration Tests

```typescript
describe('New Feature Integration', () => {
  it('should complete full user flow', async () => {
    // Test complete user journey
    // 1. Setup
    // 2. Execute flow
    // 3. Verify results
  });
});
```

## Common Error Scenarios

### Database Errors

The tests specifically check for these common database errors:

- **PGRST205**: Table not found in schema cache
- **PGRST202**: Column not found
- **PGRST204**: Function not found
- **PGRST301**: Table does not exist

### Authentication Errors

- User not authenticated
- JWT expired
- Invalid session

### Validation Errors

- Text too short/long
- Invalid enum values
- Foreign key constraint violations

## Best Practices

### 1. Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### 2. Mocking
- Mock external dependencies
- Use consistent mock data
- Clear mocks between tests

### 3. Error Testing
- Test both success and failure cases
- Test specific error codes
- Test error recovery

### 4. Data Validation
- Use custom matchers for validation
- Test edge cases
- Test boundary conditions

### 5. Performance
- Use batched requests when possible
- Test timeout scenarios
- Monitor test execution time

## Continuous Integration

The test suite is configured for CI/CD with:

- Coverage thresholds
- Parallel test execution
- Error reporting
- Performance monitoring

### Coverage Requirements

- Global: 80% coverage minimum
- Services: 85% coverage minimum
- Repositories: 90% coverage minimum

## Troubleshooting

### Common Issues

1. **Tests failing with "table not found"**
   - Run database schema validation tests
   - Check if database is properly set up
   - Verify Supabase connection

2. **Mock not working**
   - Ensure mocks are cleared between tests
   - Check mock implementation
   - Verify mock is called correctly

3. **Tests timing out**
   - Check for infinite loops
   - Verify async/await usage
   - Increase timeout if needed

### Debug Mode

Run tests in debug mode for more information:

```bash
DEBUG=* npm test
```

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain coverage thresholds
4. Update this documentation
5. Add error handling tests for new scenarios

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)
- [Custom Matchers Guide](https://jestjs.io/docs/expect#expectextendmatchers)