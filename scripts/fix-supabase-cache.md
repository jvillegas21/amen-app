# Fix Supabase Schema Cache Error

## Problem
Getting error: `Could not find the table 'public.profiles' in the schema cache`

## Root Cause
Supabase's PostgREST API caches your database schema. When tables exist but aren't in the cache, you get this error.

## Solution

### Option 1: Refresh via SQL Editor (Recommended)
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/wcyyildftjwlnkgvzdee/editor
2. Open SQL Editor
3. Run this SQL:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```
4. Wait 5-10 seconds for cache to refresh
5. Test your app again

### Option 2: Use the Script
1. Copy contents of `scripts/refresh-schema-cache.sql`
2. Paste into Supabase SQL Editor
3. Run it
4. Wait a few seconds

### Option 3: Restart PostgREST API
1. Go to Project Settings → API
2. Click "Restart API" (if available)
3. Wait for restart to complete

### Option 4: Make a Dummy Schema Change
1. Go to Table Editor
2. Select any table (e.g., profiles)
3. Add a temporary column, then delete it
4. This forces schema cache refresh

## Verify Fix

Run this to test:
```bash
node scripts/test-connection.js
```

You should see:
```
✅ Basic Connection: Connected successfully
```

## Additional Checks

If still not working, check:

1. **API is enabled:**
   - Go to Settings → API
   - Ensure "API URL" is active

2. **RLS Policies allow anonymous access:**
   ```sql
   -- Check if RLS is too restrictive
   SELECT schemaname, tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public';
   ```

3. **Anon key has permissions:**
   ```sql
   -- Grant permissions to anon role
   GRANT USAGE ON SCHEMA public TO anon;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
   ```

## Why This Happens

Supabase uses PostgREST which maintains a schema cache for performance. The cache doesn't always update immediately when:
- You create new tables
- You modify table structure
- You restore from backup
- You switch projects

The `NOTIFY pgrst, 'reload schema'` command tells PostgREST to refresh its cache.
