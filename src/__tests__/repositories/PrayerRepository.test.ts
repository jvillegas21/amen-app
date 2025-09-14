/**
 * Prayer Repository Unit Tests
 * 
 * Tests for the PrayerRepository class to ensure proper database interactions
 * and error handling at the repository layer.
 */

import { PrayerRepository } from '@/repositories/PrayerRepository';
import { SupabaseClient } from '@supabase/supabase-js';
import { Prayer, CreatePrayerRequest } from '@/types/database.types';

// Mock the request batching service
jest.mock('@/services/performance/requestBatchingService', () => ({
  requestBatchingService: {
    batchRequest: jest.fn(),
  },
}));

const mockSupabase = {
  from: jest.fn(),
  rpc: jest.fn(),
} as unknown as jest.Mocked<SupabaseClient>;

const mockRequestBatchingService = require('@/services/performance/requestBatchingService').requestBatchingService;

describe('PrayerRepository', () => {
  let prayerRepository: PrayerRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    prayerRepository = new PrayerRepository(mockSupabase);
  });

  describe('findByIdBatched', () => {
    it('should use batched request when available', async () => {
      const mockPrayer: Prayer = {
        id: '1',
        user_id: 'user1',
        text: 'Test prayer',
        privacy_level: 'public',
        status: 'open',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      } as Prayer;

      mockRequestBatchingService.batchRequest.mockResolvedValue(mockPrayer);

      const result = await prayerRepository.findByIdBatched('1');

      expect(result).toEqual(mockPrayer);
      expect(mockRequestBatchingService.batchRequest).toHaveBeenCalledWith(
        'prayers',
        'select',
        { id: '1' },
        'high'
      );
    });

    it('should fallback to direct query when batching fails', async () => {
      const mockPrayer: Prayer = {
        id: '1',
        user_id: 'user1',
        text: 'Test prayer',
        privacy_level: 'public',
        status: 'open',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      } as Prayer;

      mockRequestBatchingService.batchRequest.mockRejectedValue(new Error('Batching failed'));

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.single.mockResolvedValue({ data: mockPrayer, error: null });

      const result = await prayerRepository.findByIdBatched('1');

      expect(result).toEqual(mockPrayer);
      expect(mockSupabase.from).toHaveBeenCalledWith('prayers');
    });
  });

  describe('createBatched', () => {
    it('should use batched request for creation', async () => {
      const createRequest: CreatePrayerRequest = {
        text: 'Test prayer',
        privacy_level: 'public',
      };

      const mockPrayer: Prayer = {
        id: '1',
        user_id: 'user1',
        text: 'Test prayer',
        privacy_level: 'public',
        status: 'open',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      } as Prayer;

      mockRequestBatchingService.batchRequest.mockResolvedValue(mockPrayer);

      const result = await prayerRepository.createBatched(createRequest);

      expect(result).toEqual(mockPrayer);
      expect(mockRequestBatchingService.batchRequest).toHaveBeenCalledWith(
        'prayers',
        'insert',
        { data: createRequest },
        'medium'
      );
    });

    it('should fallback to direct insert when batching fails', async () => {
      const createRequest: CreatePrayerRequest = {
        text: 'Test prayer',
        privacy_level: 'public',
      };

      mockRequestBatchingService.batchRequest.mockRejectedValue(new Error('Batching failed'));

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      const mockPrayer: Prayer = {
        id: '1',
        user_id: 'user1',
        text: 'Test prayer',
        privacy_level: 'public',
        status: 'open',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      } as Prayer;

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.single.mockResolvedValue({ data: mockPrayer, error: null });

      const result = await prayerRepository.createBatched(createRequest);

      expect(result).toEqual(mockPrayer);
      expect(mockSupabase.from).toHaveBeenCalledWith('prayers');
    });
  });

  describe('findFeedPrayers', () => {
    it('should fetch discover feed prayers', async () => {
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
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.range.mockResolvedValue({ 
        data: mockPrayers, 
        error: null, 
        count: 1 
      });

      const result = await prayerRepository.findFeedPrayers('user1', 'discover', {
        page: 1,
        pageSize: 20,
      });

      expect(result.data).toEqual(mockPrayers);
      expect(result.pagination.total).toBe(1);
      expect(mockQuery.eq).toHaveBeenCalledWith('privacy_level', 'public');
    });

    it('should fetch following feed prayers', async () => {
      const mockPrayers: Prayer[] = [];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.range.mockResolvedValue({ 
        data: mockPrayers, 
        error: null, 
        count: 0 
      });

      await prayerRepository.findFeedPrayers('user1', 'following', {
        page: 1,
        pageSize: 20,
      });

      expect(mockQuery.in).toHaveBeenCalledWith('privacy_level', ['public', 'friends']);
    });

    it('should handle database errors', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.range.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST205', message: 'Table not found' },
        count: 0
      });

      await expect(prayerRepository.findFeedPrayers('user1', 'discover')).rejects.toThrow(
        'Failed to fetch feed prayers: Table not found'
      );
    });
  });

  describe('findByUserId', () => {
    it('should fetch prayers by user ID', async () => {
      const mockPrayers: Prayer[] = [];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.range.mockResolvedValue({ 
        data: mockPrayers, 
        error: null, 
        count: 0 
      });

      const result = await prayerRepository.findByUserId('user1', {
        page: 1,
        pageSize: 20,
      });

      expect(result.data).toEqual(mockPrayers);
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user1');
    });
  });

  describe('findByGroupId', () => {
    it('should fetch prayers by group ID', async () => {
      const mockPrayers: Prayer[] = [];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.range.mockResolvedValue({ 
        data: mockPrayers, 
        error: null, 
        count: 0 
      });

      const result = await prayerRepository.findByGroupId('group1', {
        page: 1,
        pageSize: 20,
      });

      expect(result.data).toEqual(mockPrayers);
      expect(mockQuery.eq).toHaveBeenCalledWith('group_id', 'group1');
    });
  });

  describe('findPublicPrayers', () => {
    it('should fetch public prayers with filters', async () => {
      const mockPrayers: Prayer[] = [];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.range.mockResolvedValue({ 
        data: mockPrayers, 
        error: null, 
        count: 0 
      });

      const result = await prayerRepository.findPublicPrayers({
        page: 1,
        pageSize: 20,
        filters: {
          tags: ['faith'],
          status: 'open',
        },
      });

      expect(result.data).toEqual(mockPrayers);
      expect(mockQuery.eq).toHaveBeenCalledWith('privacy_level', 'public');
    });
  });

  describe('searchPrayers', () => {
    it('should search prayers with text search', async () => {
      const mockPrayers: Prayer[] = [];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        textSearch: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.range.mockResolvedValue({ 
        data: mockPrayers, 
        error: null, 
        count: 0 
      });

      const result = await prayerRepository.searchPrayers('test query', {
        page: 1,
        pageSize: 20,
      });

      expect(result.data).toEqual(mockPrayers);
      expect(mockQuery.textSearch).toHaveBeenCalledWith('text', 'test query', {
        type: 'websearch',
        config: 'english',
      });
    });

    it('should handle search errors', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        textSearch: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.range.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST202', message: 'Text search error' },
        count: 0
      });

      await expect(prayerRepository.searchPrayers('test')).rejects.toThrow(
        'Failed to search prayers: Text search error'
      );
    });
  });

  describe('findSavedPrayers', () => {
    it('should fetch saved prayers through interactions', async () => {
      const mockData = [
        { prayer: { id: '1', text: 'Saved prayer' } }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.range.mockResolvedValue({ 
        data: mockData, 
        error: null, 
        count: 1 
      });

      const result = await prayerRepository.findSavedPrayers('user1', {
        page: 1,
        pageSize: 20,
      });

      expect(result.data).toEqual([{ id: '1', text: 'Saved prayer' }]);
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user1');
      expect(mockQuery.eq).toHaveBeenCalledWith('type', 'SAVE');
    });

    it('should handle saved prayers errors', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.range.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST205', message: 'Table not found' },
        count: 0
      });

      await expect(prayerRepository.findSavedPrayers('user1')).rejects.toThrow(
        'Failed to fetch saved prayers: Table not found'
      );
    });
  });

  describe('findInteractedPrayers', () => {
    it('should fetch prayers by interaction type', async () => {
      const mockData = [
        { prayer: { id: '1', text: 'Liked prayer' } }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.range.mockResolvedValue({ 
        data: mockData, 
        error: null, 
        count: 1 
      });

      const result = await prayerRepository.findInteractedPrayers('user1', 'LIKE', {
        page: 1,
        pageSize: 20,
      });

      expect(result.data).toEqual([{ id: '1', text: 'Liked prayer' }]);
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user1');
      expect(mockQuery.eq).toHaveBeenCalledWith('type', 'LIKE');
    });

    it('should fetch all interacted prayers when no type specified', async () => {
      const mockData = [];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.range.mockResolvedValue({ 
        data: mockData, 
        error: null, 
        count: 0 
      });

      await prayerRepository.findInteractedPrayers('user1', undefined, {
        page: 1,
        pageSize: 20,
      });

      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user1');
      expect(mockQuery.eq).not.toHaveBeenCalledWith('type', expect.anything());
    });
  });

  describe('updateStatus', () => {
    it('should update prayer status', async () => {
      const mockPrayer: Prayer = {
        id: '1',
        user_id: 'user1',
        text: 'Test prayer',
        privacy_level: 'public',
        status: 'answered',
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

      const result = await prayerRepository.updateStatus('1', 'answered');

      expect(result).toEqual(mockPrayer);
      expect(mockQuery.update).toHaveBeenCalledWith({
        status: 'answered',
        updated_at: expect.any(String),
      });
    });

    it('should handle status update errors', async () => {
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

      await expect(prayerRepository.updateStatus('1', 'answered')).rejects.toThrow(
        'Failed to update prayer status: Column not found'
      );
    });

    it('should handle prayer not found', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.single.mockResolvedValue({ data: null, error: null });

      await expect(prayerRepository.updateStatus('1', 'answered')).rejects.toThrow(
        'Prayer not found'
      );
    });
  });

  describe('incrementViewCount', () => {
    it('should call RPC function to increment view count', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      await expect(prayerRepository.incrementViewCount('1')).resolves.not.toThrow();

      expect(mockSupabase.rpc).toHaveBeenCalledWith('increment_prayer_view_count', {
        prayer_id: '1',
      });
    });

    it('should handle RPC errors', async () => {
      mockSupabase.rpc.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST204', message: 'Function not found' } 
      });

      await expect(prayerRepository.incrementViewCount('1')).rejects.toThrow(
        'Failed to increment view count: Function not found'
      );
    });
  });

  describe('getUserPrayerStats', () => {
    it('should get user prayer statistics', async () => {
      const mockStats = {
        totalPrayers: 10,
        openPrayers: 5,
        answeredPrayers: 3,
        closedPrayers: 2,
        totalInteractions: 25,
        totalComments: 8,
      };

      mockSupabase.rpc.mockResolvedValue({ data: mockStats, error: null });

      const result = await prayerRepository.getUserPrayerStats('user1');

      expect(result).toEqual(mockStats);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_user_prayer_stats', {
        user_id: 'user1',
      });
    });

    it('should return default stats when RPC fails', async () => {
      mockSupabase.rpc.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST204', message: 'Function not found' } 
      });

      const result = await prayerRepository.getUserPrayerStats('user1');

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

  describe('findTrendingPrayers', () => {
    it('should fetch trending prayers from last 7 days', async () => {
      const mockPrayers: Prayer[] = [];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.range.mockResolvedValue({ 
        data: mockPrayers, 
        error: null, 
        count: 0 
      });

      const result = await prayerRepository.findTrendingPrayers({
        page: 1,
        pageSize: 20,
      });

      expect(result.data).toEqual(mockPrayers);
      expect(mockQuery.eq).toHaveBeenCalledWith('privacy_level', 'public');
      expect(mockQuery.gte).toHaveBeenCalledWith('created_at', expect.any(String));
    });
  });

  describe('findNearbyPrayers', () => {
    it('should find nearby prayers using RPC function', async () => {
      const mockPrayers: Prayer[] = [];
      const mockQuery = {
        range: jest.fn().mockReturnThis(),
      };

      mockSupabase.rpc.mockReturnValue(mockQuery as any);
      mockQuery.range.mockResolvedValue({ 
        data: mockPrayers, 
        error: null 
      });

      const result = await prayerRepository.findNearbyPrayers(40.7128, -74.0060, 10, {
        page: 1,
        pageSize: 20,
      });

      expect(result.data).toEqual(mockPrayers);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('find_nearby_prayers', {
        center_lat: 40.7128,
        center_lon: -74.0060,
        radius_km: 10,
      });
    });

    it('should handle nearby prayers errors', async () => {
      const mockQuery = {
        range: jest.fn().mockReturnThis(),
      };

      mockSupabase.rpc.mockReturnValue(mockQuery as any);
      mockQuery.range.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST204', message: 'Function not found' } 
      });

      await expect(prayerRepository.findNearbyPrayers(40.7128, -74.0060, 10)).rejects.toThrow(
        'Failed to find nearby prayers: Function not found'
      );
    });
  });
});