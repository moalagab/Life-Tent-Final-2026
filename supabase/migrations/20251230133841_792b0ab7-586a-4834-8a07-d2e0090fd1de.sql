-- Add genre/category column to media_items
ALTER TABLE public.media_items 
ADD COLUMN IF NOT EXISTS genre text;

-- Add reading reminder preferences to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS reading_reminder_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reading_reminder_time text DEFAULT '20:00';

-- Create index for genre
CREATE INDEX IF NOT EXISTS idx_media_items_genre ON public.media_items(genre);