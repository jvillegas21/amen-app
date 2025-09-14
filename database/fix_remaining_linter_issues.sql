-- Fix Remaining Database Linter Issues
-- This script addresses all remaining security warnings from the database linter

-- 1. Fix Function Search Path Mutable Warnings
-- Add SET search_path to all functions to prevent search path manipulation attacks

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Fix update_group_member_count function
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

-- Fix generate_invite_code function
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS text 
SET search_path = public
AS $$
BEGIN
    RETURN upper(substring(md5(random()::text) from 1 for 8));
END;
$$ language 'plpgsql';

-- Fix update_last_active function
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER 
SET search_path = public
AS $$
BEGIN
    UPDATE profiles SET last_active = now() WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Fix set_group_invite_code function
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

-- Fix cleanup_expired_notifications function
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void 
SET search_path = public
AS $$
BEGIN
    DELETE FROM notifications WHERE expires_at < now();
END;
$$ language 'plpgsql';

-- Fix get_prayer_interaction_counts function
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

-- Fix get_user_prayer_stats function
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

-- Fix get_user_feed_prayers function (from RLS policies)
-- Drop the existing function first since we're changing the return type
DROP FUNCTION IF EXISTS get_user_feed_prayers(uuid, integer, integer);

CREATE OR REPLACE FUNCTION get_user_feed_prayers(user_uuid uuid, limit_count integer DEFAULT 20, offset_count integer DEFAULT 0)
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
        get_prayer_interaction_counts(p.id) as interaction_counts,
        COUNT(c.id) as comment_count
    FROM prayers p
    JOIN profiles pr ON p.user_id = pr.id
    LEFT JOIN comments c ON p.id = c.prayer_id
    WHERE p.privacy_level = 'public'
    AND (
        p.user_id = user_uuid
        OR p.user_id IN (
            SELECT following_id FROM follows WHERE follower_id = user_uuid
        )
        OR p.group_id IN (
            SELECT gm.group_id FROM group_members gm WHERE gm.user_id = user_uuid
        )
    )
    AND NOT EXISTS (
        SELECT 1 FROM blocked_users 
        WHERE (blocker_id = user_uuid AND blocked_id = p.user_id)
        OR (blocker_id = p.user_id AND blocked_id = user_uuid)
    )
    GROUP BY p.id, pr.display_name, pr.avatar_url
    ORDER BY p.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- 2. Fix Extension in Public Schema Warning
-- Create a dedicated schema for extensions and move pg_trgm there

-- Create extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pg_trgm extension to extensions schema
-- Note: This requires dropping and recreating the extension
-- First, drop any dependencies
DROP INDEX IF EXISTS idx_prayers_text_search;
DROP INDEX IF EXISTS idx_prayers_tags;

-- Drop the extension from public schema
DROP EXTENSION IF EXISTS pg_trgm;

-- Create the extension in the extensions schema
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- Recreate the indexes using the extension from the new schema
CREATE INDEX IF NOT EXISTS idx_prayers_tags ON prayers USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_prayers_text_search ON prayers USING GIN(to_tsvector('english', text));

-- Grant usage on the extensions schema
GRANT USAGE ON SCHEMA extensions TO anon, authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database linter issues fixed successfully!';
    RAISE NOTICE 'All functions now have SET search_path = public';
    RAISE NOTICE 'pg_trgm extension moved to extensions schema';
    RAISE NOTICE 'Remaining auth-related warnings need manual configuration in Supabase dashboard';
END $$;
