/**
 * Sharing Hook - Provides sharing functionality for various content types
 */

import { useState, useCallback } from 'react';
import { sharingService, ShareContent, ShareOptions } from '@/services/sharing/sharingService';
import { Prayer, BibleStudy } from '@/types/database.types';

interface UseSharingReturn {
  // Sharing state
  isSharing: boolean;
  isSharingAvailable: boolean;
  
  // Sharing methods
  sharePrayer: (prayer: Prayer, options?: ShareOptions) => Promise<boolean>;
  shareBibleStudy: (study: BibleStudy, options?: ShareOptions) => Promise<boolean>;
  shareApp: (options?: ShareOptions) => Promise<boolean>;
  shareGroup: (group: any, options?: ShareOptions) => Promise<boolean>;
  shareUser: (user: any, options?: ShareOptions) => Promise<boolean>;
  
  // Utility methods
  checkSharingAvailability: () => Promise<boolean>;
  getSharingStats: () => Promise<any>;
}

export const useSharing = (): UseSharingReturn => {
  const [isSharing, setIsSharing] = useState(false);
  const [isSharingAvailable, setIsSharingAvailable] = useState(true);

  const sharePrayer = useCallback(async (prayer: Prayer, options: ShareOptions = {}): Promise<boolean> => {
    setIsSharing(true);
    try {
      const result = await sharingService.sharePrayer(prayer, options);
      return result;
    } catch (error) {
      console.error('Error sharing prayer:', error);
      return false;
    } finally {
      setIsSharing(false);
    }
  }, []);

  const shareBibleStudy = useCallback(async (study: BibleStudy, options: ShareOptions = {}): Promise<boolean> => {
    setIsSharing(true);
    try {
      const result = await sharingService.shareBibleStudy(study, options);
      return result;
    } catch (error) {
      console.error('Error sharing Bible study:', error);
      return false;
    } finally {
      setIsSharing(false);
    }
  }, []);

  const shareApp = useCallback(async (options: ShareOptions = {}): Promise<boolean> => {
    setIsSharing(true);
    try {
      const result = await sharingService.shareApp(options);
      return result;
    } catch (error) {
      console.error('Error sharing app:', error);
      return false;
    } finally {
      setIsSharing(false);
    }
  }, []);

  const shareGroup = useCallback(async (group: any, options: ShareOptions = {}): Promise<boolean> => {
    setIsSharing(true);
    try {
      const result = await sharingService.shareGroup(group, options);
      return result;
    } catch (error) {
      console.error('Error sharing group:', error);
      return false;
    } finally {
      setIsSharing(false);
    }
  }, []);

  const shareUser = useCallback(async (user: any, options: ShareOptions = {}): Promise<boolean> => {
    setIsSharing(true);
    try {
      const result = await sharingService.shareUser(user, options);
      return result;
    } catch (error) {
      console.error('Error sharing user:', error);
      return false;
    } finally {
      setIsSharing(false);
    }
  }, []);

  const checkSharingAvailability = useCallback(async (): Promise<boolean> => {
    try {
      const available = await sharingService.isSharingAvailable();
      setIsSharingAvailable(available);
      return available;
    } catch (error) {
      console.error('Error checking sharing availability:', error);
      setIsSharingAvailable(false);
      return false;
    }
  }, []);

  const getSharingStats = useCallback(async () => {
    try {
      return await sharingService.getSharingStats();
    } catch (error) {
      console.error('Error getting sharing stats:', error);
      return null;
    }
  }, []);

  return {
    isSharing,
    isSharingAvailable,
    sharePrayer,
    shareBibleStudy,
    shareApp,
    shareGroup,
    shareUser,
    checkSharingAvailability,
    getSharingStats,
  };
};