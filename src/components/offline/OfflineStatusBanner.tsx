/**
 * Offline Status Banner - Shows offline status and sync information
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { theme } from '@/theme';

interface OfflineStatusBannerProps {
  onSyncPress?: () => void;
  onClearPress?: () => void;
}

const OfflineStatusBanner: React.FC<OfflineStatusBannerProps> = ({
  onSyncPress,
  onClearPress,
}) => {
  const {
    isOnline,
    isConnected,
    isSyncing,
    offlineData,
    syncError,
    syncNow,
    clearOfflineData,
    hasOfflineData,
    needsSync,
  } = useOfflineSync();

  // Don't show banner if online and no offline data
  if (isOnline && isConnected && !hasOfflineData) {
    return null;
  }

  const handleSyncPress = () => {
    if (onSyncPress) {
      onSyncPress();
    } else {
      syncNow();
    }
  };

  const handleClearPress = () => {
    if (onClearPress) {
      onClearPress();
    } else {
      clearOfflineData();
    }
  };

  const getStatusColor = () => {
    if (syncError) return theme.colors.error[500];
    if (isSyncing) return theme.colors.primary[600];
    if (!isOnline || !isConnected) return theme.colors.warning[500];
    if (needsSync) return theme.colors.warning[500];
    return theme.colors.success[500];
  };

  const getStatusText = () => {
    if (syncError) return 'Sync failed';
    if (isSyncing) return 'Syncing...';
    if (!isOnline || !isConnected) return 'You\'re offline';
    if (needsSync) return 'Sync pending';
    return 'All synced';
  };

  const getStatusIcon = () => {
    if (syncError) return 'alert-circle';
    if (isSyncing) return 'sync';
    if (!isOnline || !isConnected) return 'cloud-offline';
    if (needsSync) return 'cloud-upload';
    return 'cloud-done';
  };

  return (
    <View style={[styles.container, { backgroundColor: getStatusColor() }]}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Ionicons
            name={getStatusIcon() as any}
            size={20}
            color={theme.colors.text.inverse}
          />
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>

        <View style={styles.rightSection}>
          {hasOfflineData && (
            <Text style={styles.dataCount}>
              {offlineData.queuedActionsCount} pending
            </Text>
          )}

          {isSyncing ? (
            <ActivityIndicator
              size="small"
              color={theme.colors.text.inverse}
            />
          ) : (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSyncPress}
              disabled={!needsSync && (isOnline && isConnected)}
            >
              <Ionicons
                name="refresh"
                size={16}
                color={theme.colors.text.inverse}
              />
            </TouchableOpacity>
          )}

          {hasOfflineData && !isSyncing && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleClearPress}
            >
              <Ionicons
                name="trash-outline"
                size={16}
                color={theme.colors.text.inverse}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    ...theme.typography.label.medium,
    color: theme.colors.text.inverse,
    marginLeft: theme.spacing[2],
  },
  dataCount: {
    ...theme.typography.caption.medium,
    color: theme.colors.text.inverse,
    marginRight: theme.spacing[2],
  },
  actionButton: {
    padding: theme.spacing[1],
    marginLeft: theme.spacing[1],
  },

});

export default OfflineStatusBanner;