-- Complete SQL Setup for Chat Photos Feature
-- Copy and paste this entire script into Supabase SQL Editor

-- Step 1: Create the storage bucket for chat photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-photos', 'chat-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Add photo_url column to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS photo_url TEXT DEFAULT NULL;

-- Step 3: Create Storage Policies
-- Policy 1: Allow authenticated users to upload photos
CREATE POLICY "Allow authenticated users to upload chat photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-photos');

-- Policy 2: Allow public read access to photos
CREATE POLICY "Allow public read access to chat photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-photos');

-- Policy 3: Allow users to delete their own photos (optional)
CREATE POLICY "Allow users to delete their own chat photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-photos' AND owner = auth.uid());

-- Done! Now you can test photo uploads in the chat
