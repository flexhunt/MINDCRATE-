-- Add download_url column to items table if it doesn't exist
ALTER TABLE public.items 
ADD COLUMN IF NOT EXISTS download_url TEXT;

-- Create purchased_items table if it doesn't exist
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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'purchased_items' 
    AND policyname = 'Users can view their own purchased items'
  ) THEN
    CREATE POLICY "Users can view their own purchased items"
    ON public.purchased_items
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create policy for inserting purchased items (for the purchase API)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'purchased_items' 
    AND policyname = 'System can insert purchased items'
  ) THEN
    CREATE POLICY "System can insert purchased items"
    ON public.purchased_items
    FOR INSERT
    WITH CHECK (true);
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_purchased_items_user_id ON public.purchased_items(user_id);

-- Update the purchase_item function to handle digital downloads
CREATE OR REPLACE FUNCTION public.purchase_item(item_id UUID, input_user_id UUID)
RETURNS JSON AS $$
DECLARE
  item_record RECORD;
  user_balance INTEGER;
  new_balance INTEGER;
  order_id UUID;
BEGIN
  -- Check if item exists and is active
  SELECT * INTO item_record FROM public.items WHERE id = item_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Item not found or not available');
  END IF;

  -- Check if item is in stock
  IF item_record.stock = 0 THEN
    RETURN json_build_object('success', false, 'message', 'Item out of stock');
  END IF;

  -- Get user's current balance
  SELECT balance INTO user_balance FROM public.user_coins WHERE user_id = input_user_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'User has no coin balance');
  END IF;

  -- Check if user has enough coins
  IF user_balance < item_record.price THEN
    RETURN json_build_object('success', false, 'message', 'Insufficient coins');
  END IF;

  -- Begin transaction
  BEGIN
    -- Deduct coins from user's balance
    new_balance := user_balance - item_record.price;
    UPDATE public.user_coins 
    SET balance = new_balance, updated_at = NOW() 
    WHERE user_id = input_user_id;

    -- Record the transaction
    INSERT INTO public.coin_transactions (
      user_id, 
      amount, 
      balance_after, 
      transaction_type, 
      description, 
      metadata
    ) VALUES (
      input_user_id, 
      -item_record.price, 
      new_balance, 
      'shop_purchase', 
      'Purchased item: ' || item_record.name, 
      json_build_object('item_id', item_id)
    );

    -- Create order record
    INSERT INTO public.orders (
        item_id)
    );

    -- Create order record
    INSERT INTO public.orders (
      user_id, 
      item_id, 
      price_paid,
      status
    ) VALUES (
      input_user_id, 
      item_id, 
      item_record.price,
      'completed'
    ) RETURNING id INTO order_id;
    
    -- Create purchased_item record if item has a download_url
    IF item_record.download_url IS NOT NULL THEN
      INSERT INTO public.purchased_items (
        user_id,
        item_id,
        download_url
      ) VALUES (
        input_user_id,
        item_id,
        item_record.download_url
      );
    END IF;

    -- Decrease item stock
    UPDATE public.items 
    SET stock = stock - 1, updated_at = NOW() 
    WHERE id = item_id;

    -- Return success
    RETURN json_build_object(
      'success', true, 
      'message', 'Purchase successful', 
      'order_id', order_id, 
      'new_balance', new_balance,
      'has_download', item_record.download_url IS NOT NULL
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback is automatic on exception
      RETURN json_build_object('success', false, 'message', 'Transaction failed: ' || SQLERRM);
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
