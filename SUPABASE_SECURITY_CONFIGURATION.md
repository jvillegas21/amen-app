# Supabase Security Configuration Guide

## 🔒 Critical Security Settings to Configure

This guide outlines the essential security configurations that must be set up in your Supabase dashboard before app store submission.

### 1. Enable Multi-Factor Authentication (MFA)

**Location:** Authentication → Settings → Multi-Factor Authentication

#### Required Actions:
1. **Enable TOTP (Time-based One-Time Password)**
   - ✅ Most secure and user-friendly option
   - Works with Google Authenticator, Authy, etc.
   - Set as primary MFA method

2. **Enable SMS Authentication**
   - ✅ Good for users who prefer text messages
   - Configure SMS provider (Twilio recommended)
   - Set up rate limiting for SMS

3. **Enable Phone Authentication**
   - ✅ Backup option for users without smartphones
   - Configure voice call provider
   - Set up rate limiting

#### Implementation in App:
```typescript
// Check if user has MFA enabled
const { data: { user } } = await supabase.auth.getUser();

if (user && !user.factors?.length) {
  // Prompt user to enable MFA
  // Redirect to MFA setup page
}

// Enroll user in TOTP MFA
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp'
});
```

### 2. Enable Leaked Password Protection

**Location:** Authentication → Settings → Password Protection

#### Required Actions:
1. **Enable "Check passwords against HaveIBeenPwned"**
   - ✅ Prevents use of compromised passwords
   - Reduces credential stuffing attacks
   - Works automatically - no code changes needed

#### Benefits:
- Users will see error message if they try to use a compromised password
- Enhances overall account security
- Reduces risk of account takeovers

### 3. Configure Rate Limiting

**Location:** Authentication → Settings → Rate Limiting

#### Required Settings:
1. **Sign-in attempts:** 5 attempts per 15 minutes
2. **Password reset requests:** 3 attempts per hour
3. **MFA attempts:** 5 attempts per 15 minutes
4. **Account creation:** 3 attempts per hour

### 4. Set Up Account Lockout Policies

**Location:** Authentication → Settings → Account Lockout

#### Recommended Settings:
1. **Enable account lockout after failed attempts**
2. **Lockout duration:** 15 minutes
3. **Failed attempt threshold:** 5 attempts
4. **Enable progressive delays:** Yes

### 5. Configure Session Management

**Location:** Authentication → Settings → Session Management

#### Required Settings:
1. **Session timeout:** 24 hours (default)
2. **Refresh token rotation:** Enabled
3. **Refresh token reuse detection:** Enabled
4. **JWT expiry:** 1 hour (default)

### 6. Set Up Email Templates

**Location:** Authentication → Settings → Email Templates

#### Required Templates:
1. **Confirm signup** - Customize with your branding
2. **Reset password** - Include security warnings
3. **Magic link** - For passwordless authentication
4. **Change email address** - For email updates

### 7. Configure OAuth Providers

**Location:** Authentication → Settings → OAuth Providers

#### Google OAuth:
1. **Enable Google provider**
2. **Configure OAuth consent screen**
3. **Set authorized redirect URIs**
4. **Enable profile and email scopes**

#### Apple OAuth:
1. **Enable Apple provider**
2. **Configure Apple Developer account**
3. **Set up Service ID**
4. **Configure key and certificate**

### 8. Set Up Row Level Security (RLS) Policies

**Location:** Database → Tables → [Table Name] → RLS

#### Verify RLS is enabled on all tables:
- ✅ profiles
- ✅ prayers
- ✅ interactions
- ✅ studies
- ✅ groups
- ✅ group_members
- ✅ comments
- ✅ notifications
- ✅ support_tickets
- ✅ reports
- ✅ user_analytics
- ✅ follows
- ✅ blocked_users
- ✅ direct_messages

### 9. Configure API Security

**Location:** Settings → API

#### Required Settings:
1. **Enable API key restrictions**
2. **Set up CORS policies**
3. **Configure rate limiting for API calls**
4. **Enable request logging**

### 10. Set Up Monitoring and Alerts

**Location:** Settings → Monitoring

