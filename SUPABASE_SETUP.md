# Supabase Setup & Testing Guide

This guide will help you set up and test your Supabase connection for the Amenity app.

## 🚀 Quick Start

### 1. Set up Environment Variables

```bash
# Run the interactive setup script
npm run setup:env
```

Or manually create a `.env` file in your project root:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration (optional)
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key

# App Configuration
EXPO_PUBLIC_APP_URL=https://your-app-domain.com
EXPO_PUBLIC_APP_NAME=Amenity

# Development
NODE_ENV=development
```

### 2. Set up Database Schema

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the entire content from `database/complete_schema.sql`
4. Click "Run" to create all tables, views, functions, and indexes

### 3. Set up Row Level Security (RLS)

1. In the same SQL Editor
2. Copy and paste the entire content from `database/rls_policies.sql`
3. Click "Run" to set up security policies

### 4. Test the Connection

#### Command Line Test
```bash
# Test Supabase connection from command line
npm run test:supabase
```

#### In-App Test
1. Start your app: `npm start`
2. Navigate to the Supabase Test screen (you'll need to add it to your navigation)
3. Tap "Run Tests" to see comprehensive test results

## 📋 Test Results Explained

### ✅ Connection Tests
- **Basic Connection**: Verifies Supabase client can connect
- **Tables Check**: Ensures all required tables exist and are accessible
- **Views Check**: Verifies database views are working
- **Functions Check**: Tests custom database functions
- **Storage Check**: Confirms file storage is accessible
- **Realtime Check**: Tests WebSocket connection for live updates

### ✅ Data Tests
- **Create Test Profile**: Creates a test user profile
- **Create Test Prayer**: Creates a test prayer request
- **Prayer Feed View**: Tests the prayer feed view functionality

### ✅ Cleanup Tests
- **Cleanup Test Data**: Removes test data after testing

## 🔧 Troubleshooting

### Common Issues

#### 1. "Missing Supabase credentials"
- Make sure your `.env` file exists and has the correct variables
- Run `npm run setup:env` to set up credentials interactively

#### 2. "Table does not exist"
- Make sure you've run the `database/complete_schema.sql` script
- Check that the script completed without errors

#### 3. "RLS policies blocking access"
- Make sure you've run the `database/rls_policies.sql` script
- Verify your user is authenticated if testing authenticated features

#### 4. "Realtime connection failed"
- Check your Supabase project is active and not paused
- Verify your internet connection
- Check Supabase status page for any outages

### Getting Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project (or create a new one)
4. Go to Settings > API
5. Copy the Project URL and anon/public key

## 📱 Adding Test Screen to Your App

To add the Supabase test screen to your app navigation:

### 1. Add to your navigation stack
```typescript
// In your navigation file
import SupabaseTestScreen from '@/screens/settings/SupabaseTestScreen';

// Add to your stack navigator
<Stack.Screen 
  name="SupabaseTest" 
  component={SupabaseTestScreen}
  options={{ title: 'Supabase Test' }}
/>
```

### 2. Add a button to access it
```typescript
// In your settings screen
<TouchableOpacity onPress={() => navigation.navigate('SupabaseTest')}>
  <Text>Test Supabase Connection</Text>
</TouchableOpacity>
```

## 🎯 Expected Results

When everything is set up correctly, you should see:

- ✅ All connection tests passing
- ✅ All tables accessible
- ✅ Views working correctly
- ✅ Functions callable
- ✅ Storage accessible
- ✅ Realtime connection established
- ✅ Test data creation and cleanup working

## 📊 Performance Expectations

- **Connection time**: < 2 seconds
- **Table queries**: < 500ms
- **Realtime connection**: < 5 seconds
- **Test data creation**: < 1 second

## 🔒 Security Notes

- Never commit your `.env` file to version control
- The test scripts create and delete test data automatically
- RLS policies ensure data security in production
- All sensitive operations require authentication

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify your Supabase project is active
3. Check the Supabase status page
4. Review the test output for specific error messages
5. Make sure all database scripts ran successfully

## 🎉 Success!

Once all tests pass, your Supabase connection is properly configured and ready for development!
