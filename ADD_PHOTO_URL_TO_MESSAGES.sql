-- Add photo_url column to messages table
-- Run this in Supabase SQL Editor

ALTER TABLE messages ADD COLUMN photo_url TEXT DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN messages.photo_url IS 'URL of the photo attached to the message';
