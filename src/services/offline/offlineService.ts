/**
 * Offline Service - Manages offline data storage and synchronization
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Prayer, Interaction } from '@/types/database.types';

interface OfflineAction {
  id: string;
  type: 'CREATE_PRAYER' | 'INTERACT_PRAYER' | 'UPDATE_PRAYER' | 'DELETE_PRAYER';
  data: any;
  timestamp: number;
  retryCount: number;
}

interface OfflineData {
  prayers: Prayer[];
  interactions: Interaction[];
  lastSyncTimestamp: number;
}

class OfflineService {
  private readonly PRAYERS_KEY = 'offline_prayers';
  private readonly INTERACTIONS_KEY = 'offline_interactions';
  private readonly ACTIONS_KEY = 'offline_actions';
  private readonly LAST_SYNC_KEY = 'last_sync_timestamp';
  private readonly MAX_RETRY_COUNT = 3;

  /**
   * Check if device is online
   */
  async isOnline(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected ?? false;
  }

  /**
   * Store prayer data offline
   */
  async storePrayerOffline(prayer: Prayer): Promise<void> {
    try {
      const existingPrayers = await this.getOfflinePrayers();
      const updatedPrayers = [prayer, ...existingPrayers];
      await AsyncStorage.setItem(this.PRAYERS_KEY, JSON.stringify(updatedPrayers));
    } catch (error) {
      console.error('Failed to store prayer offline:', error);
    }
  }

  /**
   * Get offline prayers
   */
  async getOfflinePrayers(): Promise<Prayer[]> {
    try {
      const prayersJson = await AsyncStorage.getItem(this.PRAYERS_KEY);
      return prayersJson ? JSON.parse(prayersJson) : [];
    } catch (error) {
      console.error('Failed to get offline prayers:', error);
      return [];
    }
  }

  /**
   * Store interaction offline
   */
  async storeInteractionOffline(interaction: Interaction): Promise<void> {
    try {
      const existingInteractions = await this.getOfflineInteractions();
      const updatedInteractions = [interaction, ...existingInteractions];
      await AsyncStorage.setItem(this.INTERACTIONS_KEY, JSON.stringify(updatedInteractions));
    } catch (error) {
      console.error('Failed to store interaction offline:', error);
    }
  }

  /**
   * Get offline interactions
   */
  async getOfflineInteractions(): Promise<Interaction[]> {
    try {
      const interactionsJson = await AsyncStorage.getItem(this.INTERACTIONS_KEY);
      return interactionsJson ? JSON.parse(interactionsJson) : [];
    } catch (error) {
      console.error('Failed to get offline interactions:', error);
      return [];
    }
  }

  /**
   * Queue action for later sync
   */
  async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    try {
      const actions = await this.getQueuedActions();
      const newAction: OfflineAction = {
        ...action,
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0,
      };
      
      actions.push(newAction);
      await AsyncStorage.setItem(this.ACTIONS_KEY, JSON.stringify(actions));
    } catch (error) {
      console.error('Failed to queue action:', error);
    }
  }

  /**
   * Get queued actions
   */
  async getQueuedActions(): Promise<OfflineAction[]> {
    try {
      const actionsJson = await AsyncStorage.getItem(this.ACTIONS_KEY);
      return actionsJson ? JSON.parse(actionsJson) : [];
    } catch (error) {
      console.error('Failed to get queued actions:', error);
      return [];
    }
  }

  /**
   * Remove action from queue
   */
  async removeAction(actionId: string): Promise<void> {
    try {
      const actions = await this.getQueuedActions();
      const updatedActions = actions.filter(action => action.id !== actionId);
      await AsyncStorage.setItem(this.ACTIONS_KEY, JSON.stringify(updatedActions));
    } catch (error) {
      console.error('Failed to remove action:', error);
    }
  }

  /**
   * Update action retry count
   */
  async updateActionRetryCount(actionId: string): Promise<void> {
    try {
      const actions = await this.getQueuedActions();
      const updatedActions = actions.map(action => {
        if (action.id === actionId) {
          return { ...action, retryCount: action.retryCount + 1 };
        }
        return action;
      });
      await AsyncStorage.setItem(this.ACTIONS_KEY, JSON.stringify(updatedActions));
    } catch (error) {
      console.error('Failed to update action retry count:', error);
    }
  }

  /**
   * Sync offline data when online
   */
  async syncOfflineData(): Promise<{ success: boolean; syncedActions: number; errors: string[] }> {
    const isOnline = await this.isOnline();
    if (!isOnline) {
      return { success: false, syncedActions: 0, errors: ['Device is offline'] };
    }

    const actions = await this.getQueuedActions();
    const errors: string[] = [];
    let syncedActions = 0;

    for (const action of actions) {
      try {
        const success = await this.executeAction(action);
        if (success) {
          await this.removeAction(action.id);
          syncedActions++;
        } else {
          await this.updateActionRetryCount(action.id);
          errors.push(`Failed to sync action: ${action.type}`);
        }
      } catch (error) {
        await this.updateActionRetryCount(action.id);
        errors.push(`Error syncing action: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Update last sync timestamp
    await AsyncStorage.setItem(this.LAST_SYNC_KEY, Date.now().toString());

    return {
      success: errors.length === 0,
      syncedActions,
      errors,
    };
  }

  /**
   * Execute a queued action
   */
  private async executeAction(action: OfflineAction): Promise<boolean> {
    try {
      const { supabase } = await import('@/config/supabase');
      
      switch (action.type) {
        case 'CREATE_PRAYER':
          const { error: createError } = await supabase
            .from('prayers')
            .insert(action.data);
          return !createError;

        case 'INTERACT_PRAYER':
          const { error: interactError } = await supabase
            .from('interactions')
            .insert(action.data);
          return !interactError;

        case 'UPDATE_PRAYER':
          const { error: updateError } = await supabase
            .from('prayers')
            .update(action.data.updates)
            .eq('id', action.data.prayerId);
          return !updateError;

        case 'DELETE_PRAYER':
          const { error: deleteError } = await supabase
            .from('prayers')
            .delete()
            .eq('id', action.data.prayerId);
          return !deleteError;

        default:
          return false;
      }
    } catch (error) {
      console.error('Error executing action:', error);
      return false;
    }
  }

  /**
   * Get last sync timestamp
   */
  async getLastSyncTimestamp(): Promise<number> {
    try {
      const timestamp = await AsyncStorage.getItem(this.LAST_SYNC_KEY);
      return timestamp ? parseInt(timestamp, 10) : 0;
    } catch (error) {
      console.error('Failed to get last sync timestamp:', error);
      return 0;
    }
  }

  /**
   * Clear all offline data
   */
  async clearOfflineData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.PRAYERS_KEY),
        AsyncStorage.removeItem(this.INTERACTIONS_KEY),
        AsyncStorage.removeItem(this.ACTIONS_KEY),
        AsyncStorage.removeItem(this.LAST_SYNC_KEY),
      ]);
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }

  /**
   * Get offline data summary
   */
  async getOfflineDataSummary(): Promise<{
    prayersCount: number;
    interactionsCount: number;
    queuedActionsCount: number;
    lastSyncTimestamp: number;
  }> {
    try {
      const [prayers, interactions, actions, lastSync] = await Promise.all([
        this.getOfflinePrayers(),
        this.getOfflineInteractions(),
        this.getQueuedActions(),
        this.getLastSyncTimestamp(),
      ]);

      return {
        prayersCount: prayers.length,
        interactionsCount: interactions.length,
        queuedActionsCount: actions.length,
        lastSyncTimestamp: lastSync,
      };
    } catch (error) {
      console.error('Failed to get offline data summary:', error);
      return {
        prayersCount: 0,
        interactionsCount: 0,
        queuedActionsCount: 0,
        lastSyncTimestamp: 0,
      };
    }
  }

  /**
   * Check if action should be retried
   */
  private shouldRetryAction(action: OfflineAction): boolean {
    return action.retryCount < this.MAX_RETRY_COUNT;
  }

  /**
   * Get actions that can be retried
   */
  async getRetryableActions(): Promise<OfflineAction[]> {
    const actions = await this.getQueuedActions();
    return actions.filter(action => this.shouldRetryAction(action));
  }

  /**
   * Clean up old failed actions
   */
  async cleanupOldActions(): Promise<void> {
    try {
      const actions = await this.getQueuedActions();
      const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
      
      const validActions = actions.filter(action => 
        action.timestamp > cutoffTime && this.shouldRetryAction(action)
      );
      
      await AsyncStorage.setItem(this.ACTIONS_KEY, JSON.stringify(validActions));
    } catch (error) {
      console.error('Failed to cleanup old actions:', error);
    }
  }
}

// Export singleton instance
export const offlineService = new OfflineService();
export default offlineService;