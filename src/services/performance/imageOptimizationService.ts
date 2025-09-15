import React from 'react';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ImageCacheEntry {
  uri: string;
  timestamp: number;
  size: number;
  width: number;
  height: number;
}

interface OptimizedImageProps {
  source: { uri: string } | number;
  width?: number;
  height?: number;
  quality?: number;
  placeholder?: string;
  fallback?: string;
  cacheKey?: string;
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

/**
 * Image Optimization Service
 * Provides optimized image loading, caching, and compression
 * Critical for reducing bandwidth usage and improving performance
 */
class ImageOptimizationService {
  private cache = new Map<string, ImageCacheEntry>();
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly CACHE_KEY_PREFIX = 'optimized_image_';

  constructor() {
    this.loadCacheFromStorage();
    this.cleanupExpiredCache();
  }

  /**
   * Optimize and cache an image
   */
  async optimizeImage(
    uri: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'jpeg' | 'png' | 'webp';
    } = {}
  ): Promise<string> {
    const cacheKey = this.generateCacheKey(uri, options);
    
    // Check if image is already cached
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      return cached.uri;
    }

    try {
      // Optimize the image
      const optimizedImage = await this.compressImage(uri, options);
      
      // Cache the optimized image
      await this.cacheImage(cacheKey, optimizedImage, options);
      
      return optimizedImage.uri;
    } catch (error) {
      console.error('Failed to optimize image:', error);
      return uri; // Return original URI as fallback
    }
  }

  /**
   * Compress an image using expo-image-manipulator
   */
  private async compressImage(
    uri: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'jpeg' | 'png' | 'webp';
    }
  ): Promise<{ uri: string; width: number; height: number }> {
    const {
      width = 800,
      height = 600,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    const actions = [];

    // Resize if dimensions are provided
    if (width || height) {
      actions.push({
        resize: {
          width,
          height,
        },
      });
    }

    // Compress the image
    const result = await ImageManipulator.manipulateAsync(
      uri,
      actions,
      {
        compress: quality,
        format: ImageManipulator.SaveFormat[format.toUpperCase()],
      }
    );

    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
    };
  }

  /**
   * Generate a cache key for the image and options
   */
  private generateCacheKey(uri: string, options: any): string {
    const optionsString = JSON.stringify(options);
    const combined = uri + optionsString;
    // Simple hash function for cache key generation
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `${this.CACHE_KEY_PREFIX}${Math.abs(hash).toString(36)}`;
  }

  /**
   * Cache an optimized image
   */
  private async cacheImage(
    cacheKey: string,
    image: { uri: string; width: number; height: number },
    _options: any
  ): Promise<void> {
    try {
      // Get file size (approximate)
      const response = await fetch(image.uri);
      const blob = await response.blob();
      const size = blob.size;

      const cacheEntry: ImageCacheEntry = {
        uri: image.uri,
        timestamp: Date.now(),
        size,
        width: image.width,
        height: image.height,
      };

      this.cache.set(cacheKey, cacheEntry);
      await this.saveCacheToStorage();
      await this.cleanupCacheIfNeeded();
    } catch (error) {
      console.error('Failed to cache image:', error);
    }
  }

  /**
   * Check if cache entry is still valid
   */
  private isCacheValid(entry: ImageCacheEntry): boolean {
    const age = Date.now() - entry.timestamp;
    return age < this.MAX_CACHE_AGE;
  }

  /**
   * Load cache from AsyncStorage
   */
  private async loadCacheFromStorage(): Promise<void> {
    try {
      const cacheData = await AsyncStorage.getItem('image_cache');
      if (cacheData) {
        const parsedCache = JSON.parse(cacheData);
        this.cache = new Map(Object.entries(parsedCache));
      }
    } catch (error) {
      console.error('Failed to load image cache:', error);
    }
  }

  /**
   * Save cache to AsyncStorage
   */
  private async saveCacheToStorage(): Promise<void> {
    try {
      const cacheObject = Object.fromEntries(this.cache);
      await AsyncStorage.setItem('image_cache', JSON.stringify(cacheObject));
    } catch (error) {
      console.error('Failed to save image cache:', error);
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.MAX_CACHE_AGE) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clean up cache if it exceeds size limit
   */
  private async cleanupCacheIfNeeded(): Promise<void> {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }

    if (totalSize > this.MAX_CACHE_SIZE) {
      // Sort entries by timestamp (oldest first)
      const sortedEntries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);

      // Remove oldest entries until we're under the limit
      let currentSize = totalSize;
      for (const [key, entry] of sortedEntries) {
        if (currentSize <= this.MAX_CACHE_SIZE * 0.8) break; // Keep 80% of limit
        
        this.cache.delete(key);
        currentSize -= entry.size;
      }

      await this.saveCacheToStorage();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    entryCount: number;
    totalSize: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    let totalSize = 0;
    let oldestEntry = Date.now();
    let newestEntry = 0;

    for (const entry of this.cache.values()) {
      totalSize += entry.size;
      oldestEntry = Math.min(oldestEntry, entry.timestamp);
      newestEntry = Math.max(newestEntry, entry.timestamp);
    }

    return {
      entryCount: this.cache.size,
      totalSize,
      oldestEntry,
      newestEntry,
    };
  }

  /**
   * Clear all cached images
   */
  async clearCache(): Promise<void> {
    this.cache.clear();
    await AsyncStorage.removeItem('image_cache');
  }

  /**
   * Preload images for better performance
   */
  async preloadImages(uris: string[], options?: any): Promise<void> {
    const preloadPromises = uris.map(uri => 
      this.optimizeImage(uri, options).catch(error => {
        console.warn(`Failed to preload image ${uri}:`, error);
      })
    );

    await Promise.all(preloadPromises);
  }

  /**
   * Create an optimized Image component
   */
  createOptimizedImage(props: OptimizedImageProps): React.ReactElement {
    const {
      source,
      width = 200,
      height = 200,
      quality = 0.8,
      placeholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      fallback = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      cacheKey,
      style,
      resizeMode = 'cover',
    } = props;

    const [optimizedUri, setOptimizedUri] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [hasError, setHasError] = React.useState(false);

    React.useEffect(() => {
      if (typeof source === 'object' && source.uri) {
        const _key = cacheKey || this.generateCacheKey(source.uri, { width, height, quality });
        
        this.optimizeImage(source.uri, { width, height, quality })
          .then(uri => {
            setOptimizedUri(uri);
            setIsLoading(false);
          })
          .catch(error => {
            console.error('Failed to optimize image:', error);
            setHasError(true);
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    }, [source, width, height, quality, cacheKey]);

    if (isLoading) {
      return React.createElement(Image, {
        source: { uri: placeholder },
        style: style,
        contentFit: resizeMode,
      });
    }

    if (hasError) {
      return React.createElement(Image, {
        source: { uri: fallback },
        style: style,
        contentFit: resizeMode,
      });
    }

    return React.createElement(Image, {
      source: optimizedUri ? { uri: optimizedUri } : source,
      style: style,
      contentFit: resizeMode,
      transition: 200,
      cachePolicy: "memory-disk",
    });
  }
}

// Export singleton instance
export const imageOptimizationService = new ImageOptimizationService();
export default imageOptimizationService;