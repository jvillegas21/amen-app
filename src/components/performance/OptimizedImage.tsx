/**
 * Optimized Image Component using expo-image
 * Provides progressive loading, caching, and fallbacks
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { theme } from '@/theme';

interface OptimizedImageProps {
  source: { uri: string } | string;
  style?: any;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  placeholder?: string;
  fallback?: string;
  blurhash?: string;
  priority?: 'low' | 'normal' | 'high';
  cachePolicy?: 'disk' | 'memory' | 'memory-disk' | 'none';
  transition?: number;
  onLoad?: () => void;
  onError?: (error: any) => void;
  testID?: string;
  accessibilityLabel?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  contentFit = 'cover',
  placeholder,
  fallback,
  blurhash,
  priority = 'normal',
  cachePolicy = 'memory-disk',
  transition = 300,
  onLoad,
  onError,
  testID,
  accessibilityLabel,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback((error: any) => {
    setIsLoading(false);
    setHasError(true);
    onError?.(error);
    console.warn('Image failed to load:', error);
  }, [onError]);

  // Convert string source to object format
  const imageSource = typeof source === 'string' ? { uri: source } : source;

  // Default fallback for missing images
  const defaultFallback = fallback || 'https://via.placeholder.com/300x300/f0f0f0/999999?text=No+Image';

  // Blurhash placeholder for smooth loading
  const placeholderSource = blurhash
    ? { blurhash }
    : placeholder
      ? { uri: placeholder }
      : undefined;

  return (
    <View style={[styles.container, style]}>
      <Image
        source={hasError ? { uri: defaultFallback } : imageSource}
        style={[StyleSheet.absoluteFillObject, style]}
        contentFit={contentFit}
        placeholder={placeholderSource}
        priority={priority}
        cachePolicy={cachePolicy}
        transition={transition}
        onLoad={handleLoad}
        onError={handleError}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
      />

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator
            size="small"
            color={theme.colors.primary[600]}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
  },
});

export default OptimizedImage;