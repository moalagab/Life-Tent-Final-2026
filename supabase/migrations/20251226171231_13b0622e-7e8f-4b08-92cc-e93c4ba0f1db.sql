-- Create wishlist table for shopping items users want to buy
CREATE TABLE public.wishlist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  estimated_price NUMERIC,
  currency TEXT DEFAULT 'SAR',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT,
  url TEXT,
  image_url TEXT,
  target_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'saved_for', 'purchased', 'cancelled')),
  saved_amount NUMERIC DEFAULT 0,
  linked_envelope_id UUID REFERENCES public.envelopes(id),
  linked_sinking_fund_id UUID REFERENCES public.sinking_funds(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own wishlist_items" 
ON public.wishlist_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wishlist_items" 
ON public.wishlist_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wishlist_items" 
ON public.wishlist_items 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wishlist_items" 
ON public.wishlist_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_wishlist_items_updated_at
BEFORE UPDATE ON public.wishlist_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();