-- ============================================================
-- Create Missing Views for Amen App
-- ============================================================
-- Run this in Supabase SQL Editor if you get view errors
-- ============================================================

-- Create prayer_feed view
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

-- Create group_activity view
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

-- Grant permissions
GRANT SELECT ON prayer_feed TO anon, authenticated;
GRANT SELECT ON group_activity TO anon, authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Views created successfully!' as status;