#### Required Monitoring:
1. **Failed authentication attempts**
2. **Suspicious login patterns**
3. **API rate limit violations**
4. **Database query performance**
5. **Storage usage alerts**

## 🚨 Security Checklist

### Before App Store Submission:
- [ ] MFA enabled (TOTP, SMS, Phone)
- [ ] Leaked password protection enabled
- [ ] Rate limiting configured
- [ ] Account lockout policies set
- [ ] Session management configured
- [ ] Email templates customized
- [ ] OAuth providers configured
- [ ] RLS policies verified
- [ ] API security configured
- [ ] Monitoring and alerts set up

### Testing Checklist:
- [ ] Test MFA enrollment flow
- [ ] Test password reset with compromised password
- [ ] Test rate limiting behavior
- [ ] Test account lockout functionality
- [ ] Test OAuth flows (Google, Apple)
- [ ] Verify RLS policies work correctly
- [ ] Test API rate limiting
- [ ] Verify monitoring alerts work

## 📱 App Implementation Updates

### 1. Add MFA Support to Auth Service

```typescript
// Add to authService.ts
async enableMFA(): Promise<{ qrCode: string; secret: string }> {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp'
  });
  
  if (error) throw error;
  return data;
}

async verifyMFA(token: string): Promise<void> {
  const { error } = await supabase.auth.mfa.verify({
    factorId: 'current-factor-id',
    code: token
  });
  
  if (error) throw error;
}
```

### 2. Add Security Settings Screen

```typescript
// Create SecuritySettingsScreen.tsx
export const SecuritySettingsScreen = () => {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  
  const handleEnableMFA = async () => {
    try {
      const { qrCode, secret } = await authService.enableMFA();
      // Show QR code for user to scan
    } catch (error) {
      // Handle error
    }
  };
  
  return (
    <View>
      <Text>Multi-Factor Authentication</Text>
      <Switch 
        value={mfaEnabled} 
        onValueChange={handleEnableMFA}
      />
    </View>
  );
};
```

### 3. Add Security Monitoring

```typescript
// Add to monitoringService.ts
export const securityMonitoring = {
  trackFailedLogin: (email: string, reason: string) => {
    analyticsService.trackEvent('security_failed_login', {
      email: email.substring(0, 3) + '***', // Anonymize
      reason,
      timestamp: new Date().toISOString()
    });
  },
  
  trackSuspiciousActivity: (userId: string, activity: string) => {
    analyticsService.trackEvent('security_suspicious_activity', {
      userId,
      activity,
      timestamp: new Date().toISOString()
    });
  }
};
```

## 🔍 Security Testing

### 1. Penetration Testing
- Test authentication bypass attempts
- Test SQL injection on custom queries
- Test XSS in user-generated content
- Test CSRF on state-changing operations

### 2. Load Testing
- Test rate limiting under load
- Test MFA performance under load
- Test session management under load
- Test database performance under load

### 3. Security Scanning
- Run OWASP ZAP security scan
- Test for common vulnerabilities
- Verify HTTPS enforcement
- Check for information disclosure

## 📊 Security Metrics

### Key Performance Indicators:
- **Authentication success rate:** >95%
- **MFA adoption rate:** >80%
- **Failed login attempts:** <5% of total
- **Account lockouts:** <1% of users
- **Security incidents:** 0 critical

### Monitoring Dashboard:
- Real-time authentication metrics
- Failed login attempt patterns
- MFA usage statistics
- API rate limit violations
- Security alert notifications

## 🚀 Deployment Checklist

### Production Deployment:
- [ ] All security settings configured
- [ ] Monitoring and alerts active
- [ ] Security testing completed
- [ ] Penetration testing passed
- [ ] Load testing completed
- [ ] Security documentation updated
- [ ] Team trained on security procedures
- [ ] Incident response plan ready

---

**⚠️ IMPORTANT:** These security configurations are critical for app store approval and user safety. Complete all items before submitting to app stores.

**📞 Support:** If you need help with any of these configurations, refer to the [Supabase Security Documentation](https://supabase.com/docs/guides/auth) or contact Supabase support.