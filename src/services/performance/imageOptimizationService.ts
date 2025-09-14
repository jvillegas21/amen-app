/**
 * Image Optimization Service
 * Handles image caching, compression, and progressive loading for mobile performance
 */

import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface ImageCacheEntry {
  uri: string;
  localPath: string;
  size: number;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

interface ImageOptimizationConfig {
  maxCacheSizeMB: number;
  maxImageWidth: number;
  maxImageHeight: number;
  compressionQuality: number;
  thumbnailSize: number;
  cacheExpiryHours: number;
}

class ImageOptimizationService {
  private cacheDir = `${FileSystem.cacheDirectory}images/`;
  private cacheIndex: Map<string, ImageCacheEntry> = new Map();
  private totalCacheSize = 0;
  private isInitialized = false;

  private config: ImageOptimizationConfig = {
    maxCacheSizeMB: 100, // 100MB cache limit
    maxImageWidth: 1080,
    maxImageHeight: 1920,
    compressionQuality: 0.8,
    thumbnailSize: 150,
    cacheExpiryHours: 24 * 7, // 1 week
  };

  // Image size presets for different use cases
  private readonly SIZE_PRESETS = {
    thumbnail: { width: 150, height: 150 },
    small: { width: 300, height: 300 },
    medium: { width: 600, height: 600 },
    large: { width: 1080, height: 1080 },
    original: { width: 0, height: 0 }, // No resize
  };

  /**
   * Initialize the image optimization service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create cache directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
      }

      // Load cache index from AsyncStorage
      await this.loadCacheIndex();

      // Clean up expired cache entries
      await this.cleanupExpiredCache();

      this.isInitialized = true;
      console.log('Image optimization service initialized');
    } catch (error) {
      console.error('Failed to initialize image optimization service:', error);
    }
  }

  /**
   * Get optimized image URI with caching
   */
  async getOptimizedImage(
    sourceUri: string,
    preset: keyof typeof SIZE_PRESETS = 'medium',
    options?: {
      forceRefresh?: boolean;
      progressive?: boolean;
      placeholder?: string;
    }
  ): Promise<{
    uri: string;
    isFromCache: boolean;
    size?: number;
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const cacheKey = this.getCacheKey(sourceUri, preset);

    // Check if image is in cache and not expired
    if (!options?.forceRefresh) {
      const cachedImage = await this.getCachedImage(cacheKey);
      if (cachedImage) {
        return {
          uri: cachedImage.localPath,
          isFromCache: true,
          size: cachedImage.size,
        };
      }
    }

    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      // Return placeholder or error if offline and not cached
      if (options?.placeholder) {
        return { uri: options.placeholder, isFromCache: false };
      }
      throw new Error('Image not available offline');
    }

    // Download and optimize image
    try {
      const optimizedImage = await this.downloadAndOptimizeImage(sourceUri, preset);

      // Update cache
      await this.addToCache(cacheKey, optimizedImage);

      return {
        uri: optimizedImage.localPath,
        isFromCache: false,
        size: optimizedImage.size,
      };
    } catch (error) {
      console.error('Failed to optimize image:', error);

      // Return original URI as fallback
      return { uri: sourceUri, isFromCache: false };
    }
  }

  /**
   * Preload images for better performance
   */
  async preloadImages(
    images: Array<{ uri: string; preset?: keyof typeof SIZE_PRESETS }>
  ): Promise<void> {
    const preloadPromises = images.map(({ uri, preset = 'medium' }) =>
      this.getOptimizedImage(uri, preset).catch(error => {
        console.warn(`Failed to preload image ${uri}:`, error);
      })
    );

    await Promise.all(preloadPromises);
  }

  /**
   * Compress and resize image for upload
   */
  async optimizeImageForUpload(
    imageUri: string,
    options?: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      format?: SaveFormat;
    }
  ): Promise<{
    uri: string;
    width: number;
    height: number;
    size: number;
  }> {
    const maxWidth = options?.maxWidth || this.config.maxImageWidth;
    const maxHeight = options?.maxHeight || this.config.maxImageHeight;
    const quality = options?.quality || this.config.compressionQuality;
    const format = options?.format || SaveFormat.JPEG;

    try {
      // Get original image info
      const originalInfo = await FileSystem.getInfoAsync(imageUri);

      // Optimize image
      const result = await manipulateAsync(
        imageUri,
        [{ resize: { width: maxWidth, height: maxHeight } }],
        { compress: quality, format }
      );

      // Get optimized image info
      const optimizedInfo = await FileSystem.getInfoAsync(result.uri);

      return {
        uri: result.uri,
        width: result.width || maxWidth,
        height: result.height || maxHeight,
        size: optimizedInfo.size || 0,
      };
    } catch (error) {
      console.error('Failed to optimize image for upload:', error);
      throw error;
    }
  }

  /**
   * Generate thumbnail for image
   */
  async generateThumbnail(imageUri: string): Promise<string> {
    try {
      const result = await manipulateAsync(
        imageUri,
        [{ resize: { width: this.config.thumbnailSize, height: this.config.thumbnailSize } }],
        { compress: 0.7, format: SaveFormat.JPEG }
      );

      return result.uri;
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      return imageUri; // Return original as fallback
    }
  }

  /**
   * Download and optimize image
   */
  private async downloadAndOptimizeImage(
    sourceUri: string,
    preset: keyof typeof SIZE_PRESETS
  ): Promise<ImageCacheEntry> {
    const dimensions = this.SIZE_PRESETS[preset];
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
    const localPath = `${this.cacheDir}${fileName}`;

    // Download image
    const downloadResult = await FileSystem.downloadAsync(sourceUri, localPath);

    if (downloadResult.status !== 200) {
      throw new Error(`Failed to download image: ${downloadResult.status}`);
    }

    // Optimize if not original preset
    let finalPath = localPath;
    if (preset !== 'original') {
      const optimized = await manipulateAsync(
        localPath,
        dimensions.width > 0
          ? [{ resize: { width: dimensions.width, height: dimensions.height } }]
          : [],
        { compress: this.config.compressionQuality, format: SaveFormat.JPEG }
      );

      // Replace with optimized version
      await FileSystem.moveAsync({
        from: optimized.uri,
        to: localPath,
      });
    }

    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(localPath);

    return {
      uri: sourceUri,
      localPath,
      size: fileInfo.size || 0,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
    };
  }

  /**
   * Get cached image
   */
  private async getCachedImage(cacheKey: string): Promise<ImageCacheEntry | null> {
    const entry = this.cacheIndex.get(cacheKey);

    if (!entry) return null;

    // Check if expired
    const expiryTime = this.config.cacheExpiryHours * 60 * 60 * 1000;
    if (Date.now() - entry.timestamp > expiryTime) {
      await this.removeCacheEntry(cacheKey);
      return null;
    }

    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(entry.localPath);
    if (!fileInfo.exists) {
      this.cacheIndex.delete(cacheKey);
      return null;
    }

    // Update access info
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry;
  }

  /**
   * Add image to cache
   */
  private async addToCache(cacheKey: string, entry: ImageCacheEntry): Promise<void> {
    // Check cache size limit
    if (this.totalCacheSize + entry.size > this.config.maxCacheSizeMB * 1024 * 1024) {
      await this.evictLRUCache(entry.size);
    }

    this.cacheIndex.set(cacheKey, entry);
    this.totalCacheSize += entry.size;

    // Save cache index
    await this.saveCacheIndex();
  }

  /**
   * Evict least recently used cache entries
   */
  private async evictLRUCache(requiredSpace: number): Promise<void> {
    const entries = Array.from(this.cacheIndex.entries());

    // Sort by last accessed time (oldest first)
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    let freedSpace = 0;
    for (const [key, entry] of entries) {
      if (freedSpace >= requiredSpace) break;

      await this.removeCacheEntry(key);
      freedSpace += entry.size;
    }
  }

  /**
   * Remove cache entry
   */
  private async removeCacheEntry(cacheKey: string): Promise<void> {
    const entry = this.cacheIndex.get(cacheKey);
    if (!entry) return;

    try {
      await FileSystem.deleteAsync(entry.localPath, { idempotent: true });
    } catch (error) {
      console.warn(`Failed to delete cache file: ${entry.localPath}`, error);
    }

    this.totalCacheSize -= entry.size;
    this.cacheIndex.delete(cacheKey);
  }

  /**
   * Clean up expired cache entries
   */
  private async cleanupExpiredCache(): Promise<void> {
    const expiryTime = this.config.cacheExpiryHours * 60 * 60 * 1000;
    const now = Date.now();

    const expiredKeys: string[] = [];
    for (const [key, entry] of this.cacheIndex.entries()) {
      if (now - entry.timestamp > expiryTime) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      await this.removeCacheEntry(key);
    }

    if (expiredKeys.length > 0) {
      await this.saveCacheIndex();
      console.log(`Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * Load cache index from storage
   */
  private async loadCacheIndex(): Promise<void> {
    try {
      const indexData = await AsyncStorage.getItem('image_cache_index');
      if (indexData) {
        const index = JSON.parse(indexData);
        this.cacheIndex = new Map(Object.entries(index));

        // Calculate total cache size
        this.totalCacheSize = 0;
        for (const entry of this.cacheIndex.values()) {
          this.totalCacheSize += entry.size;
        }
      }
    } catch (error) {
      console.error('Failed to load cache index:', error);
      this.cacheIndex = new Map();
    }
  }

  /**
   * Save cache index to storage
   */
  private async saveCacheIndex(): Promise<void> {
    try {
      const index = Object.fromEntries(this.cacheIndex);
      await AsyncStorage.setItem('image_cache_index', JSON.stringify(index));
    } catch (error) {
      console.error('Failed to save cache index:', error);
    }
  }

  /**
   * Generate cache key
   */
  private getCacheKey(uri: string, preset: string): string {
    return `${uri}_${preset}`;
  }

  /**
   * Clear entire cache
   */
  async clearCache(): Promise<void> {
    try {
      // Delete cache directory
      await FileSystem.deleteAsync(this.cacheDir, { idempotent: true });

      // Recreate cache directory
      await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });

      // Clear index
      this.cacheIndex.clear();
      this.totalCacheSize = 0;

      // Clear stored index
      await AsyncStorage.removeItem('image_cache_index');

      console.log('Image cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear image cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalImages: number;
    totalSizeMB: number;
    oldestEntry: Date | null;
    mostAccessedImage: string | null;
  } {
    const entries = Array.from(this.cacheIndex.values());

    const oldestEntry = entries.length > 0
      ? new Date(Math.min(...entries.map(e => e.timestamp)))
      : null;

    const mostAccessed = entries.reduce((max, entry) =>
      !max || entry.accessCount > max.accessCount ? entry : max,
      null as ImageCacheEntry | null
    );

    return {
      totalImages: this.cacheIndex.size,
      totalSizeMB: this.totalCacheSize / (1024 * 1024),
      oldestEntry,
      mostAccessedImage: mostAccessed?.uri || null,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ImageOptimizationConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export singleton instance
export const imageOptimizationService = new ImageOptimizationService();
export default imageOptimizationService;