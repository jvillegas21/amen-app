import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/config/supabase';
import { Profile } from '@/types/database.types';
import { IAuthService } from './authService.interface';
import { profileService } from '@/services/api/profileService';

/**
 * Authentication Service Implementation
 * Follows Dependency Inversion Principle: Depends on abstractions (IAuthService)
 */
class AuthService implements IAuthService {
  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<{
    user: User;
    session: Session;
    profile: Profile | null;
  }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user || !data.session) {
      throw new Error('Invalid credentials');
    }

    // Get or create user profile
    const profile = await profileService.getOrCreateProfile(data.user.id, data.user.email);

    return {
      user: data.user,
      session: data.session,
      profile,
    };
  }

  /**
   * Sign up with email, password, and display name
   */
  async signUp(email: string, password: string, displayName: string): Promise<{
    user: User;
    session: Session | null;
  }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) throw error;
    if (!data.user) {
      throw new Error('Failed to create account');
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.EXPO_PUBLIC_APP_URL}/reset-password`,
    });
    if (error) throw error;
  }

  /**
   * Verify email with OTP
   */
  async verifyEmail(email: string, token: string): Promise<{
    user: User;
    session: Session;
  }> {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) throw error;
    if (!data.user || !data.session) {
      throw new Error('Verification failed');
    }

    // Profile will be created automatically when user signs in via getOrCreateProfile
    // No need to create it here to avoid duplicate key conflicts

    return {
      user: data.user,
      session: data.session,
    };
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  }

  /**
   * Get current session and user
   */
  async getCurrentSession(): Promise<{
    user: User | null;
    session: Session | null;
    profile: Profile | null;
  }> {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return { user: null, session: null, profile: null };
    }

    try {
      // Try to get or create profile for the user
      const profile = await profileService.getOrCreateProfile(session.user.id, session.user.email);
      return {
        user: session.user,
        session,
        profile,
      };
    } catch (profileError) {
      console.error('Error getting/creating profile:', profileError);
      // Return session without profile if profile creation fails
      return {
        user: session.user,
        session,
        profile: null,
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<Profile>): Promise<Profile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    return await profileService.updateProfile(user.id, updates);
  }

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Delete profile first
    await profileService.deleteProfile(user.id);

    // Then delete auth account
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) throw error;
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (user: User | null, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null, session);
    });
  }
}

// Export singleton instance
export const authService = new AuthService();