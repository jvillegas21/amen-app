# Prayer Creation Error Troubleshooting

## 🐛 **Problem**
You're getting a "Failed to create prayer request" error when trying to create a prayer in the app.

## 🔍 **Common Causes & Solutions**

### 1. **Database Schema Not Set Up**
**Symptoms:** Error codes like `42P01` (relation does not exist) or `42703` (column does not exist)

**Solution:**
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the entire content from `database/complete_schema.sql`
4. Click "Run" to create all tables, views, functions, and indexes

### 2. **RLS Policies Not Set Up**
**Symptoms:** Error codes like `42501` (insufficient privilege) or authentication errors

**Solution:**
1. In the same SQL Editor
2. Copy and paste the entire content from `database/rls_policies.sql`
3. Click "Run" to set up Row Level Security policies

### 3. **Authentication Issues**
**Symptoms:** "Not authenticated" errors or user not found

**Solution:**
1. Make sure you're logged in to the app
2. Check that your Supabase credentials are correct in `.env`
3. Verify your user profile exists (should be auto-created)

### 4. **Environment Variables Not Set**
**Symptoms:** Connection errors or "YOUR_SUPABASE_URL" in logs

**Solution:**
```bash
# Run the setup script
npm run setup:env

# Or manually create .env file with your credentials
EXPO_PUBLIC_SUPABASE_URL=your_actual_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
```

## 🧪 **Debug Steps**

### Step 1: Check Database Setup
```typescript
import { checkDatabaseSetup } from '@/utils/debugPrayerCreation';

const setupStatus = await checkDatabaseSetup();
console.log('Database setup status:', setupStatus);
```

### Step 2: Test Prayer Creation
```typescript
import { debugPrayerCreation } from '@/utils/debugPrayerCreation';

const result = await debugPrayerCreation();
console.log('Prayer creation test:', result);
```

### Step 3: Check Console Logs
Look for these error patterns in your console:

- **`42P01`**: Table doesn't exist → Run database schema
- **`42501`**: Permission denied → Run RLS policies  
- **`23505`**: Duplicate key → Profile creation issue
- **`PGRST116`**: No rows found → Profile doesn't exist

## 🔧 **Quick Fixes**

### Fix 1: Run Database Setup
```bash
# 1. Copy database/complete_schema.sql content
# 2. Paste into Supabase SQL Editor
# 3. Click "Run"

# 4. Copy database/rls_policies.sql content  
# 5. Paste into Supabase SQL Editor
# 6. Click "Run"
```

### Fix 2: Test Connection
```bash
npm run test:supabase
```

### Fix 3: Check Environment
```bash
# Make sure your .env file has real credentials
cat .env
```

## 📋 **Verification Checklist**

- [ ] Database schema is created (all tables exist)
- [ ] RLS policies are set up (security enabled)
- [ ] Environment variables are configured
- [ ] User is authenticated and has a profile
- [ ] Supabase project is active (not paused)
- [ ] Network connection is working

## 🚨 **Emergency Debug Mode**

If nothing else works, add this to your CreatePrayerScreen temporarily:

```typescript
import { debugPrayerCreation, checkDatabaseSetup } from '@/utils/debugPrayerCreation';

// Add this button to your screen for testing
<TouchableOpacity onPress={async () => {
  const setup = await checkDatabaseSetup();
  const prayer = await debugPrayerCreation();
  Alert.alert('Debug Results', JSON.stringify({ setup, prayer }, null, 2));
}}>
  <Text>Debug Prayer Creation</Text>
</TouchableOpacity>
```

## 🎯 **Expected Results**

After proper setup, you should see:
- ✅ Database tables created successfully
- ✅ RLS policies applied
- ✅ User authentication working
- ✅ Prayer creation successful
- ✅ No error messages in console

## 📞 **Still Having Issues?**

1. **Check Supabase Dashboard**: Make sure your project is active
2. **Review Console Logs**: Look for specific error codes
3. **Test with Debug Tools**: Use the debug utilities provided
4. **Verify Credentials**: Double-check your Supabase URL and keys

The most common issue is missing database setup - make sure you've run both the schema and RLS policies scripts! 🎉
