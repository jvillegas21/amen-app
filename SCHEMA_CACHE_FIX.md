# Schema Cache Fix Guide

## Problem
Getting error: `Could not find the table 'public.profiles' in the schema cache`

**What this means:** Your database table exists, but Supabase's REST API hasn't updated its schema cache to include it.

---

## ✅ Quick Fix (5 seconds)

### Option 1: SQL Command (Recommended)

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/wcyyildftjwlnkgvzdee/sql/new

2. **Run this single command:**
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

3. **Wait 5-10 seconds** for cache to refresh

4. **Test your app** - the error should be gone!

---

### Option 2: Automated Script

```bash
node scripts/refresh-postgrest-cache.js
```

This script will:
- Attempt automatic cache refresh
- Verify tables are accessible
- Provide step-by-step guidance if needed

---

### Option 3: Full SQL Script

If the quick fix doesn't work, run the complete script:

```bash
# Copy the contents of this file:
cat scripts/refresh-schema-cache.sql

# Paste into Supabase SQL Editor and run it
```

---

## 🔍 Verify the Fix

**Check if the cache is refreshed:**

```bash
node scripts/verify-schema-cache.js
```

Expected output:
```
✅ profiles            - 0 rows
✅ prayers             - 2 rows
✅ groups              - 0 rows
...
✅ All tables and views are accessible!
```

---

## 🔄 After Fixing

1. **Restart your Expo dev server:**
   ```bash
   npx expo start --clear
   ```

2. **Test login flow** - should work now!

3. **Expected console logs:**
   ```
   ✓ Supabase client initializing...
   🌐 Network request: .../profiles?select=*
   ✓ Response status: 200
   ```

---

## 📊 Understanding the Issue

### What is PostgREST?
Supabase uses PostgREST to provide a REST API for your database. PostgREST caches your database schema for performance.

### Why does the cache get stale?
- After creating/modifying tables
- After restoring from backup
- After switching projects
- Occasionally due to timing issues

### The Fix
`NOTIFY pgrst, 'reload schema'` tells PostgREST to refresh its cache immediately.

---

## 🚨 If Still Not Working

### 1. Check Table Actually Exists

Run in SQL Editor:
```sql
SELECT * FROM profiles LIMIT 1;
```

- **Works:** Cache issue, run `NOTIFY pgrst, 'reload schema'` again
- **Fails:** Table doesn't exist, run schema migrations

### 2. Check Permissions

```sql
-- Verify anon role has access
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name = 'profiles'
AND grantee = 'anon';
```

Should show SELECT permission.

### 3. Check RLS Policies

```sql
-- List policies on profiles table
SELECT *
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'profiles';
```

Should have policy: `Users can view public profiles`

### 4. Manual API Test

```bash
curl "https://wcyyildftjwlnkgvzdee.supabase.co/rest/v1/profiles?select=id&limit=1" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

- **200 response:** Working! ✅
- **404 response:** Cache still stale, wait 30 seconds and try again

---

## 🛠️ Prevention

### Add to Your Workflow

After any database schema changes:

```bash
# 1. Apply schema changes
# 2. Refresh cache
node scripts/refresh-postgrest-cache.js

# 3. Verify
node scripts/verify-schema-cache.js

# 4. Restart app
npx expo start --clear
```

### Create Helper Function

Already included in `scripts/refresh-schema-cache.sql`:

```sql
-- Create once
CREATE OR REPLACE FUNCTION refresh_postgrest_cache()
RETURNS void AS $$
BEGIN
    NOTIFY pgrst, 'reload schema';
END;
$$ LANGUAGE plpgsql;

-- Then use anytime:
SELECT refresh_postgrest_cache();
```

---

## 📝 Common Scenarios

### Scenario 1: Fresh Supabase Project
```bash
1. Run schema migrations
2. Run: NOTIFY pgrst, 'reload schema';
3. Wait 10 seconds
4. Start app
```

### Scenario 2: Cloned Repository
```bash
1. Update .env with your Supabase URL
2. Run: node scripts/verify-schema-cache.js
3. If tables missing: run NOTIFY pgrst, 'reload schema';
4. Start app
```

### Scenario 3: After Schema Changes
```bash
1. Apply migrations
2. Run: node scripts/refresh-postgrest-cache.js
3. Restart app
```

---

## 🔗 Related Issues

- `PGRST205`: Table not in schema cache → Use this guide
- `PGRST116`: Multiple rows returned → Use `.single()` or `.maybeSingle()`
- `PGRST301`: Permission denied → Check RLS policies

---

## 📞 Still Need Help?

1. **Check logs:**
   ```bash
   # See what tables are accessible
   node scripts/verify-schema-cache.js
   ```

2. **Check Supabase Dashboard:**
   - Table Editor: Verify table exists
   - SQL Editor: Run manual queries
   - API Logs: Check for errors

3. **Check app logs:**
   - Look for "schema cache" errors
   - Note which table is missing
   - Verify your .env has correct URL

---

## ✅ Success Checklist

- [ ] Ran `NOTIFY pgrst, 'reload schema';` in SQL Editor
- [ ] Waited 10 seconds
- [ ] Verified with `node scripts/verify-schema-cache.js`
- [ ] All tables show ✅ Accessible
- [ ] Restarted Expo with `--clear` flag
- [ ] Login works without errors
- [ ] App loads data successfully

---

**Remember:** This is a Supabase/PostgREST quirk, not an issue with your app! The fix is simple once you know about it. 🎉
