import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { formatDistanceToNow } from 'date-fns';

interface OfflineSyncStatusProps {
  showDetails?: boolean;
  onPress?: () => void;
}

/**
 * Offline Sync Status Component
 * Shows current sync status and allows manual sync
 */
const OfflineSyncStatus: React.FC<OfflineSyncStatusProps> = ({
  showDetails = false,
  onPress,
}) => {
  const {
    isOnline,
    isSyncing,
    pendingItemsCount,
    lastSyncTime,
    forceSync,
    clearSyncQueue,
  } = useOfflineSync();

  const [showFullStatus, setShowFullStatus] = useState(showDetails);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      setShowFullStatus(!showFullStatus);
    }
  };

  const handleForceSync = async () => {
    try {
      await forceSync();
    } catch (error) {
      Alert.alert('Sync Error', 'Failed to sync data. Please try again.');
    }
  };

  const handleClearQueue = () => {
    Alert.alert(
      'Clear Sync Queue',
      'Are you sure you want to clear all pending sync items? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: clearSyncQueue,
        },
      ]
    );
  };

  const getStatusColor = (): string => {
    if (!isOnline) return '#EF4444';
    if (isSyncing) return '#F59E0B';
    if (pendingItemsCount > 0) return '#3B82F6';
    return '#10B981';
  };

  const getStatusIcon = (): string => {
    if (!isOnline) return 'cloud-offline';
    if (isSyncing) return 'sync';
    if (pendingItemsCount > 0) return 'cloud-upload';
    return 'cloud-done';
  };

  const getStatusText = (): string => {
    if (!isOnline) return 'Offline';
    if (isSyncing) return 'Syncing...';
    if (pendingItemsCount > 0) return `${pendingItemsCount} pending`;
    return 'Synced';
  };

  const renderCompactStatus = () => (
    <TouchableOpacity
      style={[styles.compactContainer, { borderColor: getStatusColor() }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.statusIndicator}>
        {isSyncing ? (
          <ActivityIndicator size="small" color={getStatusColor()} />
        ) : (
          <Ionicons name={getStatusIcon() as any} size={16} color={getStatusColor()} />
        )}
      </View>
      <Text style={[styles.statusText, { color: getStatusColor() }]}>
        {getStatusText()}
      </Text>
    </TouchableOpacity>
  );

  const renderFullStatus = () => (
    <View style={styles.fullContainer}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="cloud" size={20} color="#5B21B6" />
          <Text style={styles.headerTitle}>Sync Status</Text>
        </View>
        <TouchableOpacity onPress={() => setShowFullStatus(false)}>
          <Ionicons name="close" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.statusRow}>
        <View style={styles.statusItem}>
          <Ionicons
            name={isOnline ? 'wifi' : 'wifi-off'}
            size={16}
            color={isOnline ? '#10B981' : '#EF4444'}
          />
          <Text style={styles.statusItemText}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>

        <View style={styles.statusItem}>
          <Ionicons
            name={isSyncing ? 'sync' : 'checkmark-circle'}
            size={16}
            color={isSyncing ? '#F59E0B' : '#10B981'}
          />
          <Text style={styles.statusItemText}>
            {isSyncing ? 'Syncing...' : 'Ready'}
          </Text>
        </View>
      </View>

      {pendingItemsCount > 0 && (
        <View style={styles.pendingSection}>
          <Text style={styles.pendingTitle}>
            {pendingItemsCount} item{pendingItemsCount !== 1 ? 's' : ''} pending sync
          </Text>
          <Text style={styles.pendingSubtitle}>
            Will sync automatically when connection is restored
          </Text>
        </View>
      )}

      {lastSyncTime && (
        <View style={styles.lastSyncSection}>
          <Text style={styles.lastSyncText}>
            Last sync: {formatDistanceToNow(new Date(lastSyncTime), { addSuffix: true })}
          </Text>
        </View>
      )}

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.syncButton]}
          onPress={handleForceSync}
          disabled={isSyncing || !isOnline}
        >
          <Ionicons name="refresh" size={16} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Sync Now</Text>
        </TouchableOpacity>

        {pendingItemsCount > 0 && (
          <TouchableOpacity
            style={[styles.actionButton, styles.clearButton]}
            onPress={handleClearQueue}
          >
            <Ionicons name="trash" size={16} color="#EF4444" />
            <Text style={[styles.actionButtonText, styles.clearButtonText]}>
              Clear Queue
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (showFullStatus) {
    return renderFullStatus();
  }

  return renderCompactStatus();
};

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  statusIndicator: {
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  fullContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusItemText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 6,
  },
  pendingSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  pendingSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  lastSyncSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  lastSyncText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  syncButton: {
    backgroundColor: '#5B21B6',
  },
  clearButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  clearButtonText: {
    color: '#EF4444',
  },
});

export default OfflineSyncStatus;
