import { supabase } from '@/config/supabase';

export interface PrivacySettings {
  profile_visibility: 'public' | 'friends' | 'private';
  show_location: boolean;
  allow_following: boolean;
  show_online_status: boolean;
  allow_messages: 'everyone' | 'friends' | 'none';
  show_prayer_history: boolean;
  allow_search: boolean;
  data_sharing: boolean;
}

/**
 * Privacy Service - Manages user privacy settings
 */
class PrivacyService {
  /**
   * Get user's privacy settings
   */
  async getPrivacySettings(userId: string): Promise<PrivacySettings> {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        profile_visibility,
        show_location,
        allow_following,
        show_online_status,
        allow_messages,
        show_prayer_history,
        allow_search,
        data_sharing
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Privacy settings not found');

    return {
      profile_visibility: data.profile_visibility || 'public',
      show_location: data.show_location ?? true,
      allow_following: data.allow_following ?? true,
      show_online_status: data.show_online_status ?? false,
      allow_messages: data.allow_messages || 'friends',
      show_prayer_history: data.show_prayer_history ?? true,
      allow_search: data.allow_search ?? true,
      data_sharing: data.data_sharing ?? false,
    };
  }

  /**
   * Update user's privacy settings
   */
  async updatePrivacySettings(userId: string, settings: Partial<PrivacySettings>): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  }

  /**
   * Reset privacy settings to defaults
   */
  async resetPrivacySettings(userId: string): Promise<void> {
    const defaultSettings: PrivacySettings = {
      profile_visibility: 'public',
      show_location: true,
      allow_following: true,
      show_online_status: false,
      allow_messages: 'friends',
      show_prayer_history: true,
      allow_search: true,
      data_sharing: false,
    };

    await this.updatePrivacySettings(userId, defaultSettings);
  }
}

// Export singleton instance
export const privacyService = new PrivacyService();