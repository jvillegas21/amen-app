-- Amenity Complete Database Schema
-- Single script to create all tables, types, indexes, and functions
-- Based on comprehensive PRD specifications

-- Create extensions schema for better security
CREATE SCHEMA IF NOT EXISTS extensions;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm" SCHEMA extensions;

-- Create custom types (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE privacy_level AS ENUM ('public', 'friends', 'groups', 'private');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE location_granularity AS ENUM ('hidden', 'city', 'precise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE prayer_status AS ENUM ('open', 'answered', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE interaction_type AS ENUM ('PRAY', 'LIKE', 'SHARE', 'SAVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reminder_frequency AS ENUM ('none', 'daily', 'weekly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE group_privacy AS ENUM ('public', 'private', 'invite_only');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE member_role AS ENUM ('admin', 'moderator', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
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
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_category AS ENUM ('bug', 'feature', 'account', 'content', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_status AS ENUM ('open', 'pending', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_reason AS ENUM ('spam', 'inappropriate', 'harassment', 'false_info', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Core User Management
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
  is_verified boolean DEFAULT false,
  last_active timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Groups table (created before prayers to avoid FK constraint issues)
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

-- Enhanced Prayer Management
CREATE TABLE IF NOT EXISTS prayers (
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

-- Advanced Interaction Tracking
CREATE TABLE IF NOT EXISTS interactions (
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

-- Enhanced Bible Study System
CREATE TABLE IF NOT EXISTS studies (
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

-- Group Members table
CREATE TABLE IF NOT EXISTS group_members (
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
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  prayer_id uuid NOT NULL REFERENCES prayers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  text text NOT NULL CHECK (length(text) BETWEEN 1 AND 1000),
  is_edited boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enhanced Notification System
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  payload jsonb DEFAULT '{}',
  action_url text,
  read boolean DEFAULT false,
  sent_push boolean DEFAULT false,
  sent_email boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days')
);

-- Enhanced Support System
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject text NOT NULL CHECK (length(subject) BETWEEN 5 AND 200),
  description text NOT NULL CHECK (length(description) BETWEEN 10 AND 2000),
  category ticket_category DEFAULT 'other',
  priority ticket_priority DEFAULT 'medium',
  status ticket_status NOT NULL DEFAULT 'open',
  assigned_to uuid REFERENCES profiles(id),
  satisfaction_rating integer CHECK (satisfaction_rating BETWEEN 1 AND 5),
  satisfaction_feedback text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Content Moderation System
CREATE TABLE IF NOT EXISTS reports (
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

-- Analytics and Usage Tracking
CREATE TABLE IF NOT EXISTS user_analytics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  session_id text,
  created_at timestamptz DEFAULT now()
);

-- Following/Followers table (for social features)
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Blocked Users table
CREATE TABLE IF NOT EXISTS blocked_users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- Direct Messages table
CREATE TABLE IF NOT EXISTS direct_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(content) BETWEEN 1 AND 2000),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CHECK (sender_id != recipient_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prayers_user_id ON prayers(user_id);
CREATE INDEX IF NOT EXISTS idx_prayers_created_at ON prayers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayers_privacy_level ON prayers(privacy_level);
CREATE INDEX IF NOT EXISTS idx_prayers_group_id ON prayers(group_id);
CREATE INDEX IF NOT EXISTS idx_prayers_status ON prayers(status);
CREATE INDEX IF NOT EXISTS idx_prayers_tags ON prayers USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_prayers_text_search ON prayers USING GIN(to_tsvector('english', text));
CREATE INDEX IF NOT EXISTS idx_prayers_location ON prayers(location_lat, location_lon) WHERE location_lat IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_interactions_prayer_id ON interactions(prayer_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(type);
CREATE INDEX IF NOT EXISTS idx_interactions_committed_at ON interactions(committed_at);

CREATE INDEX IF NOT EXISTS idx_comments_prayer_id ON comments(prayer_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_role ON group_members(role);

CREATE INDEX IF NOT EXISTS idx_groups_creator_id ON groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_groups_privacy ON groups(privacy);
CREATE INDEX IF NOT EXISTS idx_groups_tags ON groups USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_groups_created_at ON groups(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_studies_prayer_id ON studies(prayer_id);
CREATE INDEX IF NOT EXISTS idx_studies_user_id ON studies(user_id);
CREATE INDEX IF NOT EXISTS idx_studies_featured ON studies(is_featured);
CREATE INDEX IF NOT EXISTS idx_studies_created_at ON studies(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker_id ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_id ON blocked_users(blocked_id);

CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_id ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient_id ON direct_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_unread ON direct_messages(is_read) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_resource ON reports(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_event_type ON user_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_user_analytics_created_at ON user_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_analytics_session_id ON user_analytics(session_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prayers_updated_at ON prayers;
CREATE TRIGGER update_prayers_updated_at BEFORE UPDATE ON prayers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create member count trigger function
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER 
SET search_path = public
AS $$
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
DROP TRIGGER IF EXISTS update_group_member_count_trigger ON group_members;
CREATE TRIGGER update_group_member_count_trigger
    AFTER INSERT OR DELETE ON group_members
    FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- Create function to generate invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS text 
SET search_path = public
AS $$
BEGIN
    RETURN upper(substring(md5(random()::text) from 1 for 8));
END;
$$ language 'plpgsql';

-- Create function to update last_active timestamp
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER 
SET search_path = public
AS $$
BEGIN
    UPDATE profiles SET last_active = now() WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply last_active triggers
DROP TRIGGER IF EXISTS update_last_active_on_prayer ON prayers;
CREATE TRIGGER update_last_active_on_prayer
    AFTER INSERT ON prayers
    FOR EACH ROW EXECUTE FUNCTION update_last_active();

DROP TRIGGER IF EXISTS update_last_active_on_comment ON comments;
CREATE TRIGGER update_last_active_on_comment
    AFTER INSERT ON comments
    FOR EACH ROW EXECUTE FUNCTION update_last_active();

DROP TRIGGER IF EXISTS update_last_active_on_interaction ON interactions;
CREATE TRIGGER update_last_active_on_interaction
    AFTER INSERT ON interactions
    FOR EACH ROW EXECUTE FUNCTION update_last_active();

-- Create function to automatically generate invite codes for new groups
CREATE OR REPLACE FUNCTION set_group_invite_code()
RETURNS TRIGGER 
SET search_path = public
AS $$
BEGIN
    IF NEW.invite_code IS NULL THEN
        NEW.invite_code = generate_invite_code();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_group_invite_code_trigger ON groups;
CREATE TRIGGER set_group_invite_code_trigger
    BEFORE INSERT ON groups
    FOR EACH ROW EXECUTE FUNCTION set_group_invite_code();

-- Create function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void 
SET search_path = public
AS $$
BEGIN
    DELETE FROM notifications WHERE expires_at < now();
END;
$$ language 'plpgsql';

-- Create function to get prayer interaction counts
CREATE OR REPLACE FUNCTION get_prayer_interaction_counts(prayer_uuid uuid)
RETURNS jsonb 
SET search_path = public
AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'pray_count', COALESCE(SUM(CASE WHEN type = 'PRAY' THEN 1 ELSE 0 END), 0),
        'like_count', COALESCE(SUM(CASE WHEN type = 'LIKE' THEN 1 ELSE 0 END), 0),
        'share_count', COALESCE(SUM(CASE WHEN type = 'SHARE' THEN 1 ELSE 0 END), 0),
        'save_count', COALESCE(SUM(CASE WHEN type = 'SAVE' THEN 1 ELSE 0 END), 0)
    ) INTO result
    FROM interactions
    WHERE prayer_id = prayer_uuid;
    
    RETURN result;
END;
$$ language 'plpgsql';

-- Create function to get user's prayer statistics
CREATE OR REPLACE FUNCTION get_user_prayer_stats(user_uuid uuid)
RETURNS jsonb 
SET search_path = public
AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'prayers_posted', COUNT(*),
        'prayers_answered', COUNT(*) FILTER (WHERE status = 'answered'),
        'total_interactions_received', (
            SELECT COUNT(*) FROM interactions i 
            JOIN prayers p ON i.prayer_id = p.id 
            WHERE p.user_id = user_uuid
        ),
        'total_interactions_given', (
            SELECT COUNT(*) FROM interactions 
            WHERE user_id = user_uuid
        )
    ) INTO result
    FROM prayers
    WHERE user_id = user_uuid;
    
    RETURN result;
END;
$$ language 'plpgsql';

-- Create view for prayer feed with user info
CREATE OR REPLACE VIEW prayer_feed 
WITH (security_invoker = true) AS
SELECT 
    p.*,
    pr.display_name,
    pr.avatar_url,
    get_prayer_interaction_counts(p.id) as interaction_counts,
    COUNT(c.id) as comment_count
FROM prayers p
JOIN profiles pr ON p.user_id = pr.id
LEFT JOIN comments c ON p.id = c.prayer_id
WHERE p.privacy_level = 'public'
GROUP BY p.id, pr.display_name, pr.avatar_url;

-- Create view for group activity
CREATE OR REPLACE VIEW group_activity 
WITH (security_invoker = true) AS
SELECT 
    g.*,
    pr.display_name as creator_name,
    pr.avatar_url as creator_avatar,
    COUNT(gm.user_id) as actual_member_count,
    COUNT(p.id) as prayer_count,
    MAX(p.created_at) as last_prayer_at
FROM groups g
JOIN profiles pr ON g.creator_id = pr.id
LEFT JOIN group_members gm ON g.id = gm.group_id
LEFT JOIN prayers p ON g.id = p.group_id
GROUP BY g.id, pr.display_name, pr.avatar_url;

-- Grant necessary permissions (adjust based on your RLS policies)
-- These will be set up in the RLS policies file
GRANT USAGE ON SCHEMA extensions TO anon, authenticated;

-- Add some helpful comments
COMMENT ON TABLE profiles IS 'User profiles with privacy controls and location settings';
COMMENT ON TABLE prayers IS 'Prayer requests with AI integration and privacy levels';
COMMENT ON TABLE interactions IS 'User interactions with prayers (pray, like, share, save)';
COMMENT ON TABLE studies IS 'AI-generated Bible studies linked to prayers';
COMMENT ON TABLE groups IS 'Prayer groups with privacy and member management';
COMMENT ON TABLE notifications IS 'User notifications with expiration and delivery tracking';
COMMENT ON TABLE support_tickets IS 'User support requests with satisfaction tracking';
COMMENT ON TABLE reports IS 'Content moderation reports and actions';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Amenity database schema created successfully!';
    RAISE NOTICE 'Tables created: profiles, groups, prayers, interactions, studies, group_members, comments, notifications, support_tickets, reports, user_analytics, follows, blocked_users, direct_messages';
    RAISE NOTICE 'Indexes, triggers, and functions created for optimal performance';
    RAISE NOTICE 'Next step: Run the RLS policies script to set up Row Level Security';
END $$;
