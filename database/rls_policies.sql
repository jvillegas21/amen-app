-- Row Level Security Policies for Amenity
-- Ensures data privacy and proper access control

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view public profiles" ON profiles;
CREATE POLICY "Users can view public profiles" ON profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Prayers policies
DROP POLICY IF EXISTS "Users can view public prayers" ON prayers;
CREATE POLICY "Users can view public prayers" ON prayers
    FOR SELECT USING (
        privacy_level = 'public' OR
        (privacy_level = 'friends' AND EXISTS (
            SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_id = user_id
        )) OR
        user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Users can view group prayers if member" ON prayers;
CREATE POLICY "Users can view group prayers if member" ON prayers
    FOR SELECT USING (
        group_id IS NULL OR
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = prayers.group_id AND groups.privacy = 'public'
        ) OR
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = prayers.group_id AND groups.creator_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create prayers" ON prayers;
CREATE POLICY "Users can create prayers" ON prayers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own prayers" ON prayers;
CREATE POLICY "Users can update own prayers" ON prayers
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own prayers" ON prayers;
CREATE POLICY "Users can delete own prayers" ON prayers
    FOR DELETE USING (auth.uid() = user_id);

-- Interactions policies
DROP POLICY IF EXISTS "Users can view interactions on visible prayers" ON interactions;
CREATE POLICY "Users can view interactions on visible prayers" ON interactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM prayers 
            WHERE prayers.id = interactions.prayer_id AND (
                prayers.privacy_level = 'public' OR
                prayers.user_id = auth.uid() OR
                (prayers.privacy_level = 'friends' AND EXISTS (
                    SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_id = prayers.user_id
                ))
            )
        )
    );

DROP POLICY IF EXISTS "Users can create interactions" ON interactions;
CREATE POLICY "Users can create interactions" ON interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own interactions" ON interactions;
CREATE POLICY "Users can update own interactions" ON interactions
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own interactions" ON interactions;
CREATE POLICY "Users can delete own interactions" ON interactions
    FOR DELETE USING (auth.uid() = user_id);

-- Studies policies
DROP POLICY IF EXISTS "Users can view public studies" ON studies;
CREATE POLICY "Users can view public studies" ON studies
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create studies" ON studies;
CREATE POLICY "Users can create studies" ON studies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own studies" ON studies;
CREATE POLICY "Users can update own studies" ON studies
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own studies" ON studies;
CREATE POLICY "Users can delete own studies" ON studies
    FOR DELETE USING (auth.uid() = user_id);

-- Groups policies
DROP POLICY IF EXISTS "Users can view public groups" ON groups;
CREATE POLICY "Users can view public groups" ON groups
    FOR SELECT USING (privacy = 'public');

DROP POLICY IF EXISTS "Users can view private groups if member" ON groups;
CREATE POLICY "Users can view private groups if member" ON groups
    FOR SELECT USING (
        privacy = 'private' AND creator_id = auth.uid()
    );

DROP POLICY IF EXISTS "Users can create groups" ON groups;
CREATE POLICY "Users can create groups" ON groups
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Group creators can update groups" ON groups;
CREATE POLICY "Group creators can update groups" ON groups
    FOR UPDATE USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Group creators can delete groups" ON groups;
CREATE POLICY "Group creators can delete groups" ON groups
    FOR DELETE USING (auth.uid() = creator_id);

-- Group Members policies
DROP POLICY IF EXISTS "Users can view group members" ON group_members;
CREATE POLICY "Users can view group members" ON group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_members.group_id AND groups.privacy = 'public'
        ) OR
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_members.group_id 
            AND groups.creator_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can join public groups" ON group_members;
CREATE POLICY "Users can join public groups" ON group_members
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_id AND groups.privacy = 'public'
        )
    );

DROP POLICY IF EXISTS "Group admins can manage members" ON group_members;
CREATE POLICY "Group admins can manage members" ON group_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_members.group_id 
            AND groups.creator_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
CREATE POLICY "Users can leave groups" ON group_members
    FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
