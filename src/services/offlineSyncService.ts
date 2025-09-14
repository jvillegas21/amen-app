/**
 * Offline Sync Service - Handles offline-first architecture with sync queue and conflict resolution
 * Provides robust data synchronization for the Amenity app
 */

import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SyncItem {
  id: string;
  type: 'prayer' | 'comment' | 'interaction' | 'message' | 'profile';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface ConflictResolution {
  strategy: 'server_wins' | 'client_wins' | 'merge' | 'manual';
  resolvedData?: any;
}

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingItems: number;
  lastSyncTime: number | null;
  syncErrors: string[];
}

class OfflineSyncService {
  private syncQueue: SyncItem[] = [];
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Array<(status: SyncStatus) => void> = [];

  // Storage keys
  private readonly SYNC_QUEUE_KEY = 'sync_queue';
  private readonly LAST_SYNC_KEY = 'last_sync_time';
  private readonly OFFLINE_DATA_KEY = 'offline_data';

  constructor() {
    this.initializeNetworkListener();
    this.loadSyncQueue();
    this.startPeriodicSync();
  }

  /**
   * Initialize network connectivity listener
   */
  private initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (wasOffline && this.isOnline) {
        // Came back online, trigger sync
        this.syncPendingItems();
      }

      this.notifyListeners();
    });
  }

  /**
   * Add item to sync queue
   */
  async addToSyncQueue(
    type: SyncItem['type'],
    action: SyncItem['action'],
    data: any,
    maxRetries: number = 3
  ): Promise<string> {
    const syncItem: SyncItem = {
      id: this.generateId(),
      type,
      action,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries,
    };

    this.syncQueue.push(syncItem);
    await this.saveSyncQueue();

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncPendingItems();
    }

    this.notifyListeners();
    return syncItem.id;
  }

  /**
   * Sync pending items in the queue
   */
  async syncPendingItems(): Promise<void> {
    if (this.isSyncing || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    this.notifyListeners();

    try {
      const itemsToSync = [...this.syncQueue];
      const successfulItems: string[] = [];
      const failedItems: SyncItem[] = [];

      for (const item of itemsToSync) {
        try {
          const success = await this.syncItem(item);
          if (success) {
            successfulItems.push(item.id);
          } else {
            failedItems.push(item);
          }
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
          failedItems.push(item);
        }
      }

      // Remove successful items and update failed items
      this.syncQueue = failedItems.map(item => ({
        ...item,
        retryCount: item.retryCount + 1,
      })).filter(item => item.retryCount < item.maxRetries);

      await this.saveSyncQueue();
      await this.updateLastSyncTime();

      if (successfulItems.length > 0) {
        console.log(`Successfully synced ${successfulItems.length} items`);
      }

    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Sync individual item
   */
  private async syncItem(item: SyncItem): Promise<boolean> {
    try {
      switch (item.type) {
        case 'prayer':
          return await this.syncPrayer(item);
        case 'comment':
          return await this.syncComment(item);
        case 'interaction':
          return await this.syncInteraction(item);
        case 'message':
          return await this.syncMessage(item);
        case 'profile':
          return await this.syncProfile(item);
        default:
          console.warn(`Unknown sync item type: ${item.type}`);
          return false;
      }
    } catch (error) {
      console.error(`Error syncing ${item.type} item:`, error);
      return false;
    }
  }

  /**
   * Sync prayer item
   */
  private async syncPrayer(item: SyncItem): Promise<boolean> {
    try {
      const { supabase } = await import('@/config/supabase');

      switch (item.action) {
        case 'create':
          const { error: createError } = await supabase
            .from('prayers')
            .insert(item.data);
          if (createError) throw createError;
          break;

        case 'update':
          const { error: updateError } = await supabase
            .from('prayers')
            .update(item.data)
            .eq('id', item.data.id);
          if (updateError) throw updateError;
          break;

        case 'delete':
          const { error: deleteError } = await supabase
            .from('prayers')
            .delete()
            .eq('id', item.data.id);
          if (deleteError) throw deleteError;
          break;
      }

      return true;
    } catch (error) {
      console.error('Failed to sync prayer:', error);
      return false;
    }
  }

  /**
   * Sync comment item
   */
  private async syncComment(item: SyncItem): Promise<boolean> {
    try {
      const { supabase } = await import('@/config/supabase');

      switch (item.action) {
        case 'create':
          const { error: createError } = await supabase
            .from('comments')
            .insert(item.data);
          if (createError) throw createError;
          break;

        case 'update':
          const { error: updateError } = await supabase
            .from('comments')
            .update(item.data)
            .eq('id', item.data.id);
          if (updateError) throw updateError;
          break;

        case 'delete':
          const { error: deleteError } = await supabase
            .from('comments')
            .delete()
            .eq('id', item.data.id);
          if (deleteError) throw deleteError;
          break;
      }

      return true;
    } catch (error) {
      console.error('Failed to sync comment:', error);
      return false;
    }
  }

  /**
   * Sync interaction item
   */
  private async syncInteraction(item: SyncItem): Promise<boolean> {
    try {
      const { supabase } = await import('@/config/supabase');

      switch (item.action) {
        case 'create':
          const { error: createError } = await supabase
            .from('interactions')
            .insert(item.data);
          if (createError) throw createError;
          break;

        case 'update':
          const { error: updateError } = await supabase
            .from('interactions')
            .update(item.data)
            .eq('id', item.data.id);
          if (updateError) throw updateError;
          break;

        case 'delete':
          const { error: deleteError } = await supabase
            .from('interactions')
            .delete()
            .eq('id', item.data.id);
          if (deleteError) throw deleteError;
          break;
      }

      return true;
    } catch (error) {
      console.error('Failed to sync interaction:', error);
      return false;
    }
  }

  /**
   * Sync message item
   */
  private async syncMessage(item: SyncItem): Promise<boolean> {
    try {
      const { supabase } = await import('@/config/supabase');

      switch (item.action) {
        case 'create':
          const { error: createError } = await supabase
            .from('messages')
            .insert(item.data);
          if (createError) throw createError;
          break;

        case 'update':
          const { error: updateError } = await supabase
            .from('messages')
            .update(item.data)
            .eq('id', item.data.id);
          if (updateError) throw updateError;
          break;

        case 'delete':
          const { error: deleteError } = await supabase
            .from('messages')
            .delete()
            .eq('id', item.data.id);
          if (deleteError) throw deleteError;
          break;
      }

      return true;
    } catch (error) {
      console.error('Failed to sync message:', error);
      return false;
    }
  }

  /**
   * Sync profile item
   */
  private async syncProfile(item: SyncItem): Promise<boolean> {
    try {
      const { supabase } = await import('@/config/supabase');

      switch (item.action) {
        case 'create':
          const { error: createError } = await supabase
            .from('profiles')
            .insert(item.data);
          if (createError) throw createError;
          break;

        case 'update':
          const { error: updateError } = await supabase
            .from('profiles')
            .update(item.data)
            .eq('id', item.data.id);
          if (updateError) throw updateError;
          break;

        case 'delete':
          const { error: deleteError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', item.data.id);
          if (deleteError) throw deleteError;
          break;
      }

      return true;
    } catch (error) {
      console.error('Failed to sync profile:', error);
      return false;
    }
  }

  /**
   * Simulate API call for development
   */
  private async simulateApiCall(): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    // Simulate occasional failures
    if (Math.random() < 0.1) {
      throw new Error('Simulated API failure');
    }
  }

  /**
   * Handle conflict resolution
   */
  async resolveConflict(
    localData: any,
    serverData: any,
    strategy: ConflictResolution['strategy'] = 'server_wins'
  ): Promise<any> {
    switch (strategy) {
      case 'server_wins':
        console.log('Conflict resolved: server wins', { localData, serverData });
        return serverData;

      case 'client_wins':
        console.log('Conflict resolved: client wins', { localData, serverData });
        return localData;

      case 'merge':
        const merged = this.mergeData(localData, serverData);
        console.log('Conflict resolved: merged', { localData, serverData, merged });
        return merged;

      case 'manual':
        console.log('Conflict requires manual resolution', { localData, serverData });
        // For now, default to server wins until manual resolution UI is implemented
        return serverData;

      default:
        console.log('Unknown conflict resolution strategy, defaulting to server wins');
        return serverData;
    }
  }

  /**
   * Merge local and server data intelligently
   */
  private mergeData(localData: any, serverData: any): any {
    // Intelligent merge strategy based on timestamps and data types
    const localTimestamp = new Date(localData.updated_at || localData.created_at).getTime();
    const serverTimestamp = new Date(serverData.updated_at || serverData.created_at).getTime();

    const merged = {
      ...serverData,
      updated_at: new Date().toISOString(),
      // Preserve conflict resolution metadata
      sync_resolved_at: new Date().toISOString(),
      sync_strategy: 'merge',
    };

    // Field-specific merge logic
    Object.keys(localData).forEach(key => {
      switch (key) {
        case 'text':
        case 'content':
          // Use local version if it's newer or longer (more complete)
          if (localTimestamp > serverTimestamp ||
              (localData[key]?.length || 0) > (serverData[key]?.length || 0)) {
            merged[key] = localData[key];
          }
          break;

        case 'tags':
        case 'images':
          // Merge arrays, removing duplicates
          const localArray = Array.isArray(localData[key]) ? localData[key] : [];
          const serverArray = Array.isArray(serverData[key]) ? serverData[key] : [];
          merged[key] = [...new Set([...serverArray, ...localArray])];
          break;

        case 'status':
          // Use most restrictive status
          const statusPriority = { open: 1, answered: 2, closed: 3 };
          const localPriority = statusPriority[localData[key]] || 0;
          const serverPriority = statusPriority[serverData[key]] || 0;
          merged[key] = localPriority > serverPriority ? localData[key] : serverData[key];
          break;

        case 'privacy_level':
          // Use more restrictive privacy level
          const privacyPriority = { public: 1, friends: 2, private: 3 };
          const localPrivacy = privacyPriority[localData[key]] || 0;
          const serverPrivacy = privacyPriority[serverData[key]] || 0;
          merged[key] = localPrivacy > serverPrivacy ? localData[key] : serverData[key];
          break;

        default:
          // For other fields, use local if newer, otherwise keep server
          if (localTimestamp > serverTimestamp && localData[key] !== undefined) {
            merged[key] = localData[key];
          }
      }
    });

    return merged;
  }

  /**
   * Store data offline
   */
  async storeOfflineData(key: string, data: any): Promise<void> {
    try {
      const offlineData = await this.getOfflineData();
      offlineData[key] = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(this.OFFLINE_DATA_KEY, JSON.stringify(offlineData));
    } catch (error) {
      console.error('Error storing offline data:', error);
    }
  }

  /**
   * Retrieve offline data
   */
  async getOfflineData(key?: string): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(this.OFFLINE_DATA_KEY);
      const offlineData = data ? JSON.parse(data) : {};
      
      if (key) {
        return offlineData[key]?.data;
      }
      
      return offlineData;
    } catch (error) {
      console.error('Error retrieving offline data:', error);
      return key ? null : {};
    }
  }

  /**
   * Clear offline data
   */
  async clearOfflineData(key?: string): Promise<void> {
    try {
      if (key) {
        const offlineData = await this.getOfflineData();
        delete offlineData[key];
        await AsyncStorage.setItem(this.OFFLINE_DATA_KEY, JSON.stringify(offlineData));
      } else {
        await AsyncStorage.removeItem(this.OFFLINE_DATA_KEY);
      }
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  }

  /**
   * Load sync queue from storage
   */
  private async loadSyncQueue(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.SYNC_QUEUE_KEY);
      if (data) {
        this.syncQueue = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
      this.syncQueue = [];
    }
  }

  /**
   * Save sync queue to storage
   */
  private async saveSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }

  /**
   * Update last sync time
   */
  private async updateLastSyncTime(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.LAST_SYNC_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error updating last sync time:', error);
    }
  }

  /**
   * Get last sync time
   */
  async getLastSyncTime(): Promise<number | null> {
    try {
      const data = await AsyncStorage.getItem(this.LAST_SYNC_KEY);
      return data ? parseInt(data, 10) : null;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  }

  /**
   * Start periodic sync
   */
  private startPeriodicSync(): void {
    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.syncPendingItems();
      }
    }, 30000);
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Add sync status listener
   */
  addSyncStatusListener(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify listeners of sync status changes
   */
  private notifyListeners(): void {
    const status: SyncStatus = {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingItems: this.syncQueue.length,
      lastSyncTime: null, // Will be loaded asynchronously
      syncErrors: [],
    };

    this.listeners.forEach(listener => listener(status));
  }

  /**
   * Get current sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const lastSyncTime = await this.getLastSyncTime();
    
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingItems: this.syncQueue.length,
      lastSyncTime,
      syncErrors: [],
    };
  }

  /**
   * Force sync all pending items
   */
  async forceSync(): Promise<void> {
    await this.syncPendingItems();
  }

  /**
   * Clear sync queue
   */
  async clearSyncQueue(): Promise<void> {
    this.syncQueue = [];
    await this.saveSyncQueue();
    this.notifyListeners();
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if device is online
   */
  isDeviceOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Get pending sync items count
   */
  getPendingItemsCount(): number {
    return this.syncQueue.length;
  }

  /**
   * Check if sync is in progress
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }
}

// Export singleton instance
export const offlineSyncService = new OfflineSyncService();
export default offlineSyncService;
