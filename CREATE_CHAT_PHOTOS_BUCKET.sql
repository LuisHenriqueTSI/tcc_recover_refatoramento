-- SQL Script to create chat-photos bucket
-- Run this in Supabase SQL Editor

-- Create the storage bucket for chat photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-photos', 'chat-photos', true)
ON CONFLICT (id) DO NOTHING;