DROP POLICY IF EXISTS "Users can view comments on visible prayers" ON comments;
CREATE POLICY "Users can view comments on visible prayers" ON comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM prayers 
            WHERE prayers.id = comments.prayer_id AND (
                prayers.privacy_level = 'public' OR
                prayers.user_id = auth.uid() OR
                (prayers.privacy_level = 'friends' AND EXISTS (
                    SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_id = prayers.user_id
                ))
            )
        )
    );

DROP POLICY IF EXISTS "Users can create comments" ON comments;
CREATE POLICY "Users can create comments" ON comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments" ON comments
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments" ON comments
    FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Support Tickets policies
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
CREATE POLICY "Users can view own tickets" ON support_tickets
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
CREATE POLICY "Users can create tickets" ON support_tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tickets" ON support_tickets;
CREATE POLICY "Users can update own tickets" ON support_tickets
    FOR UPDATE USING (auth.uid() = user_id);

-- Reports policies
DROP POLICY IF EXISTS "Users can create reports" ON reports;
CREATE POLICY "Users can create reports" ON reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can view own reports" ON reports;
CREATE POLICY "Users can view own reports" ON reports
    FOR SELECT USING (auth.uid() = reporter_id);

-- User Analytics policies
DROP POLICY IF EXISTS "Users can create analytics events" ON user_analytics;
CREATE POLICY "Users can create analytics events" ON user_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Follows policies
DROP POLICY IF EXISTS "Users can view follows" ON follows;
CREATE POLICY "Users can view follows" ON follows
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create follows" ON follows;
CREATE POLICY "Users can create follows" ON follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can delete own follows" ON follows;
CREATE POLICY "Users can delete own follows" ON follows
    FOR DELETE USING (auth.uid() = follower_id);

-- Blocked Users policies
DROP POLICY IF EXISTS "Users can view own blocked users" ON blocked_users;
CREATE POLICY "Users can view own blocked users" ON blocked_users
    FOR SELECT USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can block others" ON blocked_users;
CREATE POLICY "Users can block others" ON blocked_users
    FOR INSERT WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can unblock others" ON blocked_users;
CREATE POLICY "Users can unblock others" ON blocked_users
    FOR DELETE USING (auth.uid() = blocker_id);

-- Direct Messages policies
DROP POLICY IF EXISTS "Users can view own messages" ON direct_messages;
CREATE POLICY "Users can view own messages" ON direct_messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can send messages" ON direct_messages;
CREATE POLICY "Users can send messages" ON direct_messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update own messages" ON direct_messages;
CREATE POLICY "Users can update own messages" ON direct_messages
    FOR UPDATE USING (auth.uid() = sender_id);

-- Create functions for complex queries
CREATE OR REPLACE FUNCTION get_user_feed_prayers(user_uuid uuid, limit_count integer DEFAULT 20, offset_count integer DEFAULT 0)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    text text,
    privacy_level privacy_level,
    status prayer_status,
    created_at timestamptz,
    user_display_name text,
    user_avatar_url text,
    interaction_count bigint,
    comment_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.text,
        p.privacy_level,
        p.status,
        p.created_at,
        pr.display_name as user_display_name,
        pr.avatar_url as user_avatar_url,
        COALESCE(ic.interaction_count, 0) as interaction_count,
        COALESCE(cc.comment_count, 0) as comment_count
    FROM prayers p
    JOIN profiles pr ON p.user_id = pr.id
    LEFT JOIN (
        SELECT prayer_id, COUNT(*) as interaction_count
        FROM interactions
        GROUP BY prayer_id
    ) ic ON p.id = ic.prayer_id
    LEFT JOIN (
        SELECT prayer_id, COUNT(*) as comment_count
        FROM comments
        GROUP BY prayer_id
    ) cc ON p.id = cc.prayer_id
    WHERE (
        p.privacy_level = 'public' OR
        p.user_id = user_uuid OR
        (p.privacy_level = 'friends' AND EXISTS (
            SELECT 1 FROM follows WHERE follower_id = user_uuid AND following_id = p.user_id
        ))
    )
    AND NOT EXISTS (
        SELECT 1 FROM blocked_users 
        WHERE (blocker_id = user_uuid AND blocked_id = p.user_id)
        OR (blocker_id = p.user_id AND blocked_id = user_uuid)
    )
    ORDER BY p.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_feed_prayers TO anon, authenticated;
