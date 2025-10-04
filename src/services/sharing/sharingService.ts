/**
 * Sharing Service - Native sharing functionality for prayers, Bible studies, and app content
 */

import { Share, Alert, Platform } from 'react-native';
import { Prayer, BibleStudy } from '@/types/database.types';

export interface ShareContent {
  type: 'prayer' | 'bible_study' | 'app' | 'group' | 'user';
  title: string;
  message: string;
  url?: string;
  imageUrl?: string;
}

export interface ShareOptions {
  showAlert?: boolean;
  alertTitle?: string;
  alertMessage?: string;
}

class SharingService {
  /**
   * Share a prayer request
   */
  async sharePrayer(prayer: Prayer, options: ShareOptions = {}): Promise<boolean> {
    try {
      const shareContent: ShareContent = {
        type: 'prayer',
        title: 'Prayer Request',
        message: this.formatPrayerMessage(prayer),
        url: this.generatePrayerUrl(prayer.id),
      };

      const result = await this.shareContent(shareContent);
      
      if (result && options.showAlert) {
        Alert.alert(
          options.alertTitle || 'Prayer Shared',
          options.alertMessage || 'Thank you for sharing this prayer request. May it bring comfort and support to those who need it.',
          [{ text: 'OK' }]
        );
      }

      return result;
    } catch (error) {
      console.error('Error sharing prayer:', error);
      return false;
    }
  }

  /**
   * Share a Bible study
   */
  async shareBibleStudy(study: BibleStudy, options: ShareOptions = {}): Promise<boolean> {
    try {
      const shareContent: ShareContent = {
        type: 'bible_study',
        title: 'Bible Study',
        message: this.formatBibleStudyMessage(study),
        url: this.generateBibleStudyUrl(study.id),
      };

      const result = await this.shareContent(shareContent);
      
      if (result && options.showAlert) {
        Alert.alert(
          options.alertTitle || 'Bible Study Shared',
          options.alertMessage || 'Thank you for sharing this Bible study. May it inspire and guide others in their faith journey.',
          [{ text: 'OK' }]
        );
      }

      return result;
    } catch (error) {
      console.error('Error sharing Bible study:', error);
      return false;
    }
  }

  /**
   * Share the app
   */
  async shareApp(options: ShareOptions = {}): Promise<boolean> {
    try {
      const shareContent: ShareContent = {
        type: 'app',
        title: 'Amenity - Prayer Community App',
        message: this.formatAppMessage(),
        url: this.getAppStoreUrl(),
      };

      const result = await this.shareContent(shareContent);
      
      if (result && options.showAlert) {
        Alert.alert(
          options.alertTitle || 'App Shared',
          options.alertMessage || 'Thank you for sharing Amenity! Help us build a community of prayer and support.',
          [{ text: 'OK' }]
        );
      }

      return result;
    } catch (error) {
      console.error('Error sharing app:', error);
      return false;
    }
  }

  /**
   * Share a group
   */
  async shareGroup(group: any, options: ShareOptions = {}): Promise<boolean> {
    try {
      const shareContent: ShareContent = {
        type: 'group',
        title: 'Prayer Group',
        message: this.formatGroupMessage(group),
        url: this.generateGroupUrl(group.id),
      };

      const result = await this.shareContent(shareContent);
      
      if (result && options.showAlert) {
        Alert.alert(
          options.alertTitle || 'Group Shared',
          options.alertMessage || 'Thank you for sharing this prayer group. Help others find community and support.',
          [{ text: 'OK' }]
        );
      }

      return result;
    } catch (error) {
      console.error('Error sharing group:', error);
      return false;
    }
  }

  /**
   * Share a user profile
   */
  async shareUser(user: any, options: ShareOptions = {}): Promise<boolean> {
    try {
      const shareContent: ShareContent = {
        type: 'user',
        title: 'User Profile',
        message: this.formatUserMessage(user),
        url: this.generateUserUrl(user.id),
      };

      const result = await this.shareContent(shareContent);
      
      if (result && options.showAlert) {
        Alert.alert(
          options.alertTitle || 'Profile Shared',
          options.alertMessage || 'Thank you for sharing this profile.',
          [{ text: 'OK' }]
        );
      }

      return result;
    } catch (error) {
      console.error('Error sharing user:', error);
      return false;
    }
  }

