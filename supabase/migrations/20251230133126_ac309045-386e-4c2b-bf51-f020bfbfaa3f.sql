-- Add reading_goal column to profiles table for dynamic reading goals
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS reading_goal_yearly INTEGER DEFAULT 24;

-- Add linked_media_id to wishlist_items for linking books to wishlist
ALTER TABLE public.wishlist_items 
ADD COLUMN IF NOT EXISTS linked_media_id UUID REFERENCES public.media_items(id) ON DELETE SET NULL;

-- Add goal_id to media_items to link media with goals
ALTER TABLE public.media_items 
ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_wishlist_linked_media ON public.wishlist_items(linked_media_id);
CREATE INDEX IF NOT EXISTS idx_media_items_goal_id ON public.media_items(goal_id);