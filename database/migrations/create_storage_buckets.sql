-- Create storage buckets for Amenity app
-- Run this in the Supabase SQL Editor

-- Create prayer-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('prayer-images', 'prayer-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create group-avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('group-avatars', 'group-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create comment-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('comment-images', 'comment-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for storage.objects

-- Allow public read access to all buckets
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id IN ('prayer-images', 'avatars', 'group-avatars', 'comment-images') );

-- Allow authenticated users to upload to their own folder in prayer-images
-- Path convention: user_id/filename
CREATE POLICY "Authenticated users can upload prayer images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'prayer-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own prayer images
CREATE POLICY "Authenticated users can update own prayer images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'prayer-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own prayer images
CREATE POLICY "Authenticated users can delete own prayer images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'prayer-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to upload to their own folder in avatars
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatars
CREATE POLICY "Authenticated users can update own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
