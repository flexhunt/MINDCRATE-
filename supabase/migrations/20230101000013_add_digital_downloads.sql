-- Add download_url column to items table
ALTER TABLE public.items 
ADD COLUMN IF NOT EXISTS download_url TEXT;

-- Create purchased_items table
CREATE TABLE IF NOT EXISTS public.purchased_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  item_id UUID REFERENCES public.items(id),
  download_url TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on purchased_items
ALTER TABLE public.purchased_items ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own purchased items
CREATE POLICY "Users can view their own purchased items"
ON public.purchased_items
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for inserting purchased items (for the purchase API)
CREATE POLICY "System can insert purchased items"
ON public.purchased_items
FOR INSERT
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_purchased_items_user_id ON public.purchased_items(user_id);
