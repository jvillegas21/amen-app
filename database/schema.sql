-- Amenity Database Schema
-- Based on PRD specifications with enhanced features from mockups

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
CREATE TYPE privacy_level AS ENUM ('public', 'friends', 'groups', 'private');
CREATE TYPE location_granularity AS ENUM ('hidden', 'city', 'precise');
CREATE TYPE prayer_status AS ENUM ('open', 'answered', 'closed');
CREATE TYPE interaction_type AS ENUM ('PRAY', 'LIKE', 'SHARE', 'SAVE');
CREATE TYPE reminder_frequency AS ENUM ('none', 'daily', 'weekly');
CREATE TYPE group_privacy AS ENUM ('public', 'private', 'invite_only');
CREATE TYPE member_role AS ENUM ('admin', 'moderator', 'member');
CREATE TYPE notification_type AS ENUM (
  'prayer_prayed_for',
  'prayer_commented',
  'prayer_answered',
  'group_invite',
  'group_joined',
  'group_prayer_added',
  'study_featured',
  'ticket_updated',
  'system_announcement',
  'moderation_action'
);
CREATE TYPE ticket_category AS ENUM ('bug', 'feature', 'feature_request', 'account', 'billing', 'content', 'other');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE ticket_status AS ENUM ('open', 'pending', 'in_progress', 'resolved', 'closed');
CREATE TYPE report_reason AS ENUM ('spam', 'inappropriate', 'harassment', 'false_info', 'other');
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');

-- Profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name text NOT NULL CHECK (length(display_name) >= 2 AND length(display_name) <= 50),
  avatar_url text,
  bio text CHECK (length(bio) <= 500),
  location_city text,
  location_lat double precision,
  location_lon double precision,
  location_granularity location_granularity DEFAULT 'city',
  onboarding_completed boolean DEFAULT false,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  push_token text,
  push_token_updated_at timestamptz,
  is_verified boolean DEFAULT false,
  last_active timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Prayers table
CREATE TABLE prayers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text text NOT NULL CHECK (length(text) BETWEEN 10 AND 4000),
  location_city text,
  location_lat double precision,
  location_lon double precision,
  location_granularity location_granularity DEFAULT 'city',
  privacy_level privacy_level DEFAULT 'public',
  group_id uuid REFERENCES groups(id) ON DELETE SET NULL,
  status prayer_status DEFAULT 'open',
  is_anonymous boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  images text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Interactions table
CREATE TABLE interactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  prayer_id uuid NOT NULL REFERENCES prayers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type interaction_type NOT NULL,
  committed_at timestamptz,
  fulfilled_at timestamptz,
  reminder_frequency reminder_frequency DEFAULT 'none',
  created_at timestamptz DEFAULT now(),
  UNIQUE (prayer_id, user_id, type)
);

-- Bible Studies table
CREATE TABLE studies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  prayer_id uuid REFERENCES prayers(id) ON DELETE SET NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  content_md text NOT NULL,
  scripture_references jsonb DEFAULT '[]',
  ai_model text DEFAULT 'gpt-4',
  ai_prompt_version text DEFAULT 'v1.0',
  quality_score integer CHECK (quality_score BETWEEN 1 AND 5),
  is_featured boolean DEFAULT false,
  view_count integer DEFAULT 0,
  save_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Groups table
CREATE TABLE groups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL CHECK (length(name) BETWEEN 3 AND 100),
  description text CHECK (length(description) <= 1000),
  privacy group_privacy NOT NULL DEFAULT 'public',
  creator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invite_code text UNIQUE,
  max_members integer DEFAULT 100,
  member_count integer DEFAULT 0,
  is_archived boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  rules text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Group Members table
CREATE TABLE group_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role member_role DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  last_active timestamptz,
  notifications_enabled boolean DEFAULT true,
  UNIQUE (group_id, user_id)
);

-- Comments table
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  prayer_id uuid NOT NULL REFERENCES prayers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  text text NOT NULL CHECK (length(text) BETWEEN 1 AND 1000),
  is_edited boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  prayer_id uuid REFERENCES prayers(id) ON DELETE SET NULL,
  group_id uuid REFERENCES groups(id) ON DELETE SET NULL,
  type notification_type NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  message text,
  payload jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  action_url text,
  read boolean DEFAULT false,
  sent_push boolean DEFAULT false,
  sent_email boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days')
);

-- Support Tickets table
CREATE TABLE support_tickets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject text NOT NULL CHECK (length(subject) BETWEEN 5 AND 200),
  description text NOT NULL CHECK (length(description) BETWEEN 10 AND 2000),
  attachments text[] DEFAULT '{}',
  category ticket_category DEFAULT 'other',
  priority ticket_priority DEFAULT 'medium',
  status ticket_status NOT NULL DEFAULT 'open',
  assigned_to uuid REFERENCES profiles(id),
  admin_notes text,
  satisfaction_rating integer CHECK (satisfaction_rating BETWEEN 1 AND 5),
  satisfaction_feedback text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Reports table
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resource_type text NOT NULL CHECK (resource_type IN ('prayer','comment','user','group')),
  resource_id uuid NOT NULL,
  reason report_reason NOT NULL,
  description text,
  status report_status DEFAULT 'pending',
  moderator_id uuid REFERENCES profiles(id),
  moderator_notes text,
  action_taken text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- User Analytics table
CREATE TABLE user_analytics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  session_id text,
  platform text,
  app_version text,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Following/Followers table (for social features)
CREATE TABLE follows (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Blocked Users table
CREATE TABLE blocked_users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- Direct Messages table
CREATE TABLE direct_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(content) BETWEEN 1 AND 2000),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CHECK (sender_id != recipient_id)
);

-- Create indexes for performance
CREATE INDEX idx_prayers_user_id ON prayers(user_id);
CREATE INDEX idx_prayers_created_at ON prayers(created_at DESC);
CREATE INDEX idx_prayers_privacy_level ON prayers(privacy_level);
CREATE INDEX idx_prayers_group_id ON prayers(group_id);
CREATE INDEX idx_prayers_status ON prayers(status);
CREATE INDEX idx_prayers_tags ON prayers USING GIN(tags);
CREATE INDEX idx_prayers_text_search ON prayers USING GIN(to_tsvector('english', text));

CREATE INDEX idx_interactions_prayer_id ON interactions(prayer_id);
CREATE INDEX idx_interactions_user_id ON interactions(user_id);
CREATE INDEX idx_interactions_type ON interactions(type);

CREATE INDEX idx_comments_prayer_id ON comments(prayer_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);

CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);

CREATE INDEX idx_blocked_users_blocker_id ON blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked_id ON blocked_users(blocked_id);

CREATE INDEX idx_direct_messages_sender_id ON direct_messages(sender_id);
CREATE INDEX idx_direct_messages_recipient_id ON direct_messages(recipient_id);
CREATE INDEX idx_direct_messages_created_at ON direct_messages(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prayers_updated_at BEFORE UPDATE ON prayers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create member count trigger function
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Apply member count triggers
CREATE TRIGGER update_group_member_count_trigger
    AFTER INSERT OR DELETE ON group_members
    FOR EACH ROW EXECUTE FUNCTION update_group_member_count();
