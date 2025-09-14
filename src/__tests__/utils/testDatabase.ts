/**
 * Test Database Utilities
 * 
 * Utilities for setting up and tearing down test databases,
 * creating test data, and managing test environments.
 */

import { supabase } from '@/config/supabase';

export interface TestUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
}

export interface TestPrayer {
  id: string;
  user_id: string;
  text: string;
  privacy_level: 'public' | 'friends' | 'groups' | 'private';
  status: 'open' | 'answered' | 'closed';
  tags?: string[];
  location_city?: string;
  location_lat?: number;
  location_lon?: number;
}

export interface TestGroup {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  privacy: 'public' | 'private' | 'invite_only';
}

export interface TestInteraction {
  id: string;
  prayer_id: string;
  user_id: string;
  type: 'PRAY' | 'LIKE' | 'SHARE' | 'SAVE';
  committed_at?: string;
  reminder_frequency: 'none' | 'daily' | 'weekly';
}

/**
 * Test database manager for setting up and cleaning up test data
 */
export class TestDatabaseManager {
  private testData: {
    users: TestUser[];
    prayers: TestPrayer[];
    groups: TestGroup[];
    interactions: TestInteraction[];
  } = {
    users: [],
    prayers: [],
    groups: [],
    interactions: [],
  };

  /**
   * Create a test user
   */
  async createTestUser(userData: Partial<TestUser> = {}): Promise<TestUser> {
    const user: TestUser = {
      id: userData.id || `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: userData.email || `test-${Date.now()}@example.com`,
      display_name: userData.display_name || `Test User ${Date.now()}`,
      avatar_url: userData.avatar_url,
      bio: userData.bio,
    };

    // In a real test environment, you would insert into the database
    // For now, we'll just store in memory
    this.testData.users.push(user);
    return user;
  }

  /**
   * Create a test prayer
   */
  async createTestPrayer(prayerData: Partial<TestPrayer> = {}): Promise<TestPrayer> {
    const prayer: TestPrayer = {
      id: prayerData.id || `test-prayer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: prayerData.user_id || this.testData.users[0]?.id || 'test-user',
      text: prayerData.text || `Test prayer ${Date.now()}`,
      privacy_level: prayerData.privacy_level || 'public',
      status: prayerData.status || 'open',
      tags: prayerData.tags || [],
      location_city: prayerData.location_city,
      location_lat: prayerData.location_lat,
      location_lon: prayerData.location_lon,
    };

    this.testData.prayers.push(prayer);
    return prayer;
  }

  /**
   * Create a test group
   */
  async createTestGroup(groupData: Partial<TestGroup> = {}): Promise<TestGroup> {
    const group: TestGroup = {
      id: groupData.id || `test-group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: groupData.name || `Test Group ${Date.now()}`,
      description: groupData.description || `Test group description ${Date.now()}`,
      creator_id: groupData.creator_id || this.testData.users[0]?.id || 'test-user',
      privacy: groupData.privacy || 'public',
    };

    this.testData.groups.push(group);
    return group;
  }

  /**
   * Create a test interaction
   */
  async createTestInteraction(interactionData: Partial<TestInteraction> = {}): Promise<TestInteraction> {
    const interaction: TestInteraction = {
      id: interactionData.id || `test-interaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      prayer_id: interactionData.prayer_id || this.testData.prayers[0]?.id || 'test-prayer',
      user_id: interactionData.user_id || this.testData.users[0]?.id || 'test-user',
      type: interactionData.type || 'LIKE',
      committed_at: interactionData.committed_at || new Date().toISOString(),
      reminder_frequency: interactionData.reminder_frequency || 'none',
    };

    this.testData.interactions.push(interaction);
    return interaction;
  }

  /**
   * Get all test data
   */
  getTestData() {
    return this.testData;
  }

  /**
   * Clear all test data
   */
  clearTestData() {
    this.testData = {
      users: [],
      prayers: [],
      groups: [],
      interactions: [],
    };
  }

  /**
   * Create a complete test scenario with users, prayers, and interactions
   */
  async createTestScenario() {
    // Create test users
    const user1 = await this.createTestUser({
      display_name: 'Test User 1',
      email: 'user1@test.com',
    });
    const user2 = await this.createTestUser({
      display_name: 'Test User 2',
      email: 'user2@test.com',
    });

    // Create test group
    const group = await this.createTestGroup({
      name: 'Test Prayer Group',
      description: 'A test group for prayers',
      creator_id: user1.id,
    });

    // Create test prayers
    const prayer1 = await this.createTestPrayer({
      user_id: user1.id,
      text: 'Please pray for my family during this difficult time',
      privacy_level: 'public',
      tags: ['family', 'health'],
      location_city: 'New York',
    });

    const prayer2 = await this.createTestPrayer({
      user_id: user2.id,
      text: 'Prayer for guidance and wisdom in decision making',
      privacy_level: 'friends',
      group_id: group.id,
      tags: ['guidance', 'wisdom'],
    });

    // Create test interactions
    await this.createTestInteraction({
      prayer_id: prayer1.id,
      user_id: user2.id,
      type: 'LIKE',
    });

    await this.createTestInteraction({
      prayer_id: prayer1.id,
      user_id: user2.id,
      type: 'PRAY',
      reminder_frequency: 'daily',
    });

    await this.createTestInteraction({
      prayer_id: prayer2.id,
      user_id: user1.id,
      type: 'SAVE',
    });

    return {
      users: [user1, user2],
      group,
      prayers: [prayer1, prayer2],
      interactions: this.testData.interactions,
    };
  }
}

/**
 * Database schema validator for tests
 */
