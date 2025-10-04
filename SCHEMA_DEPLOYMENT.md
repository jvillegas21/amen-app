## 🚀 Production Schema Deployment Guide

Complete step-by-step instructions to deploy your Amen app database schema.

---

## ✅ Prerequisites

- [ ] Supabase project created
- [ ] `.env` file with correct credentials
- [ ] Supabase SQL Editor access

---

## 📋 Deployment Steps

### Step 1: Backup Current Database (If Applicable)

If you have any existing data:

```sql
-- Run in Supabase SQL Editor to export data
-- (Only if you have important data)
```

**Note:** The production schema will DROP ALL existing tables.

### Step 2: Deploy Production Schema

**Option A: Via Supabase Dashboard (Recommended)**

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
   - Replace `YOUR_PROJECT_ID` with your actual project reference

2. **Copy the schema:**
   ```bash
   cat database/production_schema.sql
   ```

3. **Paste into SQL Editor**

4. **Click "Run"** (⌘+Enter or Ctrl+Enter)

5. **Wait for completion** (takes 10-30 seconds)

6. **Check for success message:**
   ```
   Production schema deployed successfully!
   tables_created: 27
   views_created: 2
   enums_created: 13
   ```

**Option B: Via Supabase CLI**

```bash
supabase db reset --db-url YOUR_DATABASE_URL
psql YOUR_DATABASE_URL < database/production_schema.sql
```

### Step 3: Verify Deployment

Run the verification script:

```bash
chmod +x scripts/verify-production-schema.js
node scripts/verify-production-schema.js
```

**Expected output:**
```
🔍 PRODUCTION SCHEMA VERIFICATION
══════════════════════════════════════════════════════════════════════

📊 TABLES (27 expected)

✅ profiles                  - 0 rows
✅ groups                    - 0 rows
✅ prayers                   - 0 rows
...
✅ All 27 tables accessible

📊 VIEWS (2 expected)

✅ prayer_feed               - Accessible
✅ group_activity            - Accessible

⚙️  FUNCTIONS (9 expected)

✅ get_prayer_interaction_counts  - Working
✅ get_user_prayer_stats          - Working
...

═══════════════════════════════════════════════════════════════════
🎉 ALL CHECKS PASSED! Production schema is ready!
═══════════════════════════════════════════════════════════════════
```

### Step 4: Restart Your App

```bash
# Stop any running Expo servers
pkill -f "expo start"

# Clear all caches and restart
npx expo start --clear
```

### Step 5: Test App Functionality

1. **Launch app in simulator/emulator**

2. **Test login flow:**
   - Sign up with new account
   - Should create profile automatically
   - No errors in console

3. **Expected console logs:**
   ```
   ✓ Supabase client initializing...
   🌐 Network request: .../profiles?select=*
   ✓ Response status: 200
   ✓ Profile created successfully
   ```

4. **Test core features:**
   - [ ] Create a prayer
   - [ ] View prayer feed
   - [ ] Add interaction (pray/like)
   - [ ] Join a group
   - [ ] Post comment

---

## 🔍 What This Schema Includes

### Core Tables (27)
- **User Management:** profiles, follows, blocked_users
- **Prayer System:** prayers, interactions, comments
- **Groups:** groups, group_members
- **Bible Studies:** studies, saved_studies
- **Notifications:** notifications, notification_settings, prayer_reminders
- **Support:** support_tickets, support_messages, help_*
- **Analytics:** user_analytics, prayer_analytics, app_analytics
- **Moderation:** reports, content_reports, content_filters
- **Messaging:** direct_messages

### Views (2)
- `prayer_feed` - Optimized prayer feed with user info
- `group_activity` - Group statistics and activity

### Functions (9)
- `get_prayer_interaction_counts()` - Get prayer stats
- `get_user_prayer_stats()` - Get user stats
- `update_updated_at_column()` - Auto-update timestamps
- `update_group_member_count()` - Track member counts
- `generate_invite_code()` - Create group invite codes
- `cleanup_expired_notifications()` - Remove old notifications
- And more...

### Security
- **RLS enabled** on all tables
- **Policies configured** for proper access control
- **Permissions granted** to anon/authenticated roles

---

## ❌ Troubleshooting

### Issue: "Table already exists" errors

**Cause:** Partial previous schema

**Solution:**
```sql
-- Drop all objects first
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Then run production_schema.sql
```

### Issue: "Schema cache" errors after deployment

**Solution:**
```sql
-- Force cache refresh
NOTIFY pgrst, 'reload schema';

-- Or restart PostgREST API from dashboard
```

### Issue: Verification script shows missing tables

**Cause:** Schema didn't complete or cache not refreshed

**Solution:**
1. Check SQL Editor for error messages
2. Re-run production_schema.sql
3. Wait 10 seconds
4. Run verification again

### Issue: RLS blocks all access

**Cause:** User not authenticated

**Solution:**
- RLS policies allow anonymous SELECT on most tables
- For INSERT/UPDATE, user must be authenticated
- Check `auth.uid()` returns valid UUID

---

## 🔄 Re-deploying Schema

If you need to redeploy:

1. **Backup any data you want to keep**

2. **Run production schema again:**
   - It will DROP and recreate everything
   - All data will be lost
   - Fresh start

3. **Verify with script**

4. **Restart app**

---

## 📊 Monitoring

### Check Schema Health

```bash
# Run verification anytime
node scripts/verify-production-schema.js
```

### Check PostgREST Cache

```bash
# Test API access directly
curl "https://YOUR_PROJECT.supabase.co/rest/v1/profiles?select=id&limit=1" \
  -H "apikey: YOUR_ANON_KEY"

# Should return: [] or data (NOT error)
```

### Check RLS Policies

```sql
-- List all policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## ✅ Success Criteria

Your deployment is successful when:

- [ ] ✅ Verification script shows all checks passed
- [ ] ✅ App connects without network errors
- [ ] ✅ Login creates profile successfully
- [ ] ✅ Can create prayers, groups, comments
- [ ] ✅ Views (prayer_feed) return data
- [ ] ✅ No console errors about missing tables

---

## 🆘 Need Help?

### Check These Files:
1. `database/production_schema.sql` - The complete schema
2. `scripts/verify-production-schema.js` - Verification tool
3. `SCHEMA_REBUILD.md` - Technical documentation

### Common Commands:
```bash
# Verify schema
node scripts/verify-production-schema.js

# Test connection
node scripts/diagnose-network.js

# Check specific table
curl "https://YOUR_PROJECT.supabase.co/rest/v1/TABLE_NAME?select=*&limit=1" \
  -H "apikey: YOUR_KEY"
```

---

## 🎉 You're Done!

Once verification passes and app works:

1. ✅ Database schema is complete
2. ✅ All tables, views, functions working
3. ✅ RLS policies protecting data
4. ✅ App ready for development

**Next:** Build your features with confidence! 🚀
