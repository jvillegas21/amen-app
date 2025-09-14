# Profile Fetching Error Fix - PGRST116

## 🐛 **Problem**
You were getting a Supabase error when trying to fetch a user profile:
```json
{
  "code": "PGRST116",
  "details": "The result contains 0 rows",
  "hint": null,
  "message": "Cannot coerce the result to a single JSON object"
}
```

## 🔍 **Root Cause**
The error occurred in `ProfileService.getProfile()` method which was using `.single()` instead of `.maybeSingle()`. The `.single()` method expects exactly one row and throws an error when no rows are found, while `.maybeSingle()` returns `null` gracefully when no rows exist.

## ✅ **Solution Applied**

### 1. **Fixed ProfileService.getProfile()**
```typescript
// Before (causing PGRST116 error)
.single();

// After (handles no rows gracefully)
.maybeSingle();
```

### 2. **Added getOrCreateProfile() Method**
```typescript
async getOrCreateProfile(userId: string, userEmail?: string): Promise<Profile> {
  let profile = await this.getProfile(userId);
  
  if (!profile) {
    // Create a basic profile for new users
    const displayName = userEmail ? userEmail.split('@')[0] : 'User';
    
    profile = await this.createProfile({
      id: userId,
      display_name: displayName,
      location_granularity: 'city',
      onboarding_completed: false,
      email_notifications: true,
      push_notifications: true,
    });
  }
  
  return profile;
}
```

### 3. **Updated AuthService**
- Modified `getCurrentSession()` to use `getOrCreateProfile()`
- Modified `signIn()` to use `getOrCreateProfile()`
- Added proper error handling for profile creation failures

## 🧪 **Testing**

### Test the Fix
```bash
# Run the connection test which now includes profile fix validation
npm run test:supabase
```

### Manual Test
```typescript
// This should now return null instead of throwing PGRST116 error
const profile = await profileService.getProfile('non-existent-user-id');
console.log(profile); // null (no error)
```

## 🎯 **Benefits**

1. **No More PGRST116 Errors**: Profile fetching gracefully handles missing profiles
2. **Automatic Profile Creation**: New users get profiles created automatically
3. **Better Error Handling**: Proper fallbacks when profile operations fail
4. **Improved User Experience**: No crashes when profiles don't exist

## 📋 **Files Modified**

- `src/services/api/profileService.ts` - Fixed `.single()` to `.maybeSingle()` and added `getOrCreateProfile()`
- `src/services/auth/authService.ts` - Updated to use `getOrCreateProfile()`
- `scripts/test-connection.js` - Added profile fix validation test
- `src/utils/testProfileFix.ts` - Created comprehensive profile testing utility

## 🚀 **Next Steps**

1. **Test the fix**: Run `npm run test:supabase` to verify the fix works
2. **Set up your database**: Run the schema and RLS policies if you haven't already
3. **Test in your app**: The profile fetching should now work without errors

The PGRST116 error should now be completely resolved! 🎉
