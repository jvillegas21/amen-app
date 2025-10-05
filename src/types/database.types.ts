// Database schema types based on PRD specifications

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id'>>;
      };
      prayers: {
        Row: Prayer;
        Insert: Omit<Prayer, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Prayer, 'id'>>;
      };
      interactions: {
        Row: Interaction;
        Insert: Omit<Interaction, 'id' | 'created_at'>;
        Update: Partial<Omit<Interaction, 'id'>>;
      };
      studies: {
        Row: BibleStudy;
        Insert: Omit<BibleStudy, 'id' | 'created_at'>;
        Update: Partial<Omit<BibleStudy, 'id'>>;
      };
      groups: {
        Row: Group;
        Insert: Omit<Group, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Group, 'id'>>;
      };
      group_members: {
        Row: GroupMember;
        Insert: Omit<GroupMember, 'id' | 'joined_at'>;
        Update: Partial<Omit<GroupMember, 'id'>>;
      };
      comments: {
        Row: Comment;
        Insert: Omit<Comment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Comment, 'id'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Omit<Notification, 'id'>>;
      };
      support_tickets: {
        Row: SupportTicket;
        Insert: Omit<SupportTicket, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SupportTicket, 'id'>>;
      };
      reports: {
        Row: Report;
        Insert: Omit<Report, 'id' | 'created_at'>;
        Update: Partial<Omit<Report, 'id'>>;
      };
      content_filters: {
        Row: ContentFilter;
        Insert: Omit<ContentFilter, 'id' | 'created_at'>;
        Update: Partial<Omit<ContentFilter, 'id'>>;
      };
      user_analytics: {
        Row: UserAnalytic;
        Insert: Omit<UserAnalytic, 'id' | 'created_at'>;
        Update: never;
      };
      follows: {
        Row: Follow;
        Insert: Omit<Follow, 'id' | 'created_at'>;
        Update: never;
      };
      blocked_users: {
        Row: BlockedUser;
        Insert: Omit<BlockedUser, 'id' | 'created_at'>;
        Update: never;
      };
      direct_messages: {
        Row: DirectMessage;
        Insert: Omit<DirectMessage, 'id' | 'created_at'>;
        Update: Partial<Omit<DirectMessage, 'id'>>;
      };
      prayer_reminders: {
        Row: PrayerReminder;
        Insert: Omit<PrayerReminder, 'id' | 'created_at'>;
        Update: Partial<Omit<PrayerReminder, 'id'>>;
      };
    };
  };
}

// User Profile
export interface Profile {
  id: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  location_city?: string;
  location_lat?: number;
  location_lon?: number;
  location_granularity: 'hidden' | 'city' | 'precise';
  onboarding_completed: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  push_token?: string;
  push_token_updated_at?: string;
  is_verified: boolean;
  last_active?: string;
  created_at: string;
  updated_at: string;
}

// Prayer
export interface Prayer {
  id: string;
  user_id: string;
  text: string;
  location_city?: string;
  location_lat?: number;
  location_lon?: number;
  location_granularity: 'hidden' | 'city' | 'precise';
  privacy_level: 'public' | 'friends' | 'groups' | 'private';
  group_id?: string;
  status: 'open' | 'answered' | 'closed';
  is_anonymous: boolean;
  tags: string[];
  images?: string[];
  created_at: string;
  updated_at: string;
  expires_at?: string;
  // Joined data
  user?: Profile;
  // Interaction counts (computed from interactions table)
  comment_count?: number;
  pray_count?: number;
  like_count?: number;
  share_count?: number;
  save_count?: number;
  user_interaction?: Interaction; // Keep for backwards compatibility
  // Track multiple user interactions independently
  user_interactions?: {
    isPrayed: boolean;
    isSaved: boolean;
    isLiked: boolean;
    isShared: boolean;
    prayedAt?: string;
    savedAt?: string;
    likedAt?: string;
    sharedAt?: string;
  };
}

// Interaction
export interface Interaction {
  id: string;
  prayer_id: string;
  user_id: string;
  type: 'PRAY' | 'LIKE' | 'SHARE' | 'SAVE';
  committed_at?: string;
  fulfilled_at?: string;
  reminder_frequency?: 'none' | 'daily' | 'weekly';
  created_at: string;
}

// Bible Study
export interface BibleStudy {
  id: string;
  prayer_id?: string;
  user_id?: string;
  title: string;
  content_md: string;
  scripture_references: ScriptureReference[];
  ai_model: string;
  ai_prompt_version: string;
  quality_score?: number;
  is_featured: boolean;
  view_count: number;
  save_count: number;
  created_at: string;
}

export interface ScriptureReference {
  book: string;
  chapter: number;
  verse_start: number;
  verse_end?: number;
  text?: string;
  translation?: string;
}

// Group
export interface Group {
  id: string;
  name: string;
  description?: string;
  privacy: 'public' | 'private' | 'invite_only';
  creator_id: string;
  invite_code?: string;
  max_members: number;
  member_count: number;
  is_archived: boolean;
  tags: string[];
  rules?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  creator?: Profile;
  user_membership?: GroupMember;
  // Computed fields for UI
  isJoined?: boolean;
  prayer_count?: number;
}

