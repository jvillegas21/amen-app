import { supabase } from '@/config/supabase';
import { Prayer, CreatePrayerRequest, PrayerInteractionRequest } from '@/types/database.types';
import { PrayerRepository } from '@/repositories/prayer.repository';
import { InteractionRepository } from '@/repositories/interaction.repository';
import { ErrorTransformationService } from '@/services/errorTransformationService';
import { RepositoryFactory } from '@/repositories/base.repository';

/**
 * Prayer Service - Manages prayer-related API operations
 * Uses repository pattern for database operations and proper error handling
 */
class PrayerService {
  private prayerRepository: PrayerRepository;
  private interactionRepository: InteractionRepository;

  constructor() {
    this.prayerRepository = RepositoryFactory.getRepository(PrayerRepository);
    this.interactionRepository = RepositoryFactory.getRepository(InteractionRepository);
  }
  /**
   * Fetch prayers based on feed type
   * Uses repository pattern to avoid N+1 queries
   */
  async fetchPrayers(params: {
    feedType: 'following' | 'discover';
    groupId?: string;
    page: number;
    limit: number;
  }): Promise<Prayer[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // Use repository to get prayers with optimized queries
      const prayers = await this.prayerRepository.getPrayersWithDetails({
        feedType: params.feedType,
        groupId: params.groupId,
        page: params.page,
        limit: params.limit,
        userId,
      });

      // If we have prayers and a user, get interaction counts and user interactions in batch
      if (prayers.length > 0 && userId) {
        const prayerIds = prayers.map(p => p.id);
        
        // Get interaction counts for all prayers in one query
        const interactionCounts = await this.interactionRepository.getInteractionCountsForPrayers(prayerIds);
        
        // Get user's interactions for all prayers in one query
        const userInteractions = await this.interactionRepository.getUserInteractionsForPrayers(prayerIds, userId);

        // Merge the data
        return prayers.map(prayer => ({
          ...prayer,
          ...interactionCounts[prayer.id],
          user_interaction: userInteractions[prayer.id] || null,
        }));
      }

      return prayers;
    } catch (error) {
      throw new Error(ErrorTransformationService.transformError(error, 'fetchPrayers'));
    }
  }

  /**
   * Get single prayer by ID
   */
  async getPrayer(prayerId: string): Promise<Prayer> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      const prayer = await this.prayerRepository.getPrayerWithDetails(prayerId, userId);
      
      if (!prayer) {
        throw new Error('Prayer not found');
      }

      return prayer;
    } catch (error) {
      throw new Error(ErrorTransformationService.transformError(error, 'getPrayer'));
    }
  }

  /**
   * Create new prayer
   */
  async createPrayer(prayer: CreatePrayerRequest): Promise<Prayer> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        throw new Error(ErrorTransformationService.transformAuthError(authError, 'createPrayer'));
      }
      if (!user) {
        throw new Error('Not authenticated - no user found');
      }

      return await this.prayerRepository.createPrayer(prayer, user.id);
    } catch (error) {
      throw new Error(ErrorTransformationService.transformError(error, 'createPrayer'));
    }
  }

  /**
   * Update prayer
   */
  async updatePrayer(prayerId: string, updates: Partial<Prayer>): Promise<Prayer> {
    try {
      return await this.prayerRepository.update(prayerId, {
        ...updates,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      throw new Error(ErrorTransformationService.transformError(error, 'updatePrayer'));
    }
  }

  /**
   * Delete prayer
   */
  async deletePrayer(prayerId: string): Promise<void> {
    try {
      await this.prayerRepository.delete(prayerId);
    } catch (error) {
      throw new Error(ErrorTransformationService.transformError(error, 'deletePrayer'));
    }
  }

  /**
   * Interact with prayer (pray, like, share, save)
   */
  async interactWithPrayer(
    prayerId: string,
    interaction: PrayerInteractionRequest
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      await this.interactionRepository.toggleInteraction(prayerId, user.id, interaction);
    } catch (error) {
      throw new Error(ErrorTransformationService.transformError(error, 'interactWithPrayer'));
    }
  }

  /**
   * Remove interaction
   */
  async removeInteraction(prayerId: string, type: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      await this.interactionRepository.removeInteraction(prayerId, user.id, type);
    } catch (error) {
      throw new Error(ErrorTransformationService.transformError(error, 'removeInteraction'));
    }
  }

  /**
   * Get user's prayer history
   */
  async getUserPrayers(userId: string, page = 1, limit = 20): Promise<Prayer[]> {
    try {
      return await this.prayerRepository.getUserPrayers(userId, page, limit);
    } catch (error) {
      throw new Error(ErrorTransformationService.transformError(error, 'getUserPrayers'));
    }
  }

  /**
   * Get saved prayers
   */
  async getSavedPrayers(page = 1, limit = 20): Promise<Prayer[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const savedInteractions = await this.interactionRepository.getSavedPrayers(user.id, page, limit);
      return savedInteractions.map(interaction => interaction.prayer).filter(Boolean) as Prayer[];
    } catch (error) {
      throw new Error(ErrorTransformationService.transformError(error, 'getSavedPrayers'));
    }
  }

  /**
   * Search prayers
   */
  async searchPrayers(query: string, filters?: {
    tags?: string[];
    location?: string;
    status?: 'open' | 'answered' | 'closed';
  }): Promise<Prayer[]> {
    try {
      return await this.prayerRepository.searchPrayers(query, filters);
    } catch (error) {
      throw new Error(ErrorTransformationService.transformError(error, 'searchPrayers'));
    }
  }
}

// Export singleton instance
export const prayerService = new PrayerService();