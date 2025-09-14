-- Fix Function Drop Error
-- This script specifically handles the "cannot change return type" error
-- Run this script if you encounter the DROP FUNCTION error

-- Drop the problematic function first
DROP FUNCTION IF EXISTS get_user_feed_prayers(uuid, integer, integer);

-- Now recreate it with the proper search_path setting
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_feed_prayers TO anon, authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Function get_user_feed_prayers recreated successfully with search_path fix!';
END $$;
