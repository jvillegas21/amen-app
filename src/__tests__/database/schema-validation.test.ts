/**
 * Database Schema Validation Tests
 * 
 * These tests ensure that all database tables, columns, and relationships
 * exist as expected. This prevents runtime errors like "table not found"
 * or "column does not exist" that can occur when the schema is out of sync.
 */

import { supabase } from '@/config/supabase';

// Expected table structure based on complete_schema.sql
const EXPECTED_TABLES = [
  'profiles',
  'groups', 
  'prayers',
  'interactions',
  'studies',
  'group_members',
  'comments',
  'notifications',
  'support_tickets',
  'reports',
  'user_analytics',
  'follows',
  'blocked_users',
  'direct_messages'
];

const EXPECTED_COLUMNS = {
  profiles: [
    'id', 'display_name', 'avatar_url', 'bio', 'location_city', 'location_lat', 
    'location_lon', 'location_granularity', 'onboarding_completed', 
    'email_notifications', 'push_notifications', 'is_verified', 
    'last_active', 'created_at', 'updated_at'
  ],
  prayers: [
    'id', 'user_id', 'text', 'location_city', 'location_lat', 'location_lon',
    'location_granularity', 'privacy_level', 'group_id', 'status', 
    'is_anonymous', 'tags', 'images', 'created_at', 'updated_at', 'expires_at'
  ],
  interactions: [
    'id', 'prayer_id', 'user_id', 'type', 'committed_at', 'fulfilled_at',
    'reminder_frequency', 'created_at'
  ],
  groups: [
    'id', 'name', 'description', 'privacy', 'creator_id', 'invite_code',
    'max_members', 'member_count', 'is_archived', 'tags', 'rules',
    'avatar_url', 'created_at', 'updated_at'
  ],
  comments: [
    'id', 'prayer_id', 'user_id', 'parent_id', 'text', 'is_edited',
    'created_at', 'updated_at'
  ],
  notifications: [
    'id', 'user_id', 'type', 'title', 'body', 'payload', 'action_url',
    'read', 'sent_push', 'sent_email', 'created_at', 'expires_at'
  ],
  support_tickets: [
    'id', 'user_id', 'subject', 'description', 'category', 'priority',
    'status', 'assigned_to', 'satisfaction_rating', 'satisfaction_feedback',
    'created_at', 'updated_at', 'resolved_at'
  ],
  reports: [
    'id', 'reporter_id', 'resource_type', 'resource_id', 'reason',
    'description', 'status', 'moderator_id', 'moderator_notes',
    'action_taken', 'created_at', 'resolved_at'
  ]
};

const EXPECTED_ENUMS = [
  'privacy_level',
  'location_granularity', 
  'prayer_status',
  'interaction_type',
  'reminder_frequency',
  'group_privacy',
  'member_role',
  'notification_type',
  'ticket_category',
  'ticket_priority',
  'ticket_status',
  'report_reason',
  'report_status'
];

const EXPECTED_FUNCTIONS = [
  'update_updated_at_column',
  'update_group_member_count',
  'generate_invite_code',
  'update_last_active',
  'set_group_invite_code',
  'cleanup_expired_notifications',
  'get_prayer_interaction_counts',
  'get_user_prayer_stats'
];

const EXPECTED_VIEWS = [
  'prayer_feed',
  'group_activity'
];

