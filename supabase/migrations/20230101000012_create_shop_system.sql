-- Create items table
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL CHECK (price > 0),
  image_url TEXT,
  stock INTEGER NOT NULL DEFAULT 1 CHECK (stock >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  item_id UUID NOT NULL REFERENCES public.items(id),
  price_paid INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  ordered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_users table to track who has admin privileges
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id)
);

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process a purchase
CREATE OR REPLACE FUNCTION public.purchase_item(item_id UUID, user_id UUID)
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
  SELECT balance INTO user_balance FROM public.user_coins WHERE user_id = purchase_item.user_id;
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
    WHERE user_id = purchase_item.user_id;

    -- Record the transaction
    INSERT INTO public.coin_transactions (
      user_id, 
      amount, 
      balance_after, 
      transaction_type, 
      description, 
      metadata
    ) VALUES (
      purchase_item.user_id, 
      -item_record.price, 
      new_balance, 
      'shop_purchase', 
      'Purchased item: ' || item_record.name, 
      json_build_object('item_id', item_id)
    );

    -- Create order record
    INSERT INTO public.orders (
      user_id, 
      item_id, 
      price_paid
    ) VALUES (
      purchase_item.user_id, 
      item_id, 
      item_record.price
    ) RETURNING id INTO order_id;

    -- Decrease item stock
    UPDATE public.items 
    SET stock = stock - 1, updated_at = NOW() 
    WHERE id = item_id;

    -- Return success
    RETURN json_build_object(
      'success', true, 
      'message', 'Purchase successful', 
      'order_id', order_id, 
      'new_balance', new_balance
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback is automatic on exception
      RETURN json_build_object('success', false, 'message', 'Transaction failed: ' || SQLERRM);
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up RLS
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Items policies
-- Everyone can view active items
CREATE POLICY "Anyone can view active items" 
ON public.items FOR SELECT 
USING (is_active = true);

-- Admins can view all items including inactive ones
CREATE POLICY "Admins can view all items" 
ON public.items FOR SELECT 
USING (is_admin(auth.uid()));

-- Only admins can insert items
CREATE POLICY "Only admins can insert items" 
ON public.items FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

-- Only admins can update items
CREATE POLICY "Only admins can update items" 
ON public.items FOR UPDATE 
USING (is_admin(auth.uid()));

-- Only admins can delete items
CREATE POLICY "Only admins can delete items" 
ON public.items FOR DELETE 
USING (is_admin(auth.uid()));

-- Orders policies
-- Users can view their own orders
CREATE POLICY "Users can view their own orders" 
ON public.orders FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders" 
ON public.orders FOR SELECT 
USING (is_admin(auth.uid()));

-- Users can insert their own orders (though we'll use the function instead)
CREATE POLICY "Users can insert their own orders" 
ON public.orders FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admin users policies
-- Only admins can view admin_users
CREATE POLICY "Only admins can view admin_users" 
ON public.admin_users FOR SELECT 
USING (is_admin(auth.uid()));

-- Only admins can insert admin_users
CREATE POLICY "Only admins can insert admin_users" 
ON public.admin_users FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

-- Only admins can delete admin_users
CREATE POLICY "Only admins can delete admin_users" 
ON public.admin_users FOR DELETE 
USING (is_admin(auth.uid()));

-- Make the first user an admin (for initial setup)
-- This will only run if the admin_users table is empty
DO $$
DECLARE
  first_user_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.admin_users LIMIT 1) THEN
    -- Get the first user from auth.users
    SELECT id INTO first_user_id FROM auth.users ORDER BY created_at LIMIT 1;
    
    IF first_user_id IS NOT NULL THEN
      -- Make them an admin
      INSERT INTO public.admin_users (user_id, granted_by) 
      VALUES (first_user_id, first_user_id);
    END IF;
  END IF;
END $$;
