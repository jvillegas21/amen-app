/**
 * Custom Jest Matchers
 * 
 * Custom matchers for better test assertions and more readable tests.
 */

import { expect } from '@jest/globals';

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidPrayer(): R;
      toBeValidUser(): R;
      toBeValidInteraction(): R;
      toHaveValidDatabaseError(): R;
      toBeValidPaginationResult(): R;
      toHaveValidTimestamp(): R;
      toBeValidUUID(): R;
      toHaveValidLocation(): R;
      toHaveValidPrivacyLevel(): R;
      toHaveValidInteractionType(): R;
    }
  }
}

// Custom matcher for prayer validation
expect.extend({
  toBeValidPrayer(received: any) {
    const requiredFields = ['id', 'user_id', 'text', 'privacy_level', 'status', 'created_at', 'updated_at'];
    const missingFields = requiredFields.filter(field => !(field in received));
    
    if (missingFields.length > 0) {
      return {
        message: () => `Expected object to be a valid prayer, but missing fields: ${missingFields.join(', ')}`,
        pass: false,
      };
    }

    // Validate field types and values
    if (typeof received.text !== 'string' || received.text.length < 10 || received.text.length > 4000) {
      return {
        message: () => `Expected prayer text to be a string between 10-4000 characters, got: ${typeof received.text} with length ${received.text?.length}`,
        pass: false,
      };
    }

    const validPrivacyLevels = ['public', 'friends', 'groups', 'private'];
    if (!validPrivacyLevels.includes(received.privacy_level)) {
      return {
        message: () => `Expected privacy_level to be one of ${validPrivacyLevels.join(', ')}, got: ${received.privacy_level}`,
        pass: false,
      };
    }

    const validStatuses = ['open', 'answered', 'closed'];
    if (!validStatuses.includes(received.status)) {
      return {
        message: () => `Expected status to be one of ${validStatuses.join(', ')}, got: ${received.status}`,
        pass: false,
      };
    }

    return {
      message: () => 'Expected object to be a valid prayer',
      pass: true,
    };
  },
});

// Custom matcher for user validation
expect.extend({
  toBeValidUser(received: any) {
    const requiredFields = ['id', 'display_name'];
    const missingFields = requiredFields.filter(field => !(field in received));
    
    if (missingFields.length > 0) {
      return {
        message: () => `Expected object to be a valid user, but missing fields: ${missingFields.join(', ')}`,
        pass: false,
      };
    }

    if (typeof received.display_name !== 'string' || received.display_name.length < 2 || received.display_name.length > 50) {
      return {
        message: () => `Expected display_name to be a string between 2-50 characters, got: ${typeof received.display_name} with length ${received.display_name?.length}`,
        pass: false,
      };
    }

    return {
      message: () => 'Expected object to be a valid user',
      pass: true,
    };
  },
});

// Custom matcher for interaction validation
expect.extend({
  toBeValidInteraction(received: any) {
    const requiredFields = ['id', 'prayer_id', 'user_id', 'type'];
    const missingFields = requiredFields.filter(field => !(field in received));
    
    if (missingFields.length > 0) {
      return {
        message: () => `Expected object to be a valid interaction, but missing fields: ${missingFields.join(', ')}`,
        pass: false,
      };
    }

    const validTypes = ['PRAY', 'LIKE', 'SHARE', 'SAVE'];
    if (!validTypes.includes(received.type)) {
      return {
        message: () => `Expected type to be one of ${validTypes.join(', ')}, got: ${received.type}`,
        pass: false,
      };
    }

    return {
      message: () => 'Expected object to be a valid interaction',
      pass: true,
    };
  },
});

// Custom matcher for database error validation
expect.extend({
  toHaveValidDatabaseError(received: any) {
    if (!received || typeof received !== 'object') {
      return {
        message: () => `Expected object to be a valid database error, got: ${typeof received}`,
        pass: false,
      };
    }

    const requiredFields = ['code', 'message'];
    const missingFields = requiredFields.filter(field => !(field in received));
    
    if (missingFields.length > 0) {
      return {
        message: () => `Expected database error to have fields: ${missingFields.join(', ')}`,
        pass: false,
      };
    }

    const validErrorCodes = ['PGRST202', 'PGRST204', 'PGRST205', 'PGRST301'];
    if (!validErrorCodes.includes(received.code)) {
      return {
        message: () => `Expected error code to be one of ${validErrorCodes.join(', ')}, got: ${received.code}`,
        pass: false,
      };
    }

    if (typeof received.message !== 'string' || received.message.length === 0) {
      return {
        message: () => `Expected error message to be a non-empty string, got: ${typeof received.message}`,
        pass: false,
      };
    }

    return {
      message: () => 'Expected object to be a valid database error',
      pass: true,
    };
  },
});

// Custom matcher for pagination result validation
expect.extend({
  toBeValidPaginationResult(received: any) {
    if (!received || typeof received !== 'object') {
      return {
        message: () => `Expected object to be a valid pagination result, got: ${typeof received}`,
        pass: false,
      };
    }

    const requiredFields = ['data', 'pagination'];
    const missingFields = requiredFields.filter(field => !(field in received));
    
    if (missingFields.length > 0) {
      return {
        message: () => `Expected pagination result to have fields: ${missingFields.join(', ')}`,
        pass: false,
      };
    }

    if (!Array.isArray(received.data)) {
      return {
        message: () => `Expected data to be an array, got: ${typeof received.data}`,
        pass: false,
      };
    }

    const paginationFields = ['page', 'pageSize', 'total', 'totalPages', 'hasNext', 'hasPrevious'];
    const missingPaginationFields = paginationFields.filter(field => !(field in received.pagination));
    
    if (missingPaginationFields.length > 0) {
      return {
        message: () => `Expected pagination to have fields: ${missingPaginationFields.join(', ')}`,
        pass: false,
      };
    }

    return {
      message: () => 'Expected object to be a valid pagination result',
      pass: true,
    };
  },
});

