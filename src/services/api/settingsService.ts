import { supabase } from '@/config/supabase';

export interface NotificationSettings {
  push_notifications: boolean;
  prayer_reminders: boolean;
  group_updates: boolean;
  weekly_summary: boolean;
  prayer_responses: boolean;
  new_followers: boolean;
  direct_messages: boolean;
  system_updates: boolean;
  reminder_time: string;
  quiet_hours: {
    enabled: boolean;
    start_time: string;
    end_time: string;
  };
}

export interface PrivacySettings {
  profile_visibility: 'public' | 'friends' | 'private';
  show_location: boolean;
  allow_following: boolean;
  show_online_status: boolean;
  allow_direct_messages: boolean;
  show_prayer_history: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  data_usage: 'wifi_only' | 'always' | 'never';
  auto_backup: boolean;
  haptic_feedback: boolean;
  sound_effects: boolean;
}

export interface SecuritySettings {
  two_factor_enabled: boolean;
  biometric_enabled: boolean;
  session_timeout: number;
  login_notifications: boolean;
  suspicious_activity_alerts: boolean;
}

export interface AllSettings {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  app: AppSettings;
  security: SecuritySettings;
}

/**
 * Settings Service - Manages user settings and preferences
 */
class SettingsService {
  /**
   * Get all user settings
   */
  async getAllSettings(userId: string): Promise<AllSettings> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    // Parse settings from profile or use defaults
    const defaultSettings: AllSettings = {
      notifications: {
        push_notifications: profile.email_notifications ?? true,
        prayer_reminders: true,
        group_updates: false,
        weekly_summary: true,
        prayer_responses: true,
        new_followers: true,
        direct_messages: true,
        system_updates: false,
        reminder_time: '09:00',
        quiet_hours: {
          enabled: true,
          start_time: '22:00',
          end_time: '08:00',
        },
      },
      privacy: {
        profile_visibility: 'public',
        show_location: profile.location_granularity !== 'hidden',
        allow_following: true,
        show_online_status: false,
        allow_direct_messages: true,
        show_prayer_history: true,
      },
      app: {
        theme: 'system',
        language: 'English',
        data_usage: 'wifi_only',
        auto_backup: true,
        haptic_feedback: true,
        sound_effects: true,
      },
      security: {
        two_factor_enabled: false,
        biometric_enabled: false,
        session_timeout: 30,
        login_notifications: true,
        suspicious_activity_alerts: true,
      },
    };

    return defaultSettings;
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(userId: string, settings: Partial<NotificationSettings>): Promise<void> {
    // For now, update the profile table with basic notification settings
    const updates: any = {};
    
    if (settings.push_notifications !== undefined) {
      updates.push_notifications = settings.push_notifications;
    }
    // Note: prayer_reminders field doesn't exist in profiles table, so we skip it
    // This should be stored in a separate settings table or handled differently

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(userId: string, settings: Partial<PrivacySettings>): Promise<void> {
    const updates: any = {};
    
    if (settings.show_location !== undefined) {
      updates.location_granularity = settings.show_location ? 'city' : 'hidden';
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
  }

  /**
   * Update app settings
   */
  async updateAppSettings(userId: string, settings: Partial<AppSettings>): Promise<void> {
    // App settings are typically stored locally, but we can store some in the profile
    const updates: any = {};
    
    // Note: language field doesn't exist in profiles table, so we skip it
    // This should be stored in a separate settings table or handled locally

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
    }
  }

  /**
   * Update security settings
   */
  async updateSecuritySettings(userId: string, settings: Partial<SecuritySettings>): Promise<void> {
    // Security settings are typically stored in a separate table or handled by auth
    // For now, we'll just log the update
    console.log('Security settings update:', settings);
  }

  /**
   * Reset all settings to defaults
   */
  async resetAllSettings(userId: string): Promise<void> {
    const defaultUpdates = {
      email_notifications: true,
      push_notifications: true,
      location_granularity: 'city',
    };

    const { error } = await supabase
      .from('profiles')
      .update(defaultUpdates)
      .eq('id', userId);

    if (error) throw error;
  }
}

export const settingsService = new SettingsService();
