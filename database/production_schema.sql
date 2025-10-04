-- ============================================================
-- AMEN APP - PRODUCTION DATABASE SCHEMA
-- ============================================================
-- Complete schema with proper dependency ordering
-- Run this ONCE in Supabase SQL Editor for clean setup
-- ============================================================

-- ============================================================
-- PHASE 1: CLEAN SLATE (Drop existing objects)
-- ============================================================

-- Drop views first (depend on tables)
DROP VIEW IF EXISTS prayer_feed CASCADE;
DROP VIEW IF EXISTS group_activity CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_prayer_interaction_counts(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_user_prayer_stats(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_user_feed_prayers(uuid, integer, integer) CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_notifications() CASCADE;
DROP FUNCTION IF EXISTS generate_invite_code() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_group_member_count() CASCADE;
DROP FUNCTION IF EXISTS update_last_active() CASCADE;
DROP FUNCTION IF EXISTS set_group_invite_code() CASCADE;
DROP FUNCTION IF EXISTS refresh_postgrest_cache() CASCADE;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS direct_messages CASCADE;
DROP TABLE IF EXISTS blocked_users CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS notification_settings CASCADE;
DROP TABLE IF EXISTS content_filters CASCADE;
DROP TABLE IF EXISTS content_reports CASCADE;
DROP TABLE IF EXISTS support_messages CASCADE;
DROP TABLE IF EXISTS help_feedback CASCADE;
DROP TABLE IF EXISTS help_articles CASCADE;
DROP TABLE IF EXISTS faq_helpful_votes CASCADE;
DROP TABLE IF EXISTS faq_items CASCADE;
DROP TABLE IF EXISTS help_categories CASCADE;
DROP TABLE IF EXISTS app_analytics CASCADE;
DROP TABLE IF EXISTS prayer_analytics CASCADE;
DROP TABLE IF EXISTS user_analytics CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS prayer_reminders CASCADE;
DROP TABLE IF EXISTS saved_studies CASCADE;
DROP TABLE IF EXISTS studies CASCADE;
DROP TABLE IF EXISTS interactions CASCADE;
DROP TABLE IF EXISTS prayers CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop enum types
DROP TYPE IF EXISTS report_status CASCADE;
DROP TYPE IF EXISTS report_reason CASCADE;
DROP TYPE IF EXISTS ticket_status CASCADE;
DROP TYPE IF EXISTS ticket_priority CASCADE;
DROP TYPE IF EXISTS ticket_category CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS member_role CASCADE;
DROP TYPE IF EXISTS group_privacy CASCADE;
DROP TYPE IF EXISTS reminder_frequency CASCADE;
DROP TYPE IF EXISTS interaction_type CASCADE;
DROP TYPE IF EXISTS prayer_status CASCADE;
DROP TYPE IF EXISTS location_granularity CASCADE;
DROP TYPE IF EXISTS privacy_level CASCADE;

-- ============================================================
-- PHASE 2: FOUNDATION (Extensions & Types)
-- ============================================================

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create enum types
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

-- ============================================================
-- PHASE 3: CORE TABLES (Dependency-ordered)
-- ============================================================

-- 1. PROFILES (Foundation - referenced by everything)
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

-- 2. GROUPS (Referenced by prayers)
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

-- 3. PRAYERS (Core entity)
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

-- 4. INTERACTIONS (Prayer interactions)
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

-- 5. STUDIES (Bible studies)
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

-- 6. SAVED_STUDIES
CREATE TABLE saved_studies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  study_id uuid NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, study_id)
);

-- 7. PRAYER_REMINDERS
CREATE TABLE prayer_reminders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prayer_id uuid NOT NULL REFERENCES prayers(id) ON DELETE CASCADE,
  frequency reminder_frequency DEFAULT 'daily',
  next_reminder_at timestamptz,
  last_reminded_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 8. GROUP_MEMBERS
