import { supabase } from '@/config/supabase';
import { Profile } from '@/types/database.types';

/**
 * Profile Service - Manages user profile operations
 * Follows Single Responsibility Principle: Only handles profile-related data operations
 */
class ProfileService {
  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle no rows gracefully

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
      return null;
    }
  }

  /**
   * Get or create user profile by ID
   * If profile doesn't exist, creates a basic one
   */
  async getOrCreateProfile(userId: string, userEmail?: string): Promise<Profile> {
    try {
      // First, try to get the existing profile
      let profile = await this.getProfile(userId);
      
      if (profile) {
        return profile;
      }
      
      // If no profile exists, create a new one
      const displayName = userEmail ? userEmail.split('@')[0] : 'User';
      
      try {
        profile = await this.createProfile({
          id: userId,
          display_name: displayName,
          location_granularity: 'city',
          onboarding_completed: false,
          email_notifications: true,
          push_notifications: true,
        });
        return profile;
      } catch (createError: any) {
        // If creation fails due to duplicate key, try to fetch again
        if (createError.code === '23505') {
          console.log('Profile already exists, fetching again...');
          // Add a small delay to handle race conditions
          await new Promise(resolve => setTimeout(resolve, 100));
          profile = await this.getProfile(userId);
          if (profile) {
            return profile;
          }
          // If still no profile found, throw the original error
          throw new Error('Profile creation failed and profile not found after retry');
        }
        throw createError;
      }
    } catch (error) {
      console.error('Error in getOrCreateProfile:', error);
      throw error;
    }
  }

  /**
   * Create new user profile
   */
  async createProfile(profile: Omit<Profile, 'created_at' | 'updated_at'>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create profile');

    return data;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      // Provide more specific error messages
      if (error.code === 'PGRST116') {
        throw new Error('Profile not found or access denied. Please ensure you are signed in.');
      }
      if (error.message.includes('violates check constraint')) {
        throw new Error('Invalid profile data. Please check your input and try again.');
      }
      throw new Error(`Failed to update profile: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('Profile update failed. No data returned from server.');
    }

    return data;
  }

  /**
   * Delete user profile
   */
  async deleteProfile(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  }

  /**
   * Search profiles by display name
   */
  async searchProfiles(query: string, limit = 10): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('display_name', `%${query}%`)
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get profiles by IDs
   */
  async getProfilesByIds(userIds: string[]): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    if (error) throw error;
    return data || [];
  }

  /**
   * Update profile avatar
   */
  async updateAvatar(userId: string, file: File): Promise<string> {
    // Upload to storage
    const fileName = `${userId}-${Date.now()}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Update profile
    await this.updateProfile(userId, { avatar_url: data.publicUrl });

    return data.publicUrl;
  }

  /**
   * Update location settings
   */
  async updateLocation(userId: string, location: {
    city?: string;
    lat?: number;
    lon?: number;
    granularity: 'hidden' | 'city' | 'precise';
  }): Promise<Profile> {
    return await this.updateProfile(userId, {
      location_city: location.city,
      location_lat: location.lat,
      location_lon: location.lon,
      location_granularity: location.granularity,
    });
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(userId: string, settings: {
    email_notifications?: boolean;
    push_notifications?: boolean;
  }): Promise<Profile> {
    return await this.updateProfile(userId, settings);
  }
}

// Export singleton instance
export const profileService = new ProfileService();