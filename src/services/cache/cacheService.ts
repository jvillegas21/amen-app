import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Prayer, Profile, Group } from '@/types/database.types';

/**
 * Cache Service - Implements offline-first architecture
 * Follows Single Responsibility Principle: Only handles caching operations
 */
class CacheService {
  private readonly CACHE_PREFIX = '@Amenityapp_cache_';
  private readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
  private isOnline = true;
  private syncQueue: Array<() => Promise<void>> = [];

  constructor() {
    this.initNetworkListener();
  }

  /**
   * Initialize network state listener
   */
  private initNetworkListener(): void {
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // Process sync queue when coming back online
      if (wasOffline && this.isOnline) {
        this.processSyncQueue();
      }
    });
  }

  /**
   * Get cache key
   */
  private getCacheKey(type: string, id?: string): string {
    return `${this.CACHE_PREFIX}${type}${id ? `_${id}` : ''}`;
  }

  /**
   * Set cache item with expiry
   */
  async set<T>(key: string, data: T, expiryMs?: number): Promise<void> {
    try {
      const item = {
        data,
        timestamp: Date.now(),
        expiry: expiryMs || this.CACHE_EXPIRY,
      };
      await AsyncStorage.setItem(
        this.getCacheKey(key),
        JSON.stringify(item)
      );
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Get cache item if not expired
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const item = await AsyncStorage.getItem(this.getCacheKey(key));
      if (!item) return null;

      const cached = JSON.parse(item);
      const now = Date.now();

      // Check if expired
      if (now - cached.timestamp > cached.expiry) {
        await this.remove(key);
        return null;
      }

      return cached.data as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Remove cache item
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.getCacheKey(key));
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith(this.CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Cache prayers
   */
  async cachePrayers(prayers: Prayer[], feedType: string): Promise<void> {
    await this.set(`prayers_${feedType}`, prayers);
  }

  /**
   * Get cached prayers
   */
  async getCachedPrayers(feedType: string): Promise<Prayer[] | null> {
    return await this.get<Prayer[]>(`prayers_${feedType}`);
  }

  /**
   * Cache single prayer
   */
  async cachePrayer(prayer: Prayer): Promise<void> {
    await this.set(`prayer_${prayer.id}`, prayer);
  }

  /**
   * Get cached prayer
   */
  async getCachedPrayer(prayerId: string): Promise<Prayer | null> {
    return await this.get<Prayer>(`prayer_${prayerId}`);
  }

  /**
   * Cache user profile
   */
  async cacheProfile(profile: Profile): Promise<void> {
    await this.set(`profile_${profile.id}`, profile);
  }

  /**
   * Get cached profile
   */
  async getCachedProfile(userId: string): Promise<Profile | null> {
    return await this.get<Profile>(`profile_${userId}`);
  }

  /**
   * Cache groups
   */
  async cacheGroups(groups: Group[]): Promise<void> {
    await this.set('groups', groups);
  }

  /**
   * Get cached groups
   */
  async getCachedGroups(): Promise<Group[] | null> {
    return await this.get<Group[]>('groups');
  }

  /**
   * Add operation to sync queue
   */
  addToSyncQueue(operation: () => Promise<void>): void {
    this.syncQueue.push(operation);
    
    // Try to process immediately if online
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  /**
   * Process sync queue
   */
  private async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    const queue = [...this.syncQueue];
    this.syncQueue = [];

    for (const operation of queue) {
      try {
        await operation();
      } catch (error) {
        console.error('Sync operation failed:', error);
        // Re-add to queue if failed
        this.syncQueue.push(operation);
      }
    }
  }

  /**
   * Get network status
   */
  getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Cache with network fallback
   */
  async getWithFallback<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    cacheExpiry?: number
  ): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(cacheKey);
    if (cached) return cached;

    // If online, fetch and cache
    if (this.isOnline) {
      try {
        const data = await fetchFn();
        await this.set(cacheKey, data, cacheExpiry);
        return data;
      } catch (error) {
        console.error('Fetch failed, returning null:', error);
        throw error;
      }
    }

    // Offline and no cache
    throw new Error('No cached data available offline');
  }

  /**
   * Optimistic update with sync
   */
  async optimisticUpdate<T>(
    cacheKey: string,
    optimisticData: T,
    syncFn: () => Promise<T>
  ): Promise<T> {
    // Update cache immediately
    await this.set(cacheKey, optimisticData);

    if (this.isOnline) {
      try {
        // Sync with server
        const serverData = await syncFn();
        await this.set(cacheKey, serverData);
        return serverData;
      } catch (error) {
        console.error('Sync failed, keeping optimistic data:', error);
        return optimisticData;
      }
    } else {
      // Queue for later sync
      this.addToSyncQueue(async () => {
        const serverData = await syncFn();
        await this.set(cacheKey, serverData);
      });
      return optimisticData;
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();