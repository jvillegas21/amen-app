/**
 * Offline Sync Hook - Manages offline data synchronization
 */

import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { offlineService } from '@/services/offline/offlineService';

interface OfflineDataSummary {
  prayersCount: number;
  interactionsCount: number;
  queuedActionsCount: number;
  lastSyncTimestamp: number;
}

interface UseOfflineSyncReturn {
  // Connection status
  isOnline: boolean;
  isConnected: boolean;
  
  // Sync status
  isSyncing: boolean;
  lastSyncTime: number;
  syncError: string | null;
  
  // Offline data
  offlineData: OfflineDataSummary;
  
  // Actions
  syncNow: () => Promise<void>;
  clearOfflineData: () => Promise<void>;
  cleanupOldData: () => Promise<void>;
  
  // Status
  hasOfflineData: boolean;
  needsSync: boolean;
}

export const useOfflineSync = (): UseOfflineSyncReturn => {
  const [isOnline, setIsOnline] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(0);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [offlineData, setOfflineData] = useState<OfflineDataSummary>({
    prayersCount: 0,
    interactionsCount: 0,
    queuedActionsCount: 0,
    lastSyncTimestamp: 0,
  });

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected ?? false;
      const connected = state.isInternetReachable ?? false;
      
      setIsOnline(online);
      setIsConnected(connected);
      
      // Auto-sync when coming back online
      if (online && connected && offlineData.queuedActionsCount > 0) {
        syncNow();
      }
    });

    return unsubscribe;
  }, [offlineData.queuedActionsCount]);

  // Load initial data
  useEffect(() => {
    loadOfflineData();
  }, []);

  // Auto-sync periodically when online
  useEffect(() => {
    if (!isOnline || !isConnected) return;

    const interval = setInterval(() => {
      if (offlineData.queuedActionsCount > 0) {
        syncNow();
      }
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(interval);
  }, [isOnline, isConnected, offlineData.queuedActionsCount]);

  const loadOfflineData = useCallback(async () => {
    try {
      const summary = await offlineService.getOfflineDataSummary();
      setOfflineData(summary);
      setLastSyncTime(summary.lastSyncTimestamp);
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (isSyncing || !isOnline || !isConnected) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      const result = await offlineService.syncOfflineData();
      
      if (result.success) {
        setSyncError(null);
        setLastSyncTime(Date.now());
        await loadOfflineData(); // Refresh offline data summary
      } else {
        setSyncError(result.errors.join(', '));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      setSyncError(errorMessage);
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isOnline, isConnected, loadOfflineData]);

  const clearOfflineData = useCallback(async () => {
    try {
      await offlineService.clearOfflineData();
      await loadOfflineData();
      setSyncError(null);
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }, [loadOfflineData]);

  const cleanupOldData = useCallback(async () => {
    try {
      await offlineService.cleanupOldActions();
      await loadOfflineData();
    } catch (error) {
      console.error('Failed to cleanup old data:', error);
    }
  }, [loadOfflineData]);

  const hasOfflineData = offlineData.prayersCount > 0 || 
                        offlineData.interactionsCount > 0 || 
                        offlineData.queuedActionsCount > 0;

  const needsSync = offlineData.queuedActionsCount > 0 && isOnline && isConnected;

  return {
    isOnline,
    isConnected,
    isSyncing,
    lastSyncTime,
    syncError,
    offlineData,
    syncNow,
    clearOfflineData,
    cleanupOldData,
    hasOfflineData,
    needsSync,
  };
};