/**
 * Optimized Prayer List Component
 * Implements virtualization, lazy loading, and performance optimizations
 */

import React, { useCallback, useMemo, memo, useState, useRef } from 'react';
import {
  FlatList,
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { Prayer } from '@/types/database.types';
import { theme } from '@/theme';

// Constants for optimization
const WINDOW_SIZE = Dimensions.get('window');
const ITEM_HEIGHT = 180; // Estimated height for prayer cards
const INITIAL_NUM_TO_RENDER = 10;
const MAX_TO_RENDER_PER_BATCH = 5;
const WINDOW_SIZE_MULTIPLIER = 10;
const UPDATE_CELLS_BATCH_SIZE = 5;
const REMOVE_CLIPPED_SUBVIEWS = Platform.OS === 'android';

interface OptimizedPrayerListProps {
  prayers: Prayer[];
  onLoadMore?: () => Promise<void>;
  onRefresh?: () => Promise<void>;
  renderPrayerCard: (prayer: Prayer) => React.ReactElement;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement;
  isLoading?: boolean;
  hasMore?: boolean;
  refreshing?: boolean;
  testID?: string;
}

/**
 * Memoized prayer item component
 */
const PrayerItem = memo(
  ({ item, renderPrayerCard }: { item: Prayer; renderPrayerCard: (prayer: Prayer) => React.ReactElement }) => {
    return <View style={styles.itemContainer}>{renderPrayerCard(item)}</View>;
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.updated_at === nextProps.item.updated_at
    );
  }
);

/**
 * Optimized Prayer List with virtualization and performance enhancements
 */
export const OptimizedPrayerList: React.FC<OptimizedPrayerListProps> = memo(({
  prayers,
  onLoadMore,
  onRefresh,
  renderPrayerCard,
  ListHeaderComponent,
  ListEmptyComponent,
  isLoading = false,
  hasMore = false,
  refreshing = false,
  testID = 'prayer-list',
}) => {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const viewabilityConfig = useRef({
    minimumViewTime: 1000,
    viewAreaCoveragePercentThreshold: 50,
    waitForInteraction: true,
  }).current;

  /**
   * Key extractor for list items
   */
  const keyExtractor = useCallback((item: Prayer) => item.id, []);

  /**
   * Get item layout for optimization
   */
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  /**
   * Handle end reached for pagination
   */
  const handleEndReached = useCallback(async () => {
    if (isLoadingMore || !hasMore || !onLoadMore) return;

    setIsLoadingMore(true);
    try {
      await onLoadMore();
    } catch (error) {
      console.error('Error loading more prayers:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, onLoadMore]);

  /**
   * Render individual prayer item
   */
  const renderItem = useCallback(
    ({ item }: { item: Prayer }) => (
      <PrayerItem item={item} renderPrayerCard={renderPrayerCard} />
    ),
    [renderPrayerCard]
  );

  /**
   * Footer component for loading indicator
   */
  const ListFooterComponent = useMemo(() => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary[600]} />
        <Text style={styles.loadingText}>Loading more prayers...</Text>
      </View>
    );
  }, [isLoadingMore]);

  /**
   * Empty component when no prayers
   */
  const EmptyComponent = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[600]} />
          <Text style={styles.emptyText}>Loading prayers...</Text>
        </View>
      );
    }

    if (ListEmptyComponent) {
      return typeof ListEmptyComponent === 'function' ? (
        <ListEmptyComponent />
      ) : (
        ListEmptyComponent
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No prayers yet</Text>
        <Text style={styles.emptyText}>
          Be the first to share a prayer request
        </Text>
      </View>
    );
  }, [isLoading, ListEmptyComponent]);

  /**
   * Handle viewable items changed for analytics
   */
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ item: Prayer; key: string; isViewable: boolean }> }) => {
      // Track viewed prayers for analytics
      const viewedPrayerIds = viewableItems
        .filter(item => item.isViewable)
        .map(item => item.item.id);

      if (viewedPrayerIds.length > 0) {
        // Log to analytics service (throttled)
        // analyticsService.trackPrayersViewed(viewedPrayerIds);
      }
    },
    []
  );

  /**
   * Optimize list performance settings
   */
  const listOptimizationProps = useMemo(
    () => ({
      removeClippedSubviews: REMOVE_CLIPPED_SUBVIEWS,
      maxToRenderPerBatch: MAX_TO_RENDER_PER_BATCH,
      updateCellsBatchingPeriod: UPDATE_CELLS_BATCH_SIZE,
      windowSize: WINDOW_SIZE_MULTIPLIER,
      initialNumToRender: INITIAL_NUM_TO_RENDER,
      legacyImplementation: false,
      maintainVisibleContentPosition: {
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 10,
      },
    }),
    []
  );

  return (
    <FlatList
      ref={flatListRef}
      testID={testID}
      data={prayers}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={EmptyComponent}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary[600]]}
            tintColor={theme.colors.primary[600]}
          />
        ) : undefined
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      contentContainerStyle={prayers.length === 0 ? styles.emptyContent : undefined}
      showsVerticalScrollIndicator={false}
      {...listOptimizationProps}
    />
  );
});

OptimizedPrayerList.displayName = 'OptimizedPrayerList';

const styles = StyleSheet.create({
  itemContainer: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[4],
    paddingHorizontal: theme.spacing[4],
  },
  loadingText: {
    marginLeft: theme.spacing[2],
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[12],
  },
  emptyContent: {
    flexGrow: 1,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing[8],
  },
});

export default OptimizedPrayerList;