/**
 * Prayer Flow Integration Tests
 * 
 * End-to-end tests for critical prayer-related user flows to ensure
 * the entire system works together correctly.
 */

import { prayerService } from '@/services/api/prayerService';
import { PrayerRepository } from '@/repositories/PrayerRepository';
import { supabase } from '@/config/supabase';
import { Prayer, CreatePrayerRequest, PrayerInteractionRequest } from '@/types/database.types';

// Mock Supabase for integration tests
jest.mock('@/config/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn(),
    },
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Prayer Flow Integration Tests', () => {
  let prayerRepository: PrayerRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    prayerRepository = new PrayerRepository(mockSupabase);
  });

  describe('Complete Prayer Creation Flow', () => {
    it('should create prayer and verify it exists in database', async () => {
      const mockUser = { id: 'user1' };
      const createRequest: CreatePrayerRequest = {
        text: 'Please pray for my family during this difficult time',
        privacy_level: 'public',
        location_city: 'New York',
        location_lat: 40.7128,
        location_lon: -74.0060,
        location_granularity: 'city',
        tags: ['family', 'health'],
      };

      const mockCreatedPrayer: Prayer = {
        id: 'prayer1',
        user_id: 'user1',
        text: createRequest.text,
        privacy_level: 'public',
        location_city: 'New York',
        location_lat: 40.7128,
        location_lon: -74.0060,
        location_granularity: 'city',
        tags: ['family', 'health'],
        status: 'open',
        is_anonymous: false,
        images: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      } as Prayer;

      // Mock authentication
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      // Mock prayer creation
      const mockCreateQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      // Mock prayer retrieval
      const mockSelectQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn(),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockCreateQuery as any)
        .mockReturnValueOnce(mockSelectQuery as any);

      mockCreateQuery.single.mockResolvedValue({ data: mockCreatedPrayer, error: null });
      mockSelectQuery.maybeSingle.mockResolvedValue({ data: mockCreatedPrayer, error: null });

      // Create prayer
      const createdPrayer = await prayerService.createPrayer(createRequest);
      expect(createdPrayer).toEqual(mockCreatedPrayer);

      // Verify prayer exists
      const retrievedPrayer = await prayerService.getPrayer('prayer1');
      expect(retrievedPrayer).toEqual(mockCreatedPrayer);

      // Verify repository can also find it
      const repoResult = await prayerRepository.findByIdBatched('prayer1');
      expect(repoResult).toEqual(mockCreatedPrayer);
    });

    it('should handle prayer creation with all optional fields', async () => {
      const mockUser = { id: 'user1' };
      const createRequest: CreatePrayerRequest = {
        text: 'Prayer for guidance and wisdom',
        privacy_level: 'friends',
        group_id: 'group1',
        is_anonymous: true,
        tags: ['guidance', 'wisdom'],
        images: ['image1.jpg', 'image2.jpg'],
        location_city: 'Los Angeles',
        location_lat: 34.0522,
        location_lon: -118.2437,
        location_granularity: 'precise',
      };

      const mockCreatedPrayer: Prayer = {
        id: 'prayer2',
        user_id: 'user1',
        text: createRequest.text,
        privacy_level: 'friends',
        group_id: 'group1',
        is_anonymous: true,
        tags: ['guidance', 'wisdom'],
        images: ['image1.jpg', 'image2.jpg'],
        location_city: 'Los Angeles',
        location_lat: 34.0522,
        location_lon: -118.2437,
        location_granularity: 'precise',
        status: 'open',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      } as Prayer;

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.single.mockResolvedValue({ data: mockCreatedPrayer, error: null });

      const result = await prayerService.createPrayer(createRequest);

      expect(result).toEqual(mockCreatedPrayer);
      expect(mockQuery.insert).toHaveBeenCalledWith({
        user_id: 'user1',
        text: createRequest.text,
        privacy_level: 'friends',
        location_city: 'Los Angeles',
        location_lat: 34.0522,
        location_lon: -118.2437,
        location_granularity: 'precise',
        group_id: 'group1',
        is_anonymous: true,
        tags: ['guidance', 'wisdom'],
        images: ['image1.jpg', 'image2.jpg'],
        status: 'open',
      });
    });
  });

  describe('Prayer Interaction Flow', () => {
    it('should handle complete interaction lifecycle', async () => {
      const mockUser = { id: 'user1' };
      const prayerId = 'prayer1';

      // Mock authentication
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      // Mock interaction creation
      const mockSelectQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
      };

      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      const mockDeleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockSelectQuery as any) // Check existing interaction
        .mockReturnValueOnce(mockInsertQuery as any) // Create new interaction
        .mockReturnValueOnce(mockSelectQuery as any) // Check for update
        .mockReturnValueOnce(mockUpdateQuery as any) // Update interaction
        .mockReturnValueOnce(mockDeleteQuery as any); // Remove interaction

      // No existing interaction
      mockSelectQuery.single.mockResolvedValueOnce({ data: null, error: null });
      mockInsertQuery.insert.mockResolvedValue({ error: null });

      // Create interaction
      const interaction: PrayerInteractionRequest = {
        type: 'LIKE',
        committed_at: new Date().toISOString(),
        reminder_frequency: 'none',
      };

      await prayerService.interactWithPrayer(prayerId, interaction);
      expect(mockInsertQuery.insert).toHaveBeenCalledWith({
        prayer_id: prayerId,
        user_id: 'user1',
        type: 'LIKE',
        committed_at: interaction.committed_at,
        reminder_frequency: 'none',
      });

      // Existing interaction found
      mockSelectQuery.single.mockResolvedValueOnce({ 
        data: { id: 'interaction1' }, 
        error: null 
      });
      mockUpdateQuery.eq.mockResolvedValue({ error: null });

      // Update interaction
      const updatedInteraction: PrayerInteractionRequest = {
        type: 'LIKE',
        committed_at: new Date().toISOString(),
        reminder_frequency: 'daily',
      };

      await prayerService.interactWithPrayer(prayerId, updatedInteraction);
      expect(mockUpdateQuery.update).toHaveBeenCalledWith({
        committed_at: updatedInteraction.committed_at,
        reminder_frequency: 'daily',
      });

      // Remove interaction
      mockDeleteQuery.eq.mockResolvedValue({ error: null });
      await prayerService.removeInteraction(prayerId, 'LIKE');
      expect(mockDeleteQuery.delete).toHaveBeenCalled();
    });

    it('should handle different interaction types', async () => {
      const mockUser = { id: 'user1' };
      const prayerId = 'prayer1';

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const interactionTypes: Array<'PRAY' | 'LIKE' | 'SHARE' | 'SAVE'> = ['PRAY', 'LIKE', 'SHARE', 'SAVE'];

      for (const type of interactionTypes) {
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
        mockInsertQuery.insert.mockResolvedValue({ error: null });

        const interaction: PrayerInteractionRequest = {
          type,
          committed_at: new Date().toISOString(),
          reminder_frequency: 'none',
        };

        await prayerService.interactWithPrayer(prayerId, interaction);

        expect(mockInsertQuery.insert).toHaveBeenCalledWith({
          prayer_id: prayerId,
          user_id: 'user1',
          type,
          committed_at: interaction.committed_at,
          reminder_frequency: 'none',
        });
      }
    });
  });

  describe('Prayer Feed Flow', () => {
    it('should fetch and display prayer feed correctly', async () => {
      const mockPrayers: Prayer[] = [
        {
          id: 'prayer1',
          user_id: 'user1',
          text: 'Prayer for peace',
          privacy_level: 'public',
          status: 'open',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        } as Prayer,
        {
          id: 'prayer2',
          user_id: 'user2',
          text: 'Prayer for healing',
          privacy_level: 'public',
          status: 'open',
          created_at: '2023-01-01T01:00:00Z',
          updated_at: '2023-01-01T01:00:00Z',
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

      // Test discover feed
      const discoverFeed = await prayerService.fetchPrayers({
        feedType: 'discover',
        page: 1,
        limit: 20,
      });

      expect(discoverFeed).toEqual(mockPrayers);
      expect(mockQuery.eq).toHaveBeenCalledWith('privacy_level', 'public');

      // Test group feed
      const groupFeed = await prayerService.fetchPrayers({
        feedType: 'discover',
        groupId: 'group1',
        page: 1,
        limit: 20,
      });

      expect(groupFeed).toEqual(mockPrayers);
      expect(mockQuery.eq).toHaveBeenCalledWith('group_id', 'group1');
    });

    it('should handle pagination correctly', async () => {
      const mockPrayers: Prayer[] = [];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.range.mockResolvedValue({ data: mockPrayers, error: null });

      // Test different pages
      await prayerService.fetchPrayers({
        feedType: 'discover',
        page: 1,
        limit: 10,
      });
      expect(mockQuery.range).toHaveBeenCalledWith(0, 9);

      await prayerService.fetchPrayers({
        feedType: 'discover',
        page: 2,
        limit: 10,
      });
      expect(mockQuery.range).toHaveBeenCalledWith(10, 19);

      await prayerService.fetchPrayers({
        feedType: 'discover',
        page: 3,
        limit: 5,
      });
      expect(mockQuery.range).toHaveBeenCalledWith(10, 14);
    });
  });

  describe('Prayer Search Flow', () => {
    it('should search prayers with various filters', async () => {
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

      // Test text search
      await prayerService.searchPrayers('healing', {
        tags: ['health'],
        location: 'New York',
        status: 'open',
      });

      expect(mockQuery.textSearch).toHaveBeenCalledWith('text', 'healing', {
        type: 'websearch',
        config: 'english',
      });
      expect(mockQuery.contains).toHaveBeenCalledWith('tags', ['health']);
      expect(mockQuery.ilike).toHaveBeenCalledWith('location_city', '%New York%');
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'open');
    });

    it('should handle search errors gracefully', async () => {
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
        error: { code: 'PGRST202', message: 'Text search column not found' } 
      });

      await expect(prayerService.searchPrayers('test')).rejects.toThrow('Text search column not found');
    });
  });

  describe('Prayer Status Management Flow', () => {
    it('should update prayer status through repository', async () => {
      const prayerId = 'prayer1';
      const mockUpdatedPrayer: Prayer = {
        id: prayerId,
        user_id: 'user1',
        text: 'Test prayer',
        privacy_level: 'public',
        status: 'answered',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T01:00:00Z',
      } as Prayer;

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.single.mockResolvedValue({ data: mockUpdatedPrayer, error: null });

      const result = await prayerRepository.updateStatus(prayerId, 'answered');

      expect(result).toEqual(mockUpdatedPrayer);
      expect(mockQuery.update).toHaveBeenCalledWith({
        status: 'answered',
        updated_at: expect.any(String),
      });
    });

    it('should handle status update errors', async () => {
      const prayerId = 'nonexistent';
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST202', message: 'Prayer not found' } 
      });

      await expect(prayerRepository.updateStatus(prayerId, 'answered')).rejects.toThrow(
        'Failed to update prayer status: Prayer not found'
      );
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle database connection errors', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);
      mockQuery.range.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST301', message: 'Database connection failed' } 
      });

      await expect(prayerService.fetchPrayers({
        feedType: 'discover',
        page: 1,
        limit: 20,
      })).rejects.toThrow('Database connection failed');
    });

    it('should handle authentication errors consistently', async () => {
      const createRequest: CreatePrayerRequest = {
        text: 'Test prayer',
        privacy_level: 'public',
      };

      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: null }, 
        error: { message: 'Session expired' } 
      });

      await expect(prayerService.createPrayer(createRequest)).rejects.toThrow('Authentication error');
    });

    it('should handle table not found errors (like the prayer_likes error)', async () => {
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
          hint: "Perhaps you meant the table 'public.prayer_feed'"
        } 
      });

      await expect(prayerService.fetchPrayers({
        feedType: 'discover',
        page: 1,
        limit: 20,
      })).rejects.toThrow("Could not find the table 'public.prayer_likes' in the schema cache");
    });
  });

  describe('Performance Integration', () => {
    it('should use batched requests when available', async () => {
      const mockPrayer: Prayer = {
        id: '1',
        user_id: 'user1',
        text: 'Test prayer',
        privacy_level: 'public',
        status: 'open',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      } as Prayer;

      // Mock the request batching service
      const mockRequestBatchingService = require('@/services/performance/requestBatchingService').requestBatchingService;
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

    it('should fallback gracefully when batching fails', async () => {
      const mockPrayer: Prayer = {
        id: '1',
        user_id: 'user1',
        text: 'Test prayer',
        privacy_level: 'public',
        status: 'open',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      } as Prayer;

      const mockRequestBatchingService = require('@/services/performance/requestBatchingService').requestBatchingService;
      mockRequestBatchingService.batchRequest.mockRejectedValue(new Error('Batching service down'));

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
});