export class DatabaseSchemaValidator {
  /**
   * Validate that all required tables exist
   */
  async validateTables(): Promise<{ valid: boolean; missing: string[] }> {
    const requiredTables = [
      'profiles',
      'prayers',
      'interactions',
      'groups',
      'group_members',
      'comments',
      'notifications',
      'support_tickets',
      'reports',
    ];

    const missing: string[] = [];

    for (const table of requiredTables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error?.code === 'PGRST301' || error?.code === 'PGRST205') {
          missing.push(table);
        }
      } catch (error) {
        missing.push(table);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Validate that all required columns exist in a table
   */
  async validateTableColumns(tableName: string, requiredColumns: string[]): Promise<{ valid: boolean; missing: string[] }> {
    const missing: string[] = [];

    for (const column of requiredColumns) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select(column)
          .limit(1);

        if (error?.code === 'PGRST202') {
          missing.push(column);
        }
      } catch (error) {
        missing.push(column);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Validate that all required functions exist
   */
  async validateFunctions(): Promise<{ valid: boolean; missing: string[] }> {
    const requiredFunctions = [
      'update_updated_at_column',
      'get_prayer_interaction_counts',
      'get_user_prayer_stats',
    ];

    const missing: string[] = [];

    for (const func of requiredFunctions) {
      try {
        const { error } = await supabase.rpc(func, {});
        if (error?.code === 'PGRST204') {
          missing.push(func);
        }
      } catch (error) {
        missing.push(func);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Validate that all required views exist
   */
  async validateViews(): Promise<{ valid: boolean; missing: string[] }> {
    const requiredViews = [
      'prayer_feed',
      'group_activity',
    ];

    const missing: string[] = [];

    for (const view of requiredViews) {
      try {
        const { error } = await supabase
          .from(view)
          .select('*')
          .limit(1);

        if (error?.code === 'PGRST301') {
          missing.push(view);
        }
      } catch (error) {
        missing.push(view);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Run complete schema validation
   */
  async validateSchema(): Promise<{
    valid: boolean;
    tables: { valid: boolean; missing: string[] };
    functions: { valid: boolean; missing: string[] };
    views: { valid: boolean; missing: string[] };
  }> {
    const [tables, functions, views] = await Promise.all([
      this.validateTables(),
      this.validateFunctions(),
      this.validateViews(),
    ]);

    return {
      valid: tables.valid && functions.valid && views.valid,
      tables,
      functions,
      views,
    };
  }
}

/**
 * Mock data generator for tests
 */
export class MockDataGenerator {
  /**
   * Generate mock prayer data
   */
  static generateMockPrayer(overrides: Partial<TestPrayer> = {}): TestPrayer {
    return {
      id: `mock-prayer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: `mock-user-${Date.now()}`,
      text: 'This is a mock prayer for testing purposes. It contains enough text to meet the minimum requirements.',
      privacy_level: 'public',
      status: 'open',
      tags: ['test', 'mock'],
      location_city: 'Test City',
      location_lat: 40.7128,
      location_lon: -74.0060,
      ...overrides,
    };
  }

  /**
   * Generate mock user data
   */
  static generateMockUser(overrides: Partial<TestUser> = {}): TestUser {
    return {
      id: `mock-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: `mock-${Date.now()}@test.com`,
      display_name: `Mock User ${Date.now()}`,
      avatar_url: 'https://example.com/avatar.jpg',
      bio: 'This is a mock user for testing purposes.',
      ...overrides,
    };
  }

  /**
   * Generate mock group data
   */
  static generateMockGroup(overrides: Partial<TestGroup> = {}): TestGroup {
    return {
      id: `mock-group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Mock Group ${Date.now()}`,
      description: 'This is a mock group for testing purposes.',
      creator_id: `mock-user-${Date.now()}`,
      privacy: 'public',
      ...overrides,
    };
  }

  /**
   * Generate mock interaction data
   */
  static generateMockInteraction(overrides: Partial<TestInteraction> = {}): TestInteraction {
    return {
      id: `mock-interaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      prayer_id: `mock-prayer-${Date.now()}`,
      user_id: `mock-user-${Date.now()}`,
      type: 'LIKE',
      committed_at: new Date().toISOString(),
      reminder_frequency: 'none',
      ...overrides,
    };
  }

  /**
   * Generate multiple mock prayers
   */
  static generateMockPrayers(count: number, overrides: Partial<TestPrayer> = {}): TestPrayer[] {
    return Array.from({ length: count }, () => this.generateMockPrayer(overrides));
  }

  /**
   * Generate multiple mock users
   */
  static generateMockUsers(count: number, overrides: Partial<TestUser> = {}): TestUser[] {
    return Array.from({ length: count }, () => this.generateMockUser(overrides));
  }
}

/**
 * Test environment setup utilities
 */
export class TestEnvironmentSetup {
  /**
   * Setup test environment with database validation
   */
  static async setupTestEnvironment(): Promise<{
    databaseValid: boolean;
    schemaValidation: any;
  }> {
    const validator = new DatabaseSchemaValidator();
    const schemaValidation = await validator.validateSchema();

    return {
      databaseValid: schemaValidation.valid,
      schemaValidation,
    };
  }

  /**
   * Cleanup test environment
   */
  static async cleanupTestEnvironment(): Promise<void> {
    // In a real test environment, you would clean up test data here
    // For now, we'll just log that cleanup was called
    console.log('Test environment cleanup completed');
  }
}

// Export singleton instances
export const testDatabaseManager = new TestDatabaseManager();
export const databaseSchemaValidator = new DatabaseSchemaValidator();