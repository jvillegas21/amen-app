# Auth Security Configuration Guide

This document explains how to configure the remaining auth-related security warnings in your Supabase dashboard.

## Remaining Warnings to Configure Manually

### 1. Leaked Password Protection Disabled

**Warning**: `auth_leaked_password_protection`

**Description**: Supabase Auth can prevent the use of compromised passwords by checking against HaveIBeenPwned.org.

**How to Enable**:
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Settings**
3. Scroll down to **Password Protection**
4. Enable **"Check passwords against HaveIBeenPwned"**
5. Save the changes

**Benefits**:
- Prevents users from using passwords that have been compromised in data breaches
- Enhances overall account security
- Reduces risk of credential stuffing attacks

### 2. Insufficient MFA Options

**Warning**: `auth_insufficient_mfa_options`

**Description**: Your project has too few multi-factor authentication (MFA) options enabled.

**How to Enable More MFA Methods**:
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Settings**
3. Scroll down to **Multi-Factor Authentication**
4. Enable additional MFA methods:
   - **TOTP (Time-based One-Time Password)** - Most common, works with apps like Google Authenticator
   - **SMS** - Sends codes via text message
   - **Phone** - Voice call verification
5. Configure the settings for each enabled method
6. Save the changes

**Recommended MFA Methods**:
- **TOTP**: Most secure and user-friendly
- **SMS**: Good for users who prefer text messages
- **Phone**: Backup option for users without smartphones

**Benefits**:
- Significantly reduces account takeover risk
- Protects against password-only attacks
- Industry best practice for sensitive applications

## Implementation in Your App

After enabling these features in the Supabase dashboard, you may need to update your authentication flow:

### For MFA Implementation

```typescript
// Example: Check if user has MFA enabled
const { data: { user } } = await supabase.auth.getUser();

if (user && !user.factors?.length) {
  // Prompt user to enable MFA
  // Redirect to MFA setup page
}

// Example: Enroll user in TOTP MFA
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp'
});
```

### For Password Protection

The leaked password protection works automatically - no code changes needed. Users will see an error message if they try to use a compromised password.

## Security Best Practices

1. **Enable all recommended MFA methods** for maximum user choice
2. **Set up proper error handling** for MFA enrollment and verification
3. **Provide clear user guidance** on how to set up MFA
4. **Consider making MFA mandatory** for admin accounts
5. **Regularly review auth logs** for suspicious activity

## Testing

After configuration:
1. Test MFA enrollment with different methods
2. Test password creation with known compromised passwords
3. Verify error messages are user-friendly
4. Test the complete auth flow end-to-end

## Next Steps

1. Configure these settings in your Supabase dashboard
2. Update your app's authentication UI to support MFA
3. Test the new security features
4. Consider implementing additional security measures like:
   - Rate limiting on auth endpoints
   - Account lockout policies
   - Suspicious activity monitoring