// Group Member
export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  last_active?: string;
  notifications_enabled: boolean;
  // Joined data
  user?: Profile;
  group?: Group;
}

// Comment
export interface Comment {
  id: string;
  prayer_id: string;
  user_id: string;
  parent_id?: string;
  text: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: Profile;
  replies?: Comment[];
  like_count?: number;
}

// Notification
export interface Notification {
  id: string;
  user_id: string;
  sender_id?: string;
  prayer_id?: string;
  group_id?: string;
  type: NotificationType;
  title: string;
  body: string;
  message?: string;
  payload: Record<string, any>;
  metadata?: Record<string, any>;
  action_url?: string;
  read: boolean;
  sent_push: boolean;
  sent_email: boolean;
  created_at: string;
  expires_at: string;
}

export type NotificationType =
  | 'prayer_prayed_for'
  | 'prayer_commented'
  | 'prayer_answered'
  | 'group_invite'
  | 'group_joined'
  | 'group_prayer_added'
  | 'study_featured'
  | 'ticket_updated'
  | 'system_announcement'
  | 'moderation_action';

// Support Ticket
export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  category: 'bug' | 'feature' | 'feature_request' | 'account' | 'billing' | 'content' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: string;
  attachments?: string[];
  admin_notes?: string;
  satisfaction_rating?: number;
  satisfaction_feedback?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

// Report
export interface Report {
  id: string;
  reporter_id: string;
  resource_type: 'prayer' | 'comment' | 'user' | 'group';
  resource_id: string;
  reason: 'spam' | 'inappropriate' | 'harassment' | 'false_info' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  moderator_id?: string;
  moderator_notes?: string;
  action_taken?: string;
  created_at: string;
  resolved_at?: string;
}

export interface ContentFilter {
  id: string;
  user_id: string;
  filter_type: 'keyword' | 'user' | 'category';
  filter_value: string;
  is_active: boolean;
  created_at: string;
}

// User Analytics
export interface UserAnalytic {
  id: string;
  user_id: string;
  event_type: string;
  event_data: Record<string, any>;
  session_id?: string;
  platform?: string;
  app_version?: string;
  timestamp: string;
  created_at: string;
}

// Follow
export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

// Blocked User
export interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  reason?: string;
  created_at: string;
}

// Direct Message
export interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

// Prayer Reminder
export interface PrayerReminder {
  id: string;
  prayer_id: string;
  user_id: string;
  reminder_time: string;
  frequency: 'none' | 'daily' | 'weekly';
  is_active: boolean;
  is_sent: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  prayer?: Prayer;
  user?: Profile;
}

// API Request/Response types
export interface CreatePrayerRequest {
  text: string;
  privacy_level: 'public' | 'friends' | 'groups' | 'private';
  location_city?: string;
  location_lat?: number;
  location_lon?: number;
  location_granularity?: 'hidden' | 'city' | 'precise';
  group_id?: string;
  is_anonymous?: boolean;
  tags?: string[]; // Array of category IDs or custom tags
  category?: string; // Single category for backward compatibility
  images?: string[];
  scheduled_for?: string;
}

export interface UpdatePrayerRequest {
  text?: string;
  privacy_level?: 'public' | 'friends' | 'groups' | 'private';
  location_city?: string;
  location_lat?: number;
  location_lon?: number;
  location_granularity?: 'hidden' | 'city' | 'precise';
  group_id?: string;
  is_anonymous?: boolean;
  tags?: string[]; // Array of category IDs or custom tags
  category?: string; // Single category for backward compatibility
  images?: string[];
  status?: 'open' | 'answered' | 'closed';
}

export interface PrayerInteractionRequest {
  type: 'PRAY' | 'LIKE' | 'SHARE' | 'SAVE';
  committed_at?: string;
  reminder_frequency?: 'none' | 'daily' | 'weekly';
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  privacy: 'public' | 'private' | 'invite_only';
  avatar_url?: string;
  tags?: string[];
}

export interface StudySuggestionRequest {
  prayer_text: string;
  user_id: string;
  preferred_translation?: string;
}

export interface StudySuggestionResponse {
  suggestions: {
    title: string;
    snippet: string;
    scripture_refs: string[];
    confidence: number;
  }[];
  generation_id: string;
}

export interface GenerateStudyRequest {
  prayer_id: string;
  suggestion_id: string;
  custom_prompt?: string;
}

export interface GenerateStudyResponse {
  study: {
    title: string;
    content: string;
    scripture_refs: string[];
    estimated_read_time: number;
  };
  quality_score: number;
}

// RPC Function Types
export interface GetUserFeedPrayersResponse {
  id: string;
  user_id: string;
  text: string;
  privacy_level: 'public' | 'friends' | 'groups' | 'private';
  status: 'open' | 'answered' | 'closed';
  created_at: string;
  user_display_name: string;
  user_avatar_url?: string;
  interaction_count: number;
  comment_count: number;
}

export interface GetPrayerInteractionCountsResponse {
  pray_count: number;
  like_count: number;
  share_count: number;
  save_count: number;
}

export interface GetUserPrayerStatsResponse {
  prayers_posted: number;
  prayers_answered: number;
  total_interactions_received: number;
  total_interactions_given: number;
}