CREATE TABLE group_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role member_role DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- 9. COMMENTS
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  prayer_id uuid NOT NULL REFERENCES prayers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  text text NOT NULL CHECK (length(text) BETWEEN 1 AND 1000),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 10. NOTIFICATIONS
CREATE TABLE notifications (
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

-- 11. SUPPORT_TICKETS
CREATE TABLE support_tickets (
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

-- 12. SUPPORT_MESSAGES
CREATE TABLE support_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  message text NOT NULL,
  is_staff_reply boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 13. REPORTS
CREATE TABLE reports (
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

-- 14. CONTENT_REPORTS (duplicate of reports for moderation)
CREATE TABLE content_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('prayer', 'comment', 'profile', 'group')),
  content_id uuid NOT NULL,
  reason report_reason NOT NULL,
  description text,
  status report_status DEFAULT 'pending',
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  moderator_notes text,
  created_at timestamptz DEFAULT now()
);

-- 15. USER_ANALYTICS
CREATE TABLE user_analytics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prayers_created integer DEFAULT 0,
  prayers_prayed_for integer DEFAULT 0,
  groups_joined integer DEFAULT 0,
  comments_made integer DEFAULT 0,
  last_updated timestamptz DEFAULT now()
);

-- 16. PRAYER_ANALYTICS
CREATE TABLE prayer_analytics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  prayer_id uuid NOT NULL REFERENCES prayers(id) ON DELETE CASCADE,
  views integer DEFAULT 0,
  unique_viewers integer DEFAULT 0,
  pray_count integer DEFAULT 0,
  like_count integer DEFAULT 0,
  share_count integer DEFAULT 0,
  save_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  last_updated timestamptz DEFAULT now()
);

-- 17. APP_ANALYTICS
CREATE TABLE app_analytics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL UNIQUE,
  daily_active_users integer DEFAULT 0,
  new_users integer DEFAULT 0,
  prayers_created integer DEFAULT 0,
  interactions_made integer DEFAULT 0,
  groups_created integer DEFAULT 0,
  studies_generated integer DEFAULT 0,
  support_tickets_created integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 18. HELP_CATEGORIES
CREATE TABLE help_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  icon text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 19. FAQ_ITEMS
CREATE TABLE faq_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id uuid REFERENCES help_categories(id) ON DELETE SET NULL,
  question text NOT NULL,
  answer text NOT NULL,
  display_order integer DEFAULT 0,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 20. FAQ_HELPFUL_VOTES
CREATE TABLE faq_helpful_votes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  faq_id uuid NOT NULL REFERENCES faq_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (faq_id, user_id)
);

-- 21. HELP_ARTICLES
CREATE TABLE help_articles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id uuid REFERENCES help_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  content_md text NOT NULL,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 22. HELP_FEEDBACK
CREATE TABLE help_feedback (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id uuid REFERENCES help_articles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  was_helpful boolean NOT NULL,
  feedback_text text,
  created_at timestamptz DEFAULT now()
);

-- 23. NOTIFICATION_SETTINGS
CREATE TABLE notification_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  prayer_prayed_for boolean DEFAULT true,
  prayer_commented boolean DEFAULT true,
  prayer_answered boolean DEFAULT true,
  group_invite boolean DEFAULT true,
  group_joined boolean DEFAULT true,
  group_prayer_added boolean DEFAULT true,
  study_featured boolean DEFAULT true,
  ticket_updated boolean DEFAULT true,
  system_announcement boolean DEFAULT true,
  moderation_action boolean DEFAULT true,
  email_enabled boolean DEFAULT true,
  push_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 24. CONTENT_FILTERS
CREATE TABLE content_filters (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  word text NOT NULL UNIQUE,
  severity text NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
  action text NOT NULL CHECK (action IN ('flag', 'block', 'review')),
  created_at timestamptz DEFAULT now()
);

