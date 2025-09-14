// Authentication and session types

export interface AuthUser {
  id: string;
  email: string;
  email_verified: boolean;
  phone?: string;
  created_at: string;
  updated_at: string;
  app_metadata: {
    provider?: string;
    providers?: string[];
  };
  user_metadata: {
    display_name?: string;
    avatar_url?: string;
    full_name?: string;
  };
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: string;
  user: AuthUser;
}

export interface SignUpRequest {
  email: string;
  password: string;
  display_name: string;
  agreed_to_terms: boolean;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignInResponse {
  user: AuthUser;
  session: Session;
}

export interface SignUpResponse {
  user: AuthUser;
  session: Session | null;
  verification_required: boolean;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface UpdatePasswordRequest {
  new_password: string;
  current_password?: string;
}

export interface SocialAuthProvider {
  provider: 'google' | 'apple' | 'facebook';
  scopes?: string[];
}

export interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
}

export interface AuthError {
  code: string;
  message: string;
  status?: number;
}

export interface OnboardingData {
  bio?: string;
  location_permission?: boolean;
  notification_permission?: boolean;
  privacy_settings?: {
    profile_visibility: 'public' | 'friends' | 'private';
    location_sharing: 'hidden' | 'city' | 'precise';
    allow_messages: boolean;
  };
  interests?: string[];
  church_affiliation?: string;
}