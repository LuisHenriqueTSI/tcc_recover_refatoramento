# Chat Photos Feature - Setup Instructions

## Overview
This feature allows users to send photos directly in the chat system.

## Changes Made

### Frontend (Chat.jsx)
- ✅ Added `selectedPhoto` and `photoPreview` state
- ✅ Added `handlePhotoSelect()` function with validation:
  - Only accepts image files
  - Max 5MB file size
  - Shows preview before sending
- ✅ Added `clearPhotoSelection()` to cancel photo upload
- ✅ Updated `handleSend()` to:
  - Upload photo to Supabase Storage (`chat-photos` bucket)
  - Get public URL
  - Save URL in `photo_url` field
- ✅ Added photo button (🖼️ icon) next to send button
- ✅ Display photos in message bubbles
- ✅ Show photo preview before sending with cancel button

### Database (Supabase)
Two SQL migrations need to be run:

#### 1. CREATE_CHAT_PHOTOS_BUCKET.sql
Creates the storage bucket with RLS policies:
- Public bucket named `chat-photos`
- Users can upload to their own folders (user_id based)
- Public read access (anyone can view photos)
- Users can delete their own photos

#### 2. ADD_PHOTO_URL_TO_MESSAGES.sql
Adds `photo_url` column to messages table

## Setup Steps

### Step 1: Run SQL Migrations
1. Go to Supabase Dashboard → SQL Editor
2. Run the contents of `CREATE_CHAT_PHOTOS_BUCKET.sql`
3. Run the contents of `ADD_PHOTO_URL_TO_MESSAGES.sql`

### Step 2: Test
1. Open Chat page
2. Select a conversation
3. Click the photo button (🖼️ icon)
4. Select an image
5. See preview appear
6. Click send (or click X to cancel)
7. Photo should appear in chat!

## Features
- ✅ Photo preview before sending
- ✅ File validation (type and size)
- ✅ Cancel option for selected photo
- ✅ Photos display in message bubbles
- ✅ Supports up to 5MB images
- ✅ Works with messages or standalone
- ✅ User folder organization in storage

## Storage Structure
Photos are stored in:
`chat-photos/{user_id}/{timestamp}-{filename}`

Example: `chat-photos/a8cee9de-bed7-4b7c-90de-06a7d87175ea/1765217204102-dog.jpg`

## Future Enhancements
- [ ] Image compression before upload
- [ ] Gallery view for photos
- [ ] Photo deletion
- [ ] Multiple photos per message
- [ ] Photo tagging/reactions