-- 25. FOLLOWS
CREATE TABLE follows (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- 26. BLOCKED_USERS
CREATE TABLE blocked_users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- 27. DIRECT_MESSAGES
CREATE TABLE direct_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(content) BETWEEN 1 AND 2000),
  read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CHECK (sender_id != recipient_id)
);

-- ============================================================
-- PHASE 4: INDEXES (Performance optimization)
-- ============================================================

-- Profiles indexes
CREATE INDEX idx_profiles_display_name ON profiles(display_name);
CREATE INDEX idx_profiles_last_active ON profiles(last_active DESC);

-- Prayers indexes
CREATE INDEX idx_prayers_user_id ON prayers(user_id);
CREATE INDEX idx_prayers_group_id ON prayers(group_id);
CREATE INDEX idx_prayers_created_at ON prayers(created_at DESC);
CREATE INDEX idx_prayers_privacy ON prayers(privacy_level);
CREATE INDEX idx_prayers_status ON prayers(status);

-- Interactions indexes
CREATE INDEX idx_interactions_prayer_id ON interactions(prayer_id);
CREATE INDEX idx_interactions_user_id ON interactions(user_id);
CREATE INDEX idx_interactions_type ON interactions(type);

-- Comments indexes
CREATE INDEX idx_comments_prayer_id ON comments(prayer_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Group members indexes
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);

-- Groups indexes
CREATE INDEX idx_groups_creator_id ON groups(creator_id);
CREATE INDEX idx_groups_privacy ON groups(privacy);

-- ============================================================
-- PHASE 5: FUNCTIONS & TRIGGERS
-- ============================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function: Generate invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS text AS $$
BEGIN
    RETURN upper(substring(md5(random()::text) from 1 for 8));
END;
$$ language 'plpgsql';

-- Function: Update group member count
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

-- Function: Update last_active
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles SET last_active = now() WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function: Set group invite code
CREATE OR REPLACE FUNCTION set_group_invite_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invite_code IS NULL THEN
        NEW.invite_code = generate_invite_code();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function: Get prayer interaction counts
CREATE OR REPLACE FUNCTION get_prayer_interaction_counts(prayer_uuid uuid)
RETURNS jsonb AS $$
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

