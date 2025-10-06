-- ============================================
-- FIX RLS POLICIES FOR STUDIES TABLE
-- ============================================
-- This migration fixes the RLS (Row-Level Security) policy error:
-- "new row violates row-level security policy for table 'studies'"
--
-- Error Code: 42501
-- Root Cause: Missing or misconfigured INSERT policy for authenticated users
--
-- To apply: Run this SQL in Supabase Dashboard > SQL Editor
-- ============================================

-- 1. Enable RLS on studies table (if not already enabled)
ALTER TABLE public.studies ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can insert their own studies" ON public.studies;
DROP POLICY IF EXISTS "Users can view all studies" ON public.studies;
DROP POLICY IF EXISTS "Users can update their own studies" ON public.studies;
DROP POLICY IF EXISTS "Users can delete their own studies" ON public.studies;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.studies;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.studies;

-- 3. Create INSERT policy (CRITICAL - this fixes the error)
-- Allows authenticated users to insert studies where user_id matches their auth.uid()
CREATE POLICY "Users can insert their own studies"
ON public.studies
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. Create SELECT policy (allows users to view studies)
-- Currently allows all authenticated users to view all studies
-- To restrict to own studies only, change USING (true) to USING (auth.uid() = user_id)
CREATE POLICY "Users can view all studies"
ON public.studies
FOR SELECT
TO authenticated
USING (true);

-- 5. Create UPDATE policy (allows users to update their own studies)
-- Users can only update studies where they are the owner
CREATE POLICY "Users can update their own studies"
ON public.studies
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Create DELETE policy (allows users to delete their own studies)
-- Users can only delete studies where they are the owner
CREATE POLICY "Users can delete their own studies"
ON public.studies
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this query after the migration to verify all policies exist

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'studies'
ORDER BY cmd, policyname;

-- Expected Results:
-- Should show 4 policies:
-- 1. Users can delete their own studies | DELETE | authenticated | (auth.uid() = user_id)
-- 2. Users can insert their own studies | INSERT | authenticated | (auth.uid() = user_id)
-- 3. Users can view all studies         | SELECT | authenticated | true
-- 4. Users can update their own studies | UPDATE | authenticated | (auth.uid() = user_id)

-- ============================================
-- DIAGNOSTIC QUERIES (Optional)
-- ============================================

-- Check if RLS is enabled (should return relrowsecurity = 't')
-- SELECT relname, relrowsecurity
-- FROM pg_class
-- WHERE relname = 'studies';

-- Check current policies summary
-- SELECT policyname, cmd, with_check
-- FROM pg_policies
-- WHERE tablename = 'studies';
