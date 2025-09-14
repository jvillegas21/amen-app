-- Fix Security Definer Views
-- This script fixes the security definer view errors by recreating the views with SECURITY INVOKER
-- Run this script in your Supabase SQL editor to resolve the linter errors

-- Drop and recreate prayer_feed view with SECURITY INVOKER
DROP VIEW IF EXISTS prayer_feed;

CREATE VIEW prayer_feed 
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

-- Drop and recreate group_activity view with SECURITY INVOKER
DROP VIEW IF EXISTS group_activity;

CREATE VIEW group_activity 
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

-- Grant necessary permissions to ensure the views work correctly
GRANT SELECT ON prayer_feed TO anon, authenticated;
GRANT SELECT ON group_activity TO anon, authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Security definer views fixed successfully!';
    RAISE NOTICE 'Views prayer_feed and group_activity now use SECURITY INVOKER';
    RAISE NOTICE 'This resolves the database linter security errors';
END $$;
