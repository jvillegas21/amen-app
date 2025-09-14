/**
 * Prayer Service Unit Tests
 * 
 * Comprehensive tests for the PrayerService class to ensure all methods
 * work correctly and handle errors appropriately.
 */

import { prayerService } from '@/services/api/prayerService';
import { supabase } from '@/config/supabase';
import { Prayer, CreatePrayerRequest, PrayerInteractionRequest } from '@/types/database.types';

// Mock Supabase
jest.mock('@/config/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          range: jest.fn(() => ({
            eq: jest.fn(),
            in: jest.fn(),
          })),
        })),
        eq: jest.fn(() => ({
          maybeSingle: jest.fn(),
          single: jest.fn(),
        })),
        limit: jest.fn(),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(),
      })),
      textSearch: jest.fn(() => ({
        contains: jest.fn(() => ({
          ilike: jest.fn(() => ({
            eq: jest.fn(),
          })),
        })),
      })),
    })),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('PrayerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchPrayers', () => {
    it('should fetch prayers for discover feed', async () => {
      const mockPrayers: Prayer[] = [
        {
          id: '1',
          user_id: 'user1',
          text: 'Test prayer',
          privacy_level: 'public',
          status: 'open',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        } as Prayer,
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.range.mockResolvedValue({ data: mockPrayers, error: null });

      const result = await prayerService.fetchPrayers({
        feedType: 'discover',
        page: 1,
        limit: 20,
      });

      expect(result).toEqual(mockPrayers);
      expect(mockQuery.eq).toHaveBeenCalledWith('privacy_level', 'public');
    });

    it('should fetch prayers for group', async () => {
      const mockPrayers: Prayer[] = [];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.range.mockResolvedValue({ data: mockPrayers, error: null });

      await prayerService.fetchPrayers({
        feedType: 'discover',
        groupId: 'group1',
        page: 1,
        limit: 20,
      });

      expect(mockQuery.eq).toHaveBeenCalledWith('group_id', 'group1');
    });

    it('should handle database errors', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.range.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST205', message: 'Table not found' } 
      });

      await expect(prayerService.fetchPrayers({
        feedType: 'discover',
        page: 1,
        limit: 20,
      })).rejects.toThrow('Table not found');
    });
  });

  describe('getPrayer', () => {
    it('should get prayer by ID', async () => {
      const mockPrayer: Prayer = {
        id: '1',
        user_id: 'user1',
        text: 'Test prayer',
        privacy_level: 'public',
        status: 'open',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      } as Prayer;

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.maybeSingle.mockResolvedValue({ data: mockPrayer, error: null });

      const result = await prayerService.getPrayer('1');

      expect(result).toEqual(mockPrayer);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
    });

    it('should throw error when prayer not found', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.maybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(prayerService.getPrayer('nonexistent')).rejects.toThrow('Prayer not found');
    });

    it('should handle database errors', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.maybeSingle.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST202', message: 'Column not found' } 
      });

      await expect(prayerService.getPrayer('1')).rejects.toThrow('Column not found');
    });
  });

  describe('createPrayer', () => {
    it('should create prayer successfully', async () => {
      const mockUser = { id: 'user1' };
      const mockPrayer: Prayer = {
        id: '1',
        user_id: 'user1',
        text: 'Test prayer',
        privacy_level: 'public',
        status: 'open',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      } as Prayer;

      const createRequest: CreatePrayerRequest = {
        text: 'Test prayer',
        privacy_level: 'public',
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.single.mockResolvedValue({ data: mockPrayer, error: null });

      const result = await prayerService.createPrayer(createRequest);

      expect(result).toEqual(mockPrayer);
      expect(mockQuery.insert).toHaveBeenCalledWith({
        user_id: 'user1',
        text: 'Test prayer',
        privacy_level: 'public',
        location_city: undefined,
        location_lat: undefined,
        location_lon: undefined,
        location_granularity: 'hidden',
        group_id: undefined,
        is_anonymous: false,
        tags: [],
        images: [],
        status: 'open',
      });
    });

    it('should handle authentication errors', async () => {
      const createRequest: CreatePrayerRequest = {
        text: 'Test prayer',
        privacy_level: 'public',
      };

      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: null }, 
        error: { message: 'Auth error' } 
      });

      await expect(prayerService.createPrayer(createRequest)).rejects.toThrow('Authentication error');
    });

    it('should handle database errors during creation', async () => {
      const mockUser = { id: 'user1' };
      const createRequest: CreatePrayerRequest = {
        text: 'Test prayer',
        privacy_level: 'public',
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
          message: 'Failed to create prayer',
          details: 'Constraint violation',
          hint: 'Check your data'
        } 
      });

      await expect(prayerService.createPrayer(createRequest)).rejects.toThrow(
        'Failed to create prayer: Failed to create prayer (Code: PGRST204)'
      );
    });

    it('should handle no data returned', async () => {
      const mockUser = { id: 'user1' };
      const createRequest: CreatePrayerRequest = {
        text: 'Test prayer',
        privacy_level: 'public',
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.single.mockResolvedValue({ data: null, error: null });

      await expect(prayerService.createPrayer(createRequest)).rejects.toThrow(
        'Failed to create prayer - no data returned'
      );
    });
  });

  describe('updatePrayer', () => {
    it('should update prayer successfully', async () => {
      const mockPrayer: Prayer = {
        id: '1',
        user_id: 'user1',
        text: 'Updated prayer',
        privacy_level: 'public',
        status: 'open',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      } as Prayer;

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.single.mockResolvedValue({ data: mockPrayer, error: null });

      const result = await prayerService.updatePrayer('1', { text: 'Updated prayer' });

      expect(result).toEqual(mockPrayer);
      expect(mockQuery.update).toHaveBeenCalledWith({
        text: 'Updated prayer',
        updated_at: expect.any(String),
      });
    });

    it('should handle update errors', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST202', message: 'Column not found' } 
      });

      await expect(prayerService.updatePrayer('1', { text: 'Updated' })).rejects.toThrow('Column not found');
    });
  });

  describe('deletePrayer', () => {
    it('should delete prayer successfully', async () => {
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.eq.mockResolvedValue({ error: null });

      await expect(prayerService.deletePrayer('1')).resolves.not.toThrow();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
    });

    it('should handle delete errors', async () => {
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.eq.mockResolvedValue({ 
        error: { code: 'PGRST204', message: 'Foreign key constraint' } 
      });

      await expect(prayerService.deletePrayer('1')).rejects.toThrow('Foreign key constraint');
    });
  });

  describe('interactWithPrayer', () => {
    it('should create new interaction', async () => {
      const mockUser = { id: 'user1' };
      const interaction: PrayerInteractionRequest = {
        type: 'LIKE',
        committed_at: new Date().toISOString(),
        reminder_frequency: 'none',
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      // Mock existing interaction check (no existing interaction)
      const mockSelectQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      // Mock insert query
      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockSelectQuery as any)
        .mockReturnValueOnce(mockInsertQuery as any);

      mockSelectQuery.single.mockResolvedValue({ data: null, error: null });
      mockInsertQuery.insert.mockResolvedValue({ error: null });

      await expect(prayerService.interactWithPrayer('prayer1', interaction)).resolves.not.toThrow();

      expect(mockInsertQuery.insert).toHaveBeenCalledWith({
        prayer_id: 'prayer1',
        user_id: 'user1',
        type: 'LIKE',
        committed_at: interaction.committed_at,
        reminder_frequency: 'none',
      });
    });

    it('should update existing interaction', async () => {
      const mockUser = { id: 'user1' };
      const interaction: PrayerInteractionRequest = {
        type: 'LIKE',
        committed_at: new Date().toISOString(),
        reminder_frequency: 'daily',
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      // Mock existing interaction check (existing interaction found)
      const mockSelectQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      // Mock update query
      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockSelectQuery as any)
        .mockReturnValueOnce(mockUpdateQuery as any);

      mockSelectQuery.single.mockResolvedValue({ 
        data: { id: 'interaction1' }, 
        error: null 
      });
      mockUpdateQuery.eq.mockResolvedValue({ error: null });

      await expect(prayerService.interactWithPrayer('prayer1', interaction)).resolves.not.toThrow();

      expect(mockUpdateQuery.update).toHaveBeenCalledWith({
        committed_at: interaction.committed_at,
        reminder_frequency: 'daily',
      });
    });

    it('should handle authentication errors', async () => {
      const interaction: PrayerInteractionRequest = {
        type: 'LIKE',
        committed_at: new Date().toISOString(),
        reminder_frequency: 'none',
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      await expect(prayerService.interactWithPrayer('prayer1', interaction)).rejects.toThrow('Not authenticated');
    });
  });

  describe('removeInteraction', () => {
    it('should remove interaction successfully', async () => {
      const mockUser = { id: 'user1' };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.eq.mockResolvedValue({ error: null });

      await expect(prayerService.removeInteraction('prayer1', 'LIKE')).resolves.not.toThrow();

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('prayer_id', 'prayer1');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user1');
      expect(mockQuery.eq).toHaveBeenCalledWith('type', 'LIKE');
    });
  });

  describe('getUserPrayers', () => {
    it('should fetch user prayers with pagination', async () => {
      const mockPrayers: Prayer[] = [];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.range.mockResolvedValue({ data: mockPrayers, error: null });

      const result = await prayerService.getUserPrayers('user1', 2, 10);

      expect(result).toEqual(mockPrayers);
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user1');
      expect(mockQuery.range).toHaveBeenCalledWith(10, 19); // (page-1) * limit, page * limit - 1
    });
  });

  describe('getSavedPrayers', () => {
    it('should fetch saved prayers', async () => {
      const mockUser = { id: 'user1' };
      const mockData = [
        { prayer: { id: '1', text: 'Saved prayer' } }
      ];

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.range.mockResolvedValue({ data: mockData, error: null });

      const result = await prayerService.getSavedPrayers(1, 20);

      expect(result).toEqual([{ id: '1', text: 'Saved prayer' }]);
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user1');
      expect(mockQuery.eq).toHaveBeenCalledWith('type', 'SAVE');
    });
  });

  describe('searchPrayers', () => {
    it('should search prayers with text search', async () => {
      const mockPrayers: Prayer[] = [];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        textSearch: jest.fn().mockReturnThis(),
        contains: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.eq.mockResolvedValue({ data: mockPrayers, error: null });

      const result = await prayerService.searchPrayers('test query', {
        tags: ['faith'],
        location: 'New York',
        status: 'open',
      });

      expect(result).toEqual(mockPrayers);
      expect(mockQuery.textSearch).toHaveBeenCalledWith('text', 'test query', {
        type: 'websearch',
        config: 'english',
      });
    });

    it('should handle search errors', async () => {
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
        error: { code: 'PGRST202', message: 'Text search error' } 
      });

      await expect(prayerService.searchPrayers('test')).rejects.toThrow('Text search error');
    });
  });
});