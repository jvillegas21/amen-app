# Profile Duplicate Key Error Fix - 23505

## 🐛 **Problem**
You were getting a Supabase error when trying to log in:
```json
{
  "code": "23505",
  "details": null,
  "hint": null,
  "message": "duplicate key value violates unique constraint \"profiles_pkey\""
}
```

This error occurs when the `getOrCreateProfile` method tries to create a profile with an ID that already exists in the database.

## 🔍 **Root Cause**
The issue was in the `getOrCreateProfile` method in `ProfileService`. The method was:

1. Checking if a profile exists using `getProfile()`
2. If no profile was found, attempting to create a new one
3. But due to race conditions, RLS policy issues, or timing problems, the profile might actually exist but not be found by the query
4. This led to attempting to create a duplicate profile, causing the 23505 error

## ✅ **Solution Applied**

### **Enhanced getOrCreateProfile Method**
```typescript
async getOrCreateProfile(userId: string, userEmail?: string): Promise<Profile> {
  try {
    // First, try to get the existing profile
    let profile = await this.getProfile(userId);
    
    if (profile) {
      return profile;
    }
    
    // If no profile exists, create a new one
    const displayName = userEmail ? userEmail.split('@')[0] : 'User';
    
    try {
      profile = await this.createProfile({
        id: userId,
        display_name: displayName,
        location_granularity: 'city',
        onboarding_completed: false,
        email_notifications: true,
        push_notifications: true,
      });
      return profile;
    } catch (createError: any) {
      // If creation fails due to duplicate key, try to fetch again
      if (createError.code === '23505') {
        console.log('Profile already exists, fetching again...');
        profile = await this.getProfile(userId);
        if (profile) {
          return profile;
        }
      }
      throw createError;
    }
  } catch (error) {
    console.error('Error in getOrCreateProfile:', error);
    throw error;
  }
}
```

### **Enhanced getProfile Method**
```typescript
async getProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching profile:', error);
    return null;
  }
}
```

## 🎯 **What Was Fixed**

1. **Duplicate Key Handling**: Added specific handling for 23505 error code
2. **Retry Logic**: If profile creation fails due to duplicate key, the method now tries to fetch the existing profile
3. **Better Error Handling**: Added try-catch blocks and more detailed error logging
4. **Race Condition Protection**: The method now handles cases where a profile exists but wasn't found in the initial query

## 🧪 **Testing**

### **Debug Utilities Added**
Created `src/utils/debugProfile.ts` with utilities to help debug profile issues:

```typescript
// Check if profile exists and RLS is working
const debugResult = await debugProfile(userId);

// Check current user session
const sessionInfo = await debugCurrentUser();
```

### **Test the Fix**
1. **Try logging in again**: The duplicate key error should now be handled gracefully
2. **Check console logs**: Look for "Profile already exists, fetching again..." message
3. **Use debug utilities**: If issues persist, use the debug functions to investigate

## 🎉 **Benefits**

1. **No More 23505 Errors**: Duplicate key errors are handled gracefully
2. **Race Condition Safe**: Handles timing issues between profile checks and creation
3. **Better Error Recovery**: Automatically retries fetching when creation fails
4. **Improved Logging**: Better error messages for debugging
5. **Robust Profile Management**: More reliable profile creation and retrieval

## 📋 **Files Modified**

- `src/services/api/profileService.ts` - Enhanced `getOrCreateProfile` and `getProfile` methods
- `src/utils/debugProfile.ts` - Added debug utilities for profile troubleshooting

## 🚀 **Next Steps**

1. **Test the login**: Try logging in again - the error should be resolved
2. **Check console**: Look for any remaining error messages
3. **Use debug tools**: If issues persist, use the debug utilities to investigate further

## 🔧 **How It Works**

The enhanced method:
1. **First Attempt**: Tries to get existing profile
2. **Create if Missing**: If no profile found, attempts to create one
3. **Handle Duplicates**: If creation fails with 23505 error, tries to fetch again
4. **Return Result**: Returns the profile (either existing or newly created)
5. **Error Handling**: Provides detailed error information if all attempts fail

The 23505 duplicate key error should now be completely resolved! 🎉
