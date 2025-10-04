-- ============================================================
-- Safe Schema Creation for Amen App
-- ============================================================
-- This version handles existing types gracefully
-- Run in Supabase SQL Editor
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Drop existing types if they exist (to recreate cleanly)
DROP TYPE IF EXISTS privacy_level CASCADE;
DROP TYPE IF EXISTS location_granularity CASCADE;
DROP TYPE IF EXISTS prayer_status CASCADE;
DROP TYPE IF EXISTS interaction_type CASCADE;
DROP TYPE IF EXISTS reminder_frequency CASCADE;
DROP TYPE IF EXISTS group_privacy CASCADE;
DROP TYPE IF EXISTS member_role CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS ticket_category CASCADE;
DROP TYPE IF EXISTS ticket_priority CASCADE;
DROP TYPE IF EXISTS ticket_status CASCADE;
DROP TYPE IF EXISTS report_reason CASCADE;
DROP TYPE IF EXISTS report_status CASCADE;

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

-- Now create tables
CREATE TABLE IF NOT EXISTS profiles (
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

-- Create prayers table first (without group_id FK)
CREATE TABLE IF NOT EXISTS prayers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text text NOT NULL CHECK (length(text) BETWEEN 10 AND 4000),
  location_city text,
  location_lat double precision,
  location_lon double precision,
  location_granularity location_granularity DEFAULT 'city',
  privacy_level privacy_level DEFAULT 'public',
  status prayer_status DEFAULT 'open',
  group_id uuid,  -- Will add FK constraint after groups table exists
  answered_at timestamptz,
  tags text[] DEFAULT '{}',
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
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

-- Now add the foreign key constraint to prayers
ALTER TABLE prayers
  DROP CONSTRAINT IF EXISTS prayers_group_id_fkey;

ALTER TABLE prayers
  ADD CONSTRAINT prayers_group_id_fkey
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role member_role DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS interactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  prayer_id uuid NOT NULL REFERENCES prayers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type interaction_type NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(prayer_id, user_id, type)
);

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  prayer_id uuid NOT NULL REFERENCES prayers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  text text NOT NULL CHECK (length(text) BETWEEN 1 AND 1000),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  delivered boolean DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS studies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  prayer_id uuid REFERENCES prayers(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL,
  scripture_references text[],
  ai_generated boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category ticket_category NOT NULL,
  priority ticket_priority DEFAULT 'medium',
  status ticket_status DEFAULT 'open',
  subject text NOT NULL,
  description text NOT NULL,
  resolved_at timestamptz,
  satisfaction_rating integer CHECK (satisfaction_rating BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  reported_prayer_id uuid REFERENCES prayers(id) ON DELETE CASCADE,
  reported_comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  reason report_reason NOT NULL,
  description text,
  status report_status DEFAULT 'pending',
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  action_taken text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_analytics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prayers_created integer DEFAULT 0,
  prayers_prayed_for integer DEFAULT 0,
  groups_joined integer DEFAULT 0,
  comments_made integer DEFAULT 0,
  last_updated timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_prayers_user_id ON prayers(user_id);
CREATE INDEX IF NOT EXISTS idx_prayers_group_id ON prayers(group_id);
CREATE INDEX IF NOT EXISTS idx_prayers_created_at ON prayers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayers_privacy ON prayers(privacy_level);
CREATE INDEX IF NOT EXISTS idx_interactions_prayer_id ON interactions(prayer_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_prayer_id ON comments(prayer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can view public prayers" ON prayers FOR SELECT USING (privacy_level = 'public' OR user_id = auth.uid());
CREATE POLICY "Users can create prayers" ON prayers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prayers" ON prayers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prayers" ON prayers FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public groups" ON groups FOR SELECT USING (privacy = 'public' OR creator_id = auth.uid());
CREATE POLICY "Users can create groups" ON groups FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update groups" ON groups FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can view interactions" ON interactions FOR SELECT USING (true);
CREATE POLICY "Users can create interactions" ON interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Refresh PostgREST cache
NOTIFY pgrst, 'reload schema';

-- Success message
SELECT
    'Schema created successfully!' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as tables_created;