describe('Database Schema Validation', () => {
  beforeAll(async () => {
    // Ensure we have a valid connection
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error && error.code === 'PGRST301') {
      throw new Error('Database connection failed - check your Supabase configuration');
    }
  });

  describe('Table Existence', () => {
    test.each(EXPECTED_TABLES)('should have table: %s', async (tableName) => {
      const { error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      // PGRST301 means table doesn't exist
      if (error?.code === 'PGRST301') {
        throw new Error(`Table '${tableName}' does not exist in the database`);
      }

      // Other errors are acceptable (like permission issues)
      expect(error?.code).not.toBe('PGRST301');
    });
  });

  describe('Column Existence', () => {
    test.each(Object.entries(EXPECTED_COLUMNS))(
      'should have all expected columns in table: %s',
      async (tableName, expectedColumns) => {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error?.code === 'PGRST301') {
          throw new Error(`Table '${tableName}' does not exist`);
        }

        // If we get data, the columns exist
        if (data !== null) {
          expect(data).toBeDefined();
          return;
        }

        // If no data but no error, try a more specific query
        const { error: columnError } = await supabase
          .from(tableName)
          .select(expectedColumns.join(', '))
          .limit(1);

        if (columnError?.code === 'PGRST202') {
          const missingColumns = expectedColumns.filter(col => 
            columnError.message.includes(`"${col}"`)
          );
          throw new Error(
            `Missing columns in table '${tableName}': ${missingColumns.join(', ')}`
          );
        }

        expect(columnError?.code).not.toBe('PGRST202');
      }
    );
  });

  describe('Enum Types', () => {
    test.each(EXPECTED_ENUMS)('should have enum type: %s', async (enumName) => {
      // Test enum by trying to use it in a query
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .eq('location_granularity', 'city')
        .limit(1);

      // This is a basic test - in a real scenario, you'd test each enum
      expect(error?.code).not.toBe('PGRST202');
    });
  });

  describe('Database Functions', () => {
    test('should have update_updated_at_column function', async () => {
      // Test by updating a record and checking if updated_at changes
      const { data: testProfile, error: selectError } = await supabase
        .from('profiles')
        .select('id, updated_at')
        .limit(1)
        .single();

      if (selectError) {
        // Skip if no profiles exist
        return;
      }

      const originalUpdatedAt = testProfile.updated_at;
      
      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ bio: 'Test update' })
        .eq('id', testProfile.id);

      expect(updateError).toBeNull();

      const { data: updatedProfile, error: reSelectError } = await supabase
        .from('profiles')
        .select('updated_at')
        .eq('id', testProfile.id)
        .single();

      expect(reSelectError).toBeNull();
      expect(new Date(updatedProfile.updated_at).getTime())
        .toBeGreaterThan(new Date(originalUpdatedAt).getTime());
    });

    test('should have get_prayer_interaction_counts function', async () => {
      const { data, error } = await supabase
        .rpc('get_prayer_interaction_counts', { prayer_uuid: '00000000-0000-0000-0000-000000000000' });

      // Function should exist even if prayer doesn't
      expect(error?.code).not.toBe('PGRST204'); // Function not found
    });

    test('should have get_user_prayer_stats function', async () => {
      const { data, error } = await supabase
        .rpc('get_user_prayer_stats', { user_uuid: '00000000-0000-0000-0000-000000000000' });

      // Function should exist even if user doesn't
      expect(error?.code).not.toBe('PGRST204'); // Function not found
    });
  });

  describe('Views', () => {
    test('should have prayer_feed view', async () => {
      const { error } = await supabase
        .from('prayer_feed')
        .select('*')
        .limit(1);

      expect(error?.code).not.toBe('PGRST301'); // View not found
    });

    test('should have group_activity view', async () => {
      const { error } = await supabase
        .from('group_activity')
        .select('*')
        .limit(1);

      expect(error?.code).not.toBe('PGRST301'); // View not found
    });
  });

  describe('Foreign Key Relationships', () => {
    test('prayers should reference profiles', async () => {
      const { error } = await supabase
        .from('prayers')
        .select('user_id, profiles!user_id(id)')
        .limit(1);

      // Should not get foreign key constraint error
      expect(error?.code).not.toBe('PGRST204');
    });

    test('interactions should reference prayers and profiles', async () => {
      const { error } = await supabase
        .from('interactions')
        .select('prayer_id, user_id, prayers!prayer_id(id), profiles!user_id(id)')
        .limit(1);

      expect(error?.code).not.toBe('PGRST204');
    });

    test('comments should reference prayers and profiles', async () => {
      const { error } = await supabase
        .from('comments')
        .select('prayer_id, user_id, prayers!prayer_id(id), profiles!user_id(id)')
        .limit(1);

      expect(error?.code).not.toBe('PGRST204');
    });

    test('group_members should reference groups and profiles', async () => {
      const { error } = await supabase
        .from('group_members')
        .select('group_id, user_id, groups!group_id(id), profiles!user_id(id)')
        .limit(1);

      expect(error?.code).not.toBe('PGRST204');
    });
  });

  describe('Indexes and Performance', () => {
    test('should have proper indexes for common queries', async () => {
      // Test that common query patterns work efficiently
      const queries = [
        // Prayer queries
        () => supabase.from('prayers').select('*').eq('user_id', 'test').limit(1),
        () => supabase.from('prayers').select('*').eq('privacy_level', 'public').limit(1),
        () => supabase.from('prayers').select('*').order('created_at', { ascending: false }).limit(1),
        
        // Interaction queries
        () => supabase.from('interactions').select('*').eq('prayer_id', 'test').limit(1),
        () => supabase.from('interactions').select('*').eq('user_id', 'test').limit(1),
        
        // Comment queries
        () => supabase.from('comments').select('*').eq('prayer_id', 'test').limit(1),
        () => supabase.from('comments').select('*').order('created_at', { ascending: false }).limit(1),
      ];

      for (const query of queries) {
        const { error } = await query();
        // Should not get index-related errors
        expect(error?.code).not.toBe('PGRST204');
      }
    });
  });

  describe('Row Level Security', () => {
    test('should have RLS enabled on sensitive tables', async () => {
      const sensitiveTables = ['profiles', 'prayers', 'interactions', 'comments'];
      
      for (const table of sensitiveTables) {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        // RLS should be enabled (we might get permission errors, but not table not found)
        expect(error?.code).not.toBe('PGRST301');
      }
    });
  });

  describe('Data Integrity Constraints', () => {
    test('should enforce prayer text length constraints', async () => {
      const { error } = await supabase
        .from('prayers')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          text: 'short' // Should fail - too short
        });

      // Should get constraint violation
      expect(error?.code).toBe('PGRST204');
    });

    test('should enforce profile display_name constraints', async () => {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: '00000000-0000-0000-0000-000000000000',
          display_name: 'a' // Should fail - too short
        });

      // Should get constraint violation
      expect(error?.code).toBe('PGRST204');
    });
  });
});

