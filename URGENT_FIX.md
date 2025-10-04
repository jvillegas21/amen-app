# 🚨 URGENT: Fix Schema Cache Issue

## Current Problem
`profiles` table exists but PostgREST cache won't refresh. Getting PGRST205 error.

---

## ✅ SOLUTION (Do These In Order)

### Option 1: Force Schema Reload (Try This First)

1. **Go to Supabase SQL Editor:**
   https://supabase.com/dashboard/project/wcyyildftjwlnkgvzdee/sql/new

2. **Copy and paste this entire script:**
   ```sql
   -- Force reload
   NOTIFY pgrst, 'reload schema';
   NOTIFY pgrst, 'reload config';

   -- Touch table to force detection
   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS _cache_temp text;
   ALTER TABLE profiles DROP COLUMN IF EXISTS _cache_temp;

   -- Re-grant permissions
   GRANT SELECT ON profiles TO anon, authenticated;

   -- Ensure RLS allows SELECT
   DROP POLICY IF EXISTS "Users can view public profiles" ON profiles;
   CREATE POLICY "Users can view public profiles" ON profiles
       FOR SELECT USING (true);

   -- Final reload
   NOTIFY pgrst, 'reload schema';
   ```

3. **Wait 10 seconds**

4. **Test:**
   ```bash
   curl "https://wcyyildftjwlnkgvzdee.supabase.co/rest/v1/profiles?select=id&limit=1" \
     -H "apikey: YOUR_ANON_KEY"
   ```

---

### Option 2: Restart PostgREST API (Most Effective)

1. **Go to Project Settings → API:**
   https://supabase.com/dashboard/project/wcyyildftjwlnkgvzdee/settings/api

2. **Look for "Restart Server" or "Restart API" button**

3. **Click it and wait 30 seconds**

4. **Test again:**
   ```bash
   node scripts/verify-schema-cache.js
   ```

---

### Option 3: Pause and Unpause Project (Nuclear Option)

1. **Go to Project Settings → General:**
   https://supabase.com/dashboard/project/wcyyildftjwlnkgvzdee/settings/general

2. **Click "Pause project"**

3. **Wait for it to fully pause (30 seconds)**

4. **Click "Resume project"**

5. **Wait for it to fully start (1-2 minutes)**

6. **Test:**
   ```bash
   node scripts/verify-schema-cache.js
   ```

---

### Option 4: Check for Service Issues

1. **Check Supabase Status:**
   https://status.supabase.com

2. **If there's an incident with PostgREST, wait for it to resolve**

---

## 🔍 Verification

After ANY fix above, verify with:

```bash
# Should return data, not PGRST205 error
curl "https://wcyyildftjwlnkgvzdee.supabase.co/rest/v1/profiles?select=id&limit=1" \
  -H "apikey: $(grep EXPO_PUBLIC_SUPABASE_ANON_KEY .env | cut -d= -f2)"
```

Expected: `[]` (empty array) or data
NOT: `{"code":"PGRST205"...}`

---

## 🎯 After It Works

1. **Clear app cache:**
   ```bash
   npx expo start --clear
   ```

2. **Check app logs should show:**
   ```
   🌐 Network request: .../profiles?select=*
   ✓ Response status: 200
   ```

---

## 🤔 Why Is This Happening?

PostgREST (Supabase's REST API) caches your database schema. Sometimes the cache gets stuck and won't refresh even with `NOTIFY` commands.

**Known causes:**
- Timing issues between database and API
- Recent Supabase updates
- High load on Supabase infrastructure
- PostgreSQL version differences

**The fix:** Force a harder refresh (Option 1) or restart the API service (Option 2).

---

## 📊 Debug Info

Your current state:
- ✅ Database: `profiles` table EXISTS (verified)
- ✅ Network: Connection works
- ✅ Permissions: RLS policy allows SELECT
- ❌ PostgREST: Cache doesn't include `profiles`
- ✅ Other tables: `prayers` IS in cache (works)

This confirms it's purely a cache refresh issue.

---

## 🆘 If Nothing Works

Contact Supabase Support:
https://supabase.com/dashboard/support

Provide them:
- Project ref: `wcyyildftjwlnkgvzdee`
- Issue: "PostgREST schema cache won't refresh for profiles table"
- Error: `PGRST205: Could not find the table 'public.profiles' in the schema cache`
- What you tried: "NOTIFY commands, permissions grants, waited 10+ minutes"

They can manually restart PostgREST for your project.
