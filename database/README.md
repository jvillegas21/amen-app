# Amenity Database Setup

This directory contains the database schema and setup files for the Amenity app.

## Files

- `schema.sql` - Complete database schema with tables, indexes, and triggers
- `rls_policies.sql` - Row Level Security policies for data protection
- `README.md` - This setup guide

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon key
3. Create a `.env` file in your project root with:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key
```

### 2. Run Database Schema

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `schema.sql` and run it
4. Copy and paste the contents of `rls_policies.sql` and run it

### 3. Configure Storage Buckets

Create the following storage buckets in Supabase:

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('avatars', 'avatars', true),
('prayer-images', 'prayer-images', true),
('group-avatars', 'group-avatars', true);

-- Set up storage policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Prayer images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'prayer-images');

CREATE POLICY "Users can upload prayer images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'prayer-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Group avatars are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'group-avatars');

CREATE POLICY "Group admins can upload group avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'group-avatars' AND 
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_id::text = (storage.foldername(name))[1] 
    AND user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);
```

### 4. Set up Authentication

In your Supabase project settings:

1. Go to Authentication > Settings
2. Configure your site URL (e.g., `http://localhost:8081` for development)
3. Add redirect URLs for your app
4. Enable email confirmations
5. Configure OAuth providers (Google, Apple) if needed

### 5. Test the Setup

Run this query to verify everything is working:

```sql
-- Test query
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

All tables should show `rowsecurity = true`.

## Database Features

### Security
- Row Level Security (RLS) enabled on all tables
- Comprehensive access policies
- User data isolation
- Privacy controls for prayers and groups

### Performance
- Optimized indexes for common queries
- Full-text search on prayer content
- Efficient feed queries with pagination
- Triggers for maintaining data consistency

### Features
- User profiles with privacy controls
- Prayer system with interactions and comments
- Group management with roles
- Bible study generation and storage
- Notification system
- Support ticket system
- Direct messaging
- User blocking and following
- Analytics tracking

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**: Make sure all policies are created correctly and users have proper permissions
2. **Storage Access**: Verify storage buckets and policies are set up correctly
3. **Authentication**: Check that auth settings match your app configuration

### Useful Queries

```sql
-- Check user permissions
SELECT * FROM pg_roles WHERE rolname = 'authenticated';

-- View all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Check storage buckets
SELECT * FROM storage.buckets;
```

## Next Steps

After setting up the database:

1. Update your app's environment variables
2. Test authentication flow
3. Implement the remaining screens and services
4. Set up push notifications
5. Configure analytics and monitoring