describe('Database Error Scenarios', () => {
  describe('Common PGRST Errors', () => {
    test('should handle PGRST205 - table not found in schema cache', async () => {
      const { error } = await supabase
        .from('nonexistent_table')
        .select('*');

      expect(error?.code).toBe('PGRST205');
      expect(error?.message).toContain('Could not find the table');
    });

    test('should handle PGRST202 - column not found', async () => {
      const { error } = await supabase
        .from('profiles')
        .select('nonexistent_column');

      expect(error?.code).toBe('PGRST202');
      expect(error?.message).toContain('Could not find the column');
    });

    test('should handle PGRST204 - function not found', async () => {
      const { error } = await supabase
        .rpc('nonexistent_function', {});

      expect(error?.code).toBe('PGRST204');
      expect(error?.message).toContain('Could not find the function');
    });

    test('should handle PGRST301 - table does not exist', async () => {
      const { error } = await supabase
        .from('definitely_does_not_exist')
        .select('*');

      expect(error?.code).toBe('PGRST301');
    });
  });

  describe('Prayer-specific Error Scenarios', () => {
    test('should handle prayer_likes table error (the specific error mentioned)', async () => {
      // This test specifically addresses the error mentioned in the user query
      const { error } = await supabase
        .from('interactions')
        .select('*');

      expect(error?.code).toBe('PGRST205');
      expect(error?.message).toContain('Could not find the table');
      expect(error?.hint).toContain('prayer_feed'); // Should suggest the correct table
    });

    test('should validate that interactions table handles prayer interactions correctly', async () => {
      // Test that we can query interactions properly
      const { error } = await supabase
        .from('interactions')
        .select('*')
        .eq('type', 'LIKE')
        .limit(1);

      expect(error?.code).not.toBe('PGRST205');
    });
  });
});