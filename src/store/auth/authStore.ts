import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Session } from '@supabase/supabase-js';
import { Profile } from '@/types/database.types';
import { authService } from '@/services/auth/authService';
import { profileService } from '@/services/api/profileService';

/**
 * Auth Store Interface
 * Follows Interface Segregation Principle: Focused auth-related state management
 */
interface AuthState {
  // State
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboardingComplete: boolean;
  error: string | null;

  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyEmail: (email: string, token: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

/**
 * Auth Store Implementation
 * Implements Single Responsibility: Manages authentication state only
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      profile: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      isOnboardingComplete: false,
      error: null,

      // Sign In
      signIn: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const { user, session, profile } = await authService.signIn(email, password);
          set({
            user,
            session,
            profile,
            isAuthenticated: true,
            isOnboardingComplete: profile?.onboarding_completed || false,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Sign in failed',
            isLoading: false,
          });
          throw error;
        }
      },

      // Sign Up
      signUp: async (email: string, password: string, displayName: string) => {
        set({ isLoading: true, error: null });
        try {
          const { user, session } = await authService.signUp(email, password, displayName);
          set({
            user,
            session,
            isAuthenticated: false, // Email verification required
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Sign up failed',
            isLoading: false,
          });
          throw error;
        }
      },

      // Sign In with Google
      signInWithGoogle: async () => {
        set({ isLoading: true, error: null });
        try {
          const { user, session, profile } = await authService.signInWithGoogle();
          set({
            user,
            session,
            profile,
            isAuthenticated: true,
            isOnboardingComplete: profile?.onboarding_completed || false,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Google sign in failed',
            isLoading: false,
          });
          throw error;
        }
      },

      // Sign In with Apple
      signInWithApple: async () => {
        set({ isLoading: true, error: null });
        try {
          const { user, session, profile } = await authService.signInWithApple();
          set({
            user,
            session,
            profile,
            isAuthenticated: true,
            isOnboardingComplete: profile?.onboarding_completed || false,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Apple sign in failed',
            isLoading: false,
          });
          throw error;
        }
      },

      // Sign Out
      signOut: async () => {
        set({ isLoading: true, error: null });
        try {
          await authService.signOut();
          set({
            user: null,
            profile: null,
            session: null,
            isAuthenticated: false,
            isOnboardingComplete: false,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Sign out failed',
            isLoading: false,
          });
          throw error;
        }
      },

      // Reset Password
      resetPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          await authService.resetPassword(email);
          set({ isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Password reset failed',
            isLoading: false,
          });
          throw error;
        }
      },

      // Verify Email
      verifyEmail: async (email: string, token: string) => {
        set({ isLoading: true, error: null });
        try {
          const { user, session } = await authService.verifyEmail(email, token);
          const profile = await profileService.getOrCreateProfile(user.id, user.email);
          set({
            user,
            session,
            profile,
            isAuthenticated: true,
            isOnboardingComplete: profile?.onboarding_completed || false,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Email verification failed',
            isLoading: false,
          });
          throw error;
        }
      },

      // Update Profile
      updateProfile: async (updates: Partial<Profile>) => {
        set({ isLoading: true, error: null });
        try {
          const profile = await authService.updateProfile(updates);
          set({
            profile,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Profile update failed',
            isLoading: false,
          });
          throw error;
        }
      },

      // Check Auth Status
      checkAuthStatus: async () => {
        set({ isLoading: true });
        try {
          const { user, session, profile } = await authService.getCurrentSession();
          if (user && session) {
            set({
              user,
              session,
              profile,
              isAuthenticated: true,
              isOnboardingComplete: profile?.onboarding_completed || false,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              session: null,
              profile: null,
              isAuthenticated: false,
              isOnboardingComplete: false,
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            user: null,
            session: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      // Complete Onboarding
      completeOnboarding: async () => {
        const profile = get().profile;
        if (!profile) return;

        set({ isLoading: true, error: null });
        try {
          const updatedProfile = await authService.updateProfile({
            ...profile,
            onboarding_completed: true,
          });
          set({
            profile: updatedProfile,
            isOnboardingComplete: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to complete onboarding',
            isLoading: false,
          });
          throw error;
        }
      },

      // Clear Error
      clearError: () => set({ error: null }),

      // Set Loading
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isOnboardingComplete: state.isOnboardingComplete,
      }),
    }
  )
);