-- Function: Get personalized prayer feed for following users
CREATE OR REPLACE FUNCTION get_user_feed_prayers(
    user_uuid uuid,
    limit_count integer DEFAULT 20,
    offset_count integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    text text,
    privacy_level privacy_level,
    location_city text,
    location_lat double precision,
    location_lon double precision,
    location_granularity location_granularity,
    group_id uuid,
    status prayer_status,
    is_anonymous boolean,
    tags text[],
    images text[],
    created_at timestamptz,
    updated_at timestamptz,
    expires_at timestamptz,
    display_name text,
    avatar_url text,
    interaction_counts jsonb,
    comment_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.user_id,
        p.text,
        p.privacy_level,
        p.location_city,
        p.location_lat,
        p.location_lon,
        p.location_granularity,
        p.group_id,
        p.status,
        p.is_anonymous,
        p.tags,
        p.images,
        p.created_at,
        p.updated_at,
        p.expires_at,
        pr.display_name,
        pr.avatar_url,
        get_prayer_interaction_counts(p.id) AS interaction_counts,
        COUNT(c.id) AS comment_count
    FROM prayers p
    JOIN profiles pr ON p.user_id = pr.id
    LEFT JOIN comments c ON p.id = c.prayer_id
    WHERE (
        p.privacy_level = 'public'
        OR p.user_id = user_uuid
        OR p.user_id IN (
            SELECT following_id FROM follows WHERE follower_id = user_uuid
        )
        OR (
            p.group_id IS NOT NULL
            AND p.group_id IN (
                SELECT gm.group_id FROM group_members gm WHERE gm.user_id = user_uuid
            )
        )
    )
    AND NOT EXISTS (
        SELECT 1
        FROM blocked_users bu
        WHERE (bu.blocker_id = user_uuid AND bu.blocked_id = p.user_id)
           OR (bu.blocker_id = p.user_id AND bu.blocked_id = user_uuid)
    )
    GROUP BY
        p.id,
        pr.display_name,
        pr.avatar_url
    ORDER BY p.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;

-- Function: Get user prayer stats
CREATE OR REPLACE FUNCTION get_user_prayer_stats(user_uuid uuid)
RETURNS jsonb AS $$
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

-- Function: Cleanup expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM notifications WHERE expires_at < now();
END;
$$ language 'plpgsql';

-- Function: Refresh PostgREST cache
CREATE OR REPLACE FUNCTION refresh_postgrest_cache()
RETURNS void AS $$
BEGIN
    NOTIFY pgrst, 'reload schema';
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prayers_updated_at BEFORE UPDATE ON prayers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_group_member_count_trigger AFTER INSERT OR DELETE ON group_members FOR EACH ROW EXECUTE FUNCTION update_group_member_count();
CREATE TRIGGER set_group_invite_code_trigger BEFORE INSERT ON groups FOR EACH ROW EXECUTE FUNCTION set_group_invite_code();
CREATE TRIGGER update_last_active_on_prayer AFTER INSERT ON prayers FOR EACH ROW EXECUTE FUNCTION update_last_active();
CREATE TRIGGER update_last_active_on_comment AFTER INSERT ON comments FOR EACH ROW EXECUTE FUNCTION update_last_active();
CREATE TRIGGER update_last_active_on_interaction AFTER INSERT ON interactions FOR EACH ROW EXECUTE FUNCTION update_last_active();

-- ============================================================
-- PHASE 6: VIEWS
-- ============================================================

-- Prayer feed view
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

-- Group activity view
CREATE OR REPLACE VIEW group_activity
WITH (security_invoker = true) AS
SELECT
    g.*,
    pr.display_name as creator_name,
    pr.avatar_url as creator_avatar,
    COUNT(DISTINCT gm.user_id) as actual_member_count,
    COUNT(DISTINCT p.id) as prayer_count,
    MAX(p.created_at) as last_prayer_at
FROM groups g
JOIN profiles pr ON g.creator_id = pr.id
LEFT JOIN group_members gm ON g.id = gm.group_id
LEFT JOIN prayers p ON g.id = p.group_id
GROUP BY g.id, pr.display_name, pr.avatar_url;

-- ============================================================
-- PHASE 7: ROW LEVEL SECURITY
-- ============================================================

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
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Prayers policies
CREATE POLICY "Anyone can view public prayers" ON prayers FOR SELECT USING (
    privacy_level = 'public' OR user_id = auth.uid()
);
CREATE POLICY "Users can create prayers" ON prayers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prayers" ON prayers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prayers" ON prayers FOR DELETE USING (auth.uid() = user_id);

-- Groups policies
CREATE POLICY "Anyone can view public groups" ON groups FOR SELECT USING (privacy = 'public' OR creator_id = auth.uid());
CREATE POLICY "Users can create groups" ON groups FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update groups" ON groups FOR UPDATE USING (auth.uid() = creator_id);

-- Interactions policies
CREATE POLICY "Users can view interactions" ON interactions FOR SELECT USING (true);
CREATE POLICY "Users can create interactions" ON interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own interactions" ON interactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own interactions" ON interactions FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Users can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Studies policies
CREATE POLICY "Anyone can view studies" ON studies FOR SELECT USING (true);

-- Group members policies
CREATE POLICY "Anyone can view group members" ON group_members FOR SELECT USING (true);
CREATE POLICY "Users can join groups" ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- PHASE 8: PERMISSIONS
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ============================================================
-- PHASE 9: FINALIZE
-- ============================================================

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Verification query
SELECT
    'Production schema deployed successfully!' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as tables_created,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public') as views_created,
    (SELECT COUNT(*) FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typtype = 'e') as enums_created;