// Custom matcher for timestamp validation
expect.extend({
  toHaveValidTimestamp(received: any) {
    if (typeof received !== 'string') {
      return {
        message: () => `Expected timestamp to be a string, got: ${typeof received}`,
        pass: false,
      };
    }

    const date = new Date(received);
    if (isNaN(date.getTime())) {
      return {
        message: () => `Expected timestamp to be a valid ISO date string, got: ${received}`,
        pass: false,
      };
    }

    return {
      message: () => 'Expected timestamp to be valid',
      pass: true,
    };
  },
});

// Custom matcher for UUID validation
expect.extend({
  toBeValidUUID(received: any) {
    if (typeof received !== 'string') {
      return {
        message: () => `Expected UUID to be a string, got: ${typeof received}`,
        pass: false,
      };
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(received)) {
      return {
        message: () => `Expected string to be a valid UUID, got: ${received}`,
        pass: false,
      };
    }

    return {
      message: () => 'Expected string to be a valid UUID',
      pass: true,
    };
  },
});

// Custom matcher for location validation
expect.extend({
  toHaveValidLocation(received: any) {
    if (!received || typeof received !== 'object') {
      return {
        message: () => `Expected location to be an object, got: ${typeof received}`,
        pass: false,
      };
    }

    if (received.city && typeof received.city !== 'string') {
      return {
        message: () => `Expected location city to be a string, got: ${typeof received.city}`,
        pass: false,
      };
    }

    if (received.lat !== undefined && (typeof received.lat !== 'number' || received.lat < -90 || received.lat > 90)) {
      return {
        message: () => `Expected location lat to be a number between -90 and 90, got: ${received.lat}`,
        pass: false,
      };
    }

    if (received.lon !== undefined && (typeof received.lon !== 'number' || received.lon < -180 || received.lon > 180)) {
      return {
        message: () => `Expected location lon to be a number between -180 and 180, got: ${received.lon}`,
        pass: false,
      };
    }

    const validGranularities = ['hidden', 'city', 'precise'];
    if (received.granularity && !validGranularities.includes(received.granularity)) {
      return {
        message: () => `Expected location granularity to be one of ${validGranularities.join(', ')}, got: ${received.granularity}`,
        pass: false,
      };
    }

    return {
      message: () => 'Expected location to be valid',
      pass: true,
    };
  },
});

// Custom matcher for privacy level validation
expect.extend({
  toHaveValidPrivacyLevel(received: any) {
    const validLevels = ['public', 'friends', 'groups', 'private'];
    if (!validLevels.includes(received)) {
      return {
        message: () => `Expected privacy level to be one of ${validLevels.join(', ')}, got: ${received}`,
        pass: false,
      };
    }

    return {
      message: () => 'Expected privacy level to be valid',
      pass: true,
    };
  },
});

// Custom matcher for interaction type validation
expect.extend({
  toHaveValidInteractionType(received: any) {
    const validTypes = ['PRAY', 'LIKE', 'SHARE', 'SAVE'];
    if (!validTypes.includes(received)) {
      return {
        message: () => `Expected interaction type to be one of ${validTypes.join(', ')}, got: ${received}`,
        pass: false,
      };
    }

    return {
      message: () => 'Expected interaction type to be valid',
      pass: true,
    };
  },
});

// Helper function to create test data with validation
export const createValidTestData = {
  prayer: (overrides: any = {}) => ({
    id: 'test-prayer-id',
    user_id: 'test-user-id',
    text: 'This is a valid test prayer with enough text to meet requirements.',
    privacy_level: 'public',
    status: 'open',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  user: (overrides: any = {}) => ({
    id: 'test-user-id',
    display_name: 'Test User',
    email: 'test@example.com',
    ...overrides,
  }),

  interaction: (overrides: any = {}) => ({
    id: 'test-interaction-id',
    prayer_id: 'test-prayer-id',
    user_id: 'test-user-id',
    type: 'LIKE',
    committed_at: new Date().toISOString(),
    reminder_frequency: 'none',
    ...overrides,
  }),

  databaseError: (overrides: any = {}) => ({
    code: 'PGRST205',
    message: 'Test database error message',
    details: null,
    hint: null,
    ...overrides,
  }),

  paginationResult: (overrides: any = {}) => ({
    data: [],
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
    },
    ...overrides,
  }),
};

// Helper function to validate test data
export const validateTestData = {
  prayer: (data: any) => {
    expect(data).toBeValidPrayer();
    expect(data.id).toBeValidUUID();
    expect(data.user_id).toBeValidUUID();
    expect(data.created_at).toHaveValidTimestamp();
    expect(data.updated_at).toHaveValidTimestamp();
    expect(data.privacy_level).toHaveValidPrivacyLevel();
  },

  user: (data: any) => {
    expect(data).toBeValidUser();
    expect(data.id).toBeValidUUID();
  },

  interaction: (data: any) => {
    expect(data).toBeValidInteraction();
    expect(data.id).toBeValidUUID();
    expect(data.prayer_id).toBeValidUUID();
    expect(data.user_id).toBeValidUUID();
    expect(data.type).toHaveValidInteractionType();
  },

  databaseError: (data: any) => {
    expect(data).toHaveValidDatabaseError();
  },

  paginationResult: (data: any) => {
    expect(data).toBeValidPaginationResult();
  },
};