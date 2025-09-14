/**
 * Database Error Handling Tests
 * 
 * Specific tests for database error scenarios to ensure proper error handling
 * and user-friendly error messages.
 */

import { prayerService } from '@/services/api/prayerService';
import { PrayerRepository } from '@/repositories/PrayerRepository';
import { supabase } from '@/config/supabase';

// Mock Supabase
jest.mock('@/config/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Database Error Handling', () => {
  let prayerRepository: PrayerRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    prayerRepository = new PrayerRepository(mockSupabase);
  });

  describe('PGRST Error Codes', () => {
    describe('PGRST205 - Table not found in schema cache', () => {
      it('should handle prayer_likes table error (specific user issue)', async () => {
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        };

        mockSupabase.from.mockReturnValue(mockQuery as any);
        mockQuery.range.mockResolvedValue({ 
          data: null, 
          error: { 
            code: 'PGRST205', 
            message: "Could not find the table 'public.prayer_likes' in the schema cache",
            details: null,
            hint: "Perhaps you meant the table 'public.prayer_feed'"
          } 
        });

        await expect(prayerService.fetchPrayers({
          feedType: 'discover',
          page: 1,
          limit: 20,
        })).rejects.toThrow("Could not find the table 'public.prayer_likes' in the schema cache");

        // Verify the error contains helpful hint
        try {
          await prayerService.fetchPrayers({
            feedType: 'discover',
            page: 1,
            limit: 20,
          });
        } catch (error: any) {
          expect(error.message).toContain('prayer_likes');
          expect(error.hint).toContain('prayer_feed');
        }
      });

      it('should handle other table not found errors', async () => {
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        };

        mockSupabase.from.mockReturnValue(mockQuery as any);
        mockQuery.range.mockResolvedValue({ 
          data: null, 
          error: { 
            code: 'PGRST205', 
            message: "Could not find the table 'public.nonexistent_table' in the schema cache",
            details: null,
            hint: null
          } 
        });

        await expect(prayerService.fetchPrayers({
          feedType: 'discover',
          page: 1,
          limit: 20,
        })).rejects.toThrow("Could not find the table 'public.nonexistent_table' in the schema cache");
      });
    });

    describe('PGRST202 - Column not found', () => {
      it('should handle column not found errors', async () => {
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        };

        mockSupabase.from.mockReturnValue(mockQuery as any);
        mockQuery.range.mockResolvedValue({ 
          data: null, 
          error: { 
            code: 'PGRST202', 
            message: "Could not find the column 'nonexistent_column' in the table 'public.prayers'",
            details: null,
            hint: null
          } 
        });

        await expect(prayerService.fetchPrayers({
          feedType: 'discover',
          page: 1,
          limit: 20,
        })).rejects.toThrow("Could not find the column 'nonexistent_column' in the table 'public.prayers'");
      });

      it('should handle column not found in text search', async () => {
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          textSearch: jest.fn().mockReturnThis(),
          contains: jest.fn().mockReturnThis(),
          ilike: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        };

        mockSupabase.from.mockReturnValue(mockQuery as any);
        mockQuery.eq.mockResolvedValue({ 
          data: null, 
          error: { 
            code: 'PGRST202', 
            message: "Could not find the column 'search_text' in the table 'public.prayers'",
            details: null,
            hint: null
          } 
        });

        await expect(prayerService.searchPrayers('test query')).rejects.toThrow(
          "Could not find the column 'search_text' in the table 'public.prayers'"
        );
      });
    });

    describe('PGRST204 - Function not found', () => {
      it('should handle RPC function not found errors', async () => {
        mockSupabase.rpc.mockResolvedValue({ 
          data: null, 
          error: { 
            code: 'PGRST204', 
            message: "Could not find the function 'nonexistent_function' in the schema cache",
            details: null,
            hint: null
          } 
        });

        await expect(prayerRepository.incrementViewCount('prayer1')).rejects.toThrow(
          'Failed to increment view count: Could not find the function \'nonexistent_function\' in the schema cache'
        );
      });

      it('should handle user stats function not found', async () => {
        mockSupabase.rpc.mockResolvedValue({ 
          data: null, 
          error: { 
            code: 'PGRST204', 
            message: "Could not find the function 'get_user_prayer_stats' in the schema cache",
            details: null,
            hint: null
          } 
        });

        const result = await prayerRepository.getUserPrayerStats('user1');
        
        // Should return default stats when function not found
        expect(result).toEqual({
          totalPrayers: 0,
          openPrayers: 0,
          answeredPrayers: 0,
          closedPrayers: 0,
          totalInteractions: 0,
          totalComments: 0,
        });
      });
    });

    describe('PGRST301 - Table does not exist', () => {
      it('should handle table does not exist errors', async () => {
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        };

        mockSupabase.from.mockReturnValue(mockQuery as any);
        mockQuery.range.mockResolvedValue({ 
          data: null, 
          error: { 
            code: 'PGRST301', 
            message: "relation \"nonexistent_table\" does not exist",
            details: null,
            hint: null
          } 
        });

        await expect(prayerService.fetchPrayers({
          feedType: 'discover',
          page: 1,
          limit: 20,
        })).rejects.toThrow('relation "nonexistent_table" does not exist');
      });
    });
  });

  describe('Authentication Errors', () => {
    it('should handle user not authenticated', async () => {
      const createRequest = {
        text: 'Test prayer',
        privacy_level: 'public' as const,
      };

      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: null }, 
        error: null 
      });

      await expect(prayerService.createPrayer(createRequest)).rejects.toThrow('Not authenticated - no user found');
    });

    it('should handle authentication service errors', async () => {
      const createRequest = {
        text: 'Test prayer',
        privacy_level: 'public' as const,
      };

      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: null }, 
        error: { message: 'JWT expired' } 
      });

      await expect(prayerService.createPrayer(createRequest)).rejects.toThrow('Authentication error: JWT expired');
    });

    it('should handle interaction without authentication', async () => {
      const interaction = {
        type: 'LIKE' as const,
        committed_at: new Date().toISOString(),
        reminder_frequency: 'none' as const,
      };

      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: null }, 
        error: null 
      });

      await expect(prayerService.interactWithPrayer('prayer1', interaction)).rejects.toThrow('Not authenticated');
    });
  });

  describe('Data Validation Errors', () => {
    it('should handle prayer text too short', async () => {
      const mockUser = { id: 'user1' };
      const createRequest = {
        text: 'short', // Too short
        privacy_level: 'public' as const,
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.single.mockResolvedValue({ 
        data: null, 
        error: { 
          code: 'PGRST204', 
          message: 'new row for relation "prayers" violates check constraint "prayers_text_check"',
          details: 'Failing row contains (short)',
          hint: 'Text must be between 10 and 4000 characters'
        } 
      });

      await expect(prayerService.createPrayer(createRequest)).rejects.toThrow(
        'Failed to create prayer: new row for relation "prayers" violates check constraint "prayers_text_check"'
      );
    });

    it('should handle prayer text too long', async () => {
      const mockUser = { id: 'user1' };
      const longText = 'a'.repeat(4001); // Too long
      const createRequest = {
        text: longText,
        privacy_level: 'public' as const,
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.single.mockResolvedValue({ 
        data: null, 
        error: { 
          code: 'PGRST204', 
          message: 'new row for relation "prayers" violates check constraint "prayers_text_check"',
          details: `Failing row contains (${longText.substring(0, 50)}...)`,
          hint: 'Text must be between 10 and 4000 characters'
        } 
      });

      await expect(prayerService.createPrayer(createRequest)).rejects.toThrow(
        'Failed to create prayer: new row for relation "prayers" violates check constraint "prayers_text_check"'
      );
    });

    it('should handle invalid privacy level', async () => {
      const mockUser = { id: 'user1' };
      const createRequest = {
        text: 'Valid prayer text',
        privacy_level: 'invalid' as any, // Invalid privacy level
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.single.mockResolvedValue({ 
        data: null, 
        error: { 
          code: 'PGRST204', 
          message: 'invalid input value for enum privacy_level: "invalid"',
          details: null,
          hint: 'Valid values are: public, friends, groups, private'
        } 
      });

      await expect(prayerService.createPrayer(createRequest)).rejects.toThrow(
        'Failed to create prayer: invalid input value for enum privacy_level: "invalid"'
      );
    });
  });

  describe('Foreign Key Constraint Errors', () => {
    it('should handle invalid user_id reference', async () => {
      const mockUser = { id: 'user1' };
      const createRequest = {
        text: 'Valid prayer text',
        privacy_level: 'public' as const,
        group_id: 'nonexistent-group', // Invalid group reference
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.single.mockResolvedValue({ 
        data: null, 
        error: { 
          code: 'PGRST204', 
          message: 'insert or update on table "prayers" violates foreign key constraint "prayers_group_id_fkey"',
          details: 'Key (group_id)=(nonexistent-group) is not present in table "groups"',
          hint: null
        } 
      });

      await expect(prayerService.createPrayer(createRequest)).rejects.toThrow(
        'Failed to create prayer: insert or update on table "prayers" violates foreign key constraint "prayers_group_id_fkey"'
      );
    });

    it('should handle invalid prayer_id in interactions', async () => {
      const mockUser = { id: 'user1' };
      const interaction = {
        type: 'LIKE' as const,
        committed_at: new Date().toISOString(),
        reminder_frequency: 'none' as const,
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockSelectQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockSelectQuery as any)
        .mockReturnValueOnce(mockInsertQuery as any);

      mockSelectQuery.single.mockResolvedValue({ data: null, error: null });
      mockInsertQuery.insert.mockResolvedValue({ 
        error: { 
          code: 'PGRST204', 
          message: 'insert or update on table "interactions" violates foreign key constraint "interactions_prayer_id_fkey"',
          details: 'Key (prayer_id)=(nonexistent-prayer) is not present in table "prayers"',
          hint: null
        } 
      });

      await expect(prayerService.interactWithPrayer('nonexistent-prayer', interaction)).rejects.toThrow(
        'insert or update on table "interactions" violates foreign key constraint "interactions_prayer_id_fkey"'
      );
    });
  });

  describe('Network and Connection Errors', () => {
    it('should handle network timeout errors', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.range.mockRejectedValue(new Error('Network timeout'));

      await expect(prayerService.fetchPrayers({
        feedType: 'discover',
        page: 1,
        limit: 20,
      })).rejects.toThrow('Network timeout');
    });

    it('should handle connection refused errors', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.range.mockRejectedValue(new Error('Connection refused'));

      await expect(prayerService.fetchPrayers({
        feedType: 'discover',
        page: 1,
        limit: 20,
      })).rejects.toThrow('Connection refused');
    });
  });

  describe('Permission and RLS Errors', () => {
    it('should handle insufficient permissions', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.range.mockResolvedValue({ 
        data: null, 
        error: { 
          code: 'PGRST301', 
          message: 'permission denied for table prayers',
          details: null,
          hint: 'Check your RLS policies'
        } 
      });

      await expect(prayerService.fetchPrayers({
        feedType: 'discover',
        page: 1,
        limit: 20,
      })).rejects.toThrow('permission denied for table prayers');
    });

    it('should handle RLS policy violations', async () => {
      const mockUser = { id: 'user1' };
      const createRequest = {
        text: 'Valid prayer text',
        privacy_level: 'private' as const,
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.single.mockResolvedValue({ 
        data: null, 
        error: { 
          code: 'PGRST301', 
          message: 'new row violates row-level security policy for table "prayers"',
          details: null,
          hint: 'Check your RLS policies for prayers table'
        } 
      });

      await expect(prayerService.createPrayer(createRequest)).rejects.toThrow(
        'Failed to create prayer: new row violates row-level security policy for table "prayers"'
      );
    });
  });

  describe('Error Recovery and Fallbacks', () => {
    it('should provide helpful error messages with context', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.range.mockResolvedValue({ 
        data: null, 
        error: { 
          code: 'PGRST205', 
          message: "Could not find the table 'public.prayer_likes' in the schema cache",
          details: null,
          hint: "Perhaps you meant the table 'public.prayer_feed'"
        } 
      });

      try {
        await prayerService.fetchPrayers({
          feedType: 'discover',
          page: 1,
          limit: 20,
        });
      } catch (error: any) {
        expect(error.code).toBe('PGRST205');
        expect(error.message).toContain('prayer_likes');
        expect(error.hint).toContain('prayer_feed');
      }
    });

    it('should log detailed error information for debugging', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockUser = { id: 'user1' };
      const createRequest = {
        text: 'Test prayer',
        privacy_level: 'public' as const,
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.single.mockResolvedValue({ 
        data: null, 
        error: { 
          code: 'PGRST204', 
          message: 'Database error',
          details: 'Detailed error info',
          hint: 'Helpful hint'
        } 
      });

      await expect(prayerService.createPrayer(createRequest)).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith('Prayer creation error:', {
        code: 'PGRST204',
        message: 'Database error',
        details: 'Detailed error info',
        hint: 'Helpful hint'
      });

      consoleSpy.mockRestore();
    });
  });
});