  /**
   * Core sharing method
   */
  private async shareContent(content: ShareContent): Promise<boolean> {
    try {
      const shareOptions = {
        title: content.title,
        message: content.message,
        url: content.url,
      };

      // Remove undefined values
      Object.keys(shareOptions).forEach(key => {
        if (shareOptions[key as keyof typeof shareOptions] === undefined) {
          delete shareOptions[key as keyof typeof shareOptions];
        }
      });

      const result = await Share.share(shareOptions);
      
      // Check if sharing was successful
      return result.action === Share.sharedAction;
    } catch (error) {
      console.error('Error in shareContent:', error);
      return false;
    }
  }

  /**
   * Format prayer message for sharing
   */
  private formatPrayerMessage(prayer: Prayer): string {
    const author = prayer.is_anonymous ? 'Anonymous' : prayer.user?.display_name || 'Someone';
    const location = prayer.location_city ? ` from ${prayer.location_city}` : '';
    
    let message = `Please pray for this request${location}:\n\n`;
    message += `"${prayer.text}"\n\n`;
    message += `- ${author}\n\n`;
    message += `Join us in prayer on Amenity - a community where faith and support come together.`;

    return message;
  }

  /**
   * Format Bible study message for sharing
   */
  private formatBibleStudyMessage(study: BibleStudy): string {
    let message = `Check out this Bible study: "${study.title}"\n\n`;
    
    // Extract first paragraph from markdown content
    const firstParagraph = study.content_md
      .split('\n\n')[0]
      .replace(/^#+\s*/, '') // Remove markdown headers
      .substring(0, 200);
    
    message += `${firstParagraph}...\n\n`;
    message += `Join us on Amenity for more Bible studies and prayer support.`;

    return message;
  }

  /**
   * Format app message for sharing
   */
  private formatAppMessage(): string {
    return `Join me on Amenity - a beautiful prayer community app where we can share our prayer requests, support each other, and grow in faith together. 

✨ Share prayer requests
🙏 Pray for others
📖 AI-powered Bible studies
👥 Join prayer groups
💝 Build meaningful connections

Download Amenity and let's pray together!`;
  }

  /**
   * Format group message for sharing
   */
  private formatGroupMessage(group: any): string {
    let message = `Join our prayer group: "${group.name}"\n\n`;
    
    if (group.description) {
      message += `${group.description}\n\n`;
    }
    
    message += `Connect with others who share your faith and prayer intentions. Join us on Amenity!`;

    return message;
  }

  /**
   * Format user message for sharing
   */
  private formatUserMessage(user: any): string {
    let message = `Connect with ${user.display_name} on Amenity!\n\n`;
    
    if (user.bio) {
      message += `${user.bio}\n\n`;
    }
    
    message += `Join us on Amenity - a community where faith and support come together.`;

    return message;
  }

  /**
   * Generate prayer URL
   */
  private generatePrayerUrl(prayerId: string): string {
    return `https://Amenity.app/prayer/${prayerId}`;
  }

  /**
   * Generate Bible study URL
   */
  private generateBibleStudyUrl(studyId: string): string {
    return `https://Amenity.app/study/${studyId}`;
  }

  /**
   * Generate group URL
   */
  private generateGroupUrl(groupId: string): string {
    return `https://Amenity.app/group/${groupId}`;
  }

  /**
   * Generate user URL
   */
  private generateUserUrl(userId: string): string {
    return `https://Amenity.app/user/${userId}`;
  }

  /**
   * Get app store URL
   */
  private getAppStoreUrl(): string {
    if (Platform.OS === 'ios') {
      return 'https://apps.apple.com/app/Amenity-prayer-community/id1234567890';
    } else {
      return 'https://play.google.com/store/apps/details?id=com.Amenity.app';
    }
  }

  /**
   * Check if sharing is available on the device
   */
  async isSharingAvailable(): Promise<boolean> {
    try {
      // Try to share a test message to check if sharing is available
      await Share.share({
        message: 'Test',
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get sharing statistics for analytics
   */
  async getSharingStats(): Promise<{
    totalShares: number;
    sharesByType: Record<string, number>;
    sharesByPlatform: Record<string, number>;
  }> {
    // This would typically fetch from analytics service
    // For now, return mock data
    return {
      totalShares: 0,
      sharesByType: {
        prayer: 0,
        bible_study: 0,
        app: 0,
        group: 0,
        user: 0,
      },
      sharesByPlatform: {
        ios: 0,
        android: 0,
        web: 0,
      },
    };
  }

  /**
   * Track sharing event for analytics
   */
  async trackSharingEvent(content: ShareContent, platform: string): Promise<void> {
    try {
      // This would typically send to analytics service
      console.log('Sharing event tracked:', {
        type: content.type,
        platform,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error tracking sharing event:', error);
    }
  }
}

// Export singleton instance
export const sharingService = new SharingService();
export default sharingService;