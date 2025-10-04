-- ============================================================
-- Refresh Supabase PostgREST Schema Cache
-- ============================================================
-- Run this when you get "table not found in schema cache" errors
-- Supabase Dashboard: https://supabase.com/dashboard/sql/new
-- ============================================================

-- QUICK FIX: Just run this one command (most effective)
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- If the above doesn't work, run the full script below
-- ============================================================

-- Step 1: Verify tables exist
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('profiles', 'prayers', 'groups', 'notifications');

    RAISE NOTICE 'Found % core tables in database', table_count;

    IF table_count < 4 THEN
        RAISE WARNING 'Some tables are missing! Expected 4, found %', table_count;
    END IF;
END $$;

-- Step 2: Ensure anon role has permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Step 3: Verify permissions were granted
DO $$
BEGIN
    RAISE NOTICE 'Permissions granted to anon and authenticated roles';
END $$;

-- Step 4: Trigger cache reload again
NOTIFY pgrst, 'reload schema';

-- Step 5: Create a helper function for future refreshes (optional)
CREATE OR REPLACE FUNCTION refresh_postgrest_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Send notification to PostgREST
    NOTIFY pgrst, 'reload schema';

    -- Log the action
    RAISE NOTICE 'PostgREST schema cache refresh triggered at %', NOW();
END;
$$;

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION refresh_postgrest_cache() TO anon, authenticated;

-- ============================================================
-- Verification Queries
-- ============================================================

-- Check what tables PostgREST can see
SELECT
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check RLS policies on profiles table
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'profiles'
ORDER BY policyname;

-- Final status
SELECT
    'Schema refresh complete! Wait 5-10 seconds, then test your app.' as status,
    NOW() as refreshed_at;
