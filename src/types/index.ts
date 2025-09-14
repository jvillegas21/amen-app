// Main types export file

export * from './database.types';
export * from './navigation.types';
export * from './auth.types';

// Common application types
export interface User {
  id: string;
  email: string;
  profile?: import('./database.types').Profile;
}

export interface AppError {
  code: string;
  message: string;
  details?: any;
}

export interface PaginationParams {
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  next_cursor?: string;
  has_more: boolean;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  accuracy?: number;
}

export interface ImageUpload {
  uri: string;
  width: number;
  height: number;
  type: string;
  size: number;
}

export interface FilterOptions {
  location?: {
    lat: number;
    lon: number;
    radius: number; // km
  };
  status?: 'open' | 'answered' | 'closed';
  tags?: string[];
  group_id?: string;
}

export interface PrivacySettings {
  profile: {
    display_name: 'public' | 'friends' | 'private';
    location: 'hidden' | 'city' | 'precise';
    online_status: boolean;
    profile_picture: 'public' | 'friends' | 'private';
  };
  prayers: {
    default_visibility: 'public' | 'friends' | 'groups' | 'private';
    allow_comments: 'everyone' | 'friends' | 'none';
    allow_sharing: boolean;
    show_location: boolean;
  };
  notifications: {
    push: boolean;
    email: boolean;
    in_app: boolean;
    categories: {
      prayer_interactions: boolean;
      group_activities: boolean;
      system_updates: boolean;
      marketing_communications: boolean;
    };
  };
  data_sharing: {
    analytics: boolean;
    personalization: boolean;
    research_participation: boolean;
  };
}

export interface NotificationPreferences {
  push_enabled: boolean;
  email_enabled: boolean;
  prayer_updates: boolean;
  group_invites: boolean;
  comments: boolean;
  daily_reminders: boolean;
  weekly_digest: boolean;
}