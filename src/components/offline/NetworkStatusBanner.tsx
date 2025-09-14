import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOfflineSync } from '@/hooks/useOfflineSync';

interface NetworkStatusBannerProps {
  onPress?: () => void;
}

/**
 * Network Status Banner Component
 * Shows network connectivity status at the top of the screen
 */
const NetworkStatusBanner: React.FC<NetworkStatusBannerProps> = ({ onPress }) => {
  const { isOnline, isSyncing, pendingItemsCount } = useOfflineSync();
  const [slideAnim] = useState(new Animated.Value(-100));
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Show banner when offline or when there are pending items
    const shouldShow = !isOnline || pendingItemsCount > 0;
    
    if (shouldShow && !showBanner) {
      setShowBanner(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (!shouldShow && showBanner) {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowBanner(false);
      });
    }
  }, [isOnline, pendingItemsCount, showBanner, slideAnim]);

  const getBannerColor = (): string => {
    if (!isOnline) return '#EF4444';
    if (isSyncing) return '#F59E0B';
    return '#3B82F6';
  };

  const getBannerIcon = (): string => {
    if (!isOnline) return 'cloud-offline';
    if (isSyncing) return 'sync';
    return 'cloud-upload';
  };

  const getBannerText = (): string => {
    if (!isOnline) return 'You\'re offline. Changes will sync when connection is restored.';
    if (isSyncing) return 'Syncing your data...';
    return `${pendingItemsCount} item${pendingItemsCount !== 1 ? 's' : ''} pending sync`;
  };

  if (!showBanner) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: getBannerColor(),
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.bannerContent}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Ionicons
          name={getBannerIcon() as any}
          size={20}
          color="#FFFFFF"
        />
        <Text style={styles.bannerText}>
          {getBannerText()}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color="#FFFFFF"
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 44, // Account for status bar
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 8,
    marginRight: 8,
  },
});

export default NetworkStatusBanner;
