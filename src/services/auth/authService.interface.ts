import { User, Session } from '@supabase/supabase-js';
import { Profile } from '@/types/database.types';

/**
 * Authentication Service Interface
 * Follows Interface Segregation Principle: Defines only auth-related operations
 */
export interface IAuthService {
  signIn(email: string, password: string): Promise<{
    user: User;
    session: Session;
    profile: Profile | null;
  }>;

  signUp(email: string, password: string, displayName: string): Promise<{
    user: User;
    session: Session | null;
  }>;

  signOut(): Promise<void>;

  resetPassword(email: string): Promise<void>;

  verifyEmail(email: string, token: string): Promise<{
    user: User;
    session: Session;
  }>;

  updatePassword(newPassword: string): Promise<void>;

  getCurrentSession(): Promise<{
    user: User | null;
    session: Session | null;
    profile: Profile | null;
  }>;

  updateProfile(updates: Partial<Profile>): Promise<Profile>;

  deleteAccount(): Promise<void>;

  onAuthStateChange(callback: (user: User | null, session: Session | null) => void): {
    data: { subscription: any };
  };
}