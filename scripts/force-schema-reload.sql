-- ============================================================
-- FORCE PostgREST Schema Reload
-- ============================================================
-- This is the most aggressive approach to refresh the cache
-- ============================================================

-- Method 1: Multiple NOTIFY commands
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst;

-- Method 2: Touch the profiles table to force detection
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS _cache_buster text;
ALTER TABLE profiles DROP COLUMN IF EXISTS _cache_buster;

-- Method 3: Re-grant ALL permissions explicitly
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT ON prayers TO anon;
GRANT SELECT ON prayers TO authenticated;
GRANT SELECT ON groups TO anon;
GRANT SELECT ON groups TO authenticated;

-- Method 4: Ensure RLS is properly configured
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Recreate the SELECT policy
DROP POLICY IF EXISTS "Users can view public profiles" ON profiles;
CREATE POLICY "Users can view public profiles" ON profiles
    FOR SELECT USING (true);

-- Method 5: Send final NOTIFY
NOTIFY pgrst, 'reload schema';

-- Verify profiles table
SELECT COUNT(*) as profile_count FROM profiles;
SELECT 'If you see a count above, profiles table exists!' as status;

-- Final notice
DO $$
BEGIN
    RAISE NOTICE 'Schema reload forced. Wait 10 seconds then test.';
    RAISE NOTICE 'If still not working, restart PostgREST API from dashboard.';
END $$;
