import { useState, useEffect, useCallback } from 'react';
import offlineSyncService, { SyncStatus } from '@/services/offlineSyncService';

interface UseOfflineSyncReturn {
  // Sync status
  syncStatus: SyncStatus;
  isOnline: boolean;
  isSyncing: boolean;
  pendingItemsCount: number;
  lastSyncTime: number | null;

  // Sync actions
  addToSyncQueue: (
    type: 'prayer' | 'comment' | 'interaction' | 'message' | 'profile',
    action: 'create' | 'update' | 'delete',
    data: any,
    maxRetries?: number
  ) => Promise<string>;
  forceSync: () => Promise<void>;
  clearSyncQueue: () => Promise<void>;

  // Offline data management
  storeOfflineData: (key: string, data: any) => Promise<void>;
  getOfflineData: (key?: string) => Promise<any>;
  clearOfflineData: (key?: string) => Promise<void>;

  // Utility functions
  isDeviceOnline: () => boolean;
  getPendingItemsCount: () => number;
  isSyncInProgress: () => boolean;
}

/**
 * Custom hook for offline sync functionality
 * Provides easy-to-use functions for offline-first data management
 */
export const useOfflineSync = (): UseOfflineSyncReturn => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    pendingItems: 0,
    lastSyncTime: null,
    syncErrors: [],
  });

  useEffect(() => {
    // Load initial sync status
    const loadInitialStatus = async () => {
      const status = await offlineSyncService.getSyncStatus();
      setSyncStatus(status);
    };

    loadInitialStatus();

    // Subscribe to sync status changes
    const unsubscribe = offlineSyncService.addSyncStatusListener((status) => {
      setSyncStatus(status);
    });

    return unsubscribe;
  }, []);

  // Add item to sync queue
  const addToSyncQueue = useCallback(async (
    type: 'prayer' | 'comment' | 'interaction' | 'message' | 'profile',
    action: 'create' | 'update' | 'delete',
    data: any,
    maxRetries: number = 3
  ): Promise<string> => {
    return await offlineSyncService.addToSyncQueue(type, action, data, maxRetries);
  }, []);

  // Force sync all pending items
  const forceSync = useCallback(async (): Promise<void> => {
    await offlineSyncService.forceSync();
  }, []);

  // Clear sync queue
  const clearSyncQueue = useCallback(async (): Promise<void> => {
    await offlineSyncService.clearSyncQueue();
  }, []);

  // Store data offline
  const storeOfflineData = useCallback(async (key: string, data: any): Promise<void> => {
    await offlineSyncService.storeOfflineData(key, data);
  }, []);

  // Get offline data
  const getOfflineData = useCallback(async (key?: string): Promise<any> => {
    return await offlineSyncService.getOfflineData(key);
  }, []);

  // Clear offline data
  const clearOfflineData = useCallback(async (key?: string): Promise<void> => {
    await offlineSyncService.clearOfflineData(key);
  }, []);

  // Check if device is online
  const isDeviceOnline = useCallback((): boolean => {
    return offlineSyncService.isDeviceOnline();
  }, []);

  // Get pending items count
  const getPendingItemsCount = useCallback((): number => {
    return offlineSyncService.getPendingItemsCount();
  }, []);

  // Check if sync is in progress
  const isSyncInProgress = useCallback((): boolean => {
    return offlineSyncService.isSyncInProgress();
  }, []);

  return {
    // Sync status
    syncStatus,
    isOnline: syncStatus.isOnline,
    isSyncing: syncStatus.isSyncing,
    pendingItemsCount: syncStatus.pendingItems,
    lastSyncTime: syncStatus.lastSyncTime,

    // Sync actions
    addToSyncQueue,
    forceSync,
    clearSyncQueue,

    // Offline data management
    storeOfflineData,
    getOfflineData,
    clearOfflineData,

    // Utility functions
    isDeviceOnline,
    getPendingItemsCount,
    isSyncInProgress,
  };
};

export default useOfflineSync;
