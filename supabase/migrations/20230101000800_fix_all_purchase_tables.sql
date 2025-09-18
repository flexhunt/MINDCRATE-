-- Drop existing tables if they exist to start fresh
DROP TABLE IF EXISTS public.shop_orders CASCADE;
DROP TABLE IF EXISTS public.shop_items CASCADE;
DROP FUNCTION IF EXISTS public.process_shop_purchase CASCADE;

-- Use the existing items table structure from the original migration
-- Ensure items table exists with correct structure
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

-- Use the existing orders table structure from the original migration
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  item_id UUID NOT NULL REFERENCES public.items(id),
  price_paid INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  ordered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure user_courses table exists for course purchases
CREATE TABLE IF NOT EXISTS public.user_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  course_id UUID NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_granted BOOLEAN DEFAULT true,
  UNIQUE(user_id, course_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_items_active ON public.items(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_item_id ON public.orders(item_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON public.user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_course_id ON public.user_courses(course_id);

-- Enable RLS on all tables
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_courses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view active items" ON public.items;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own courses" ON public.user_courses;
DROP POLICY IF EXISTS "Users can insert their own courses" ON public.user_courses;

-- Items policies - everyone can view active items
CREATE POLICY "Anyone can view active items" ON public.items
  FOR SELECT USING (is_active = true);

-- Orders policies - users can view their own orders
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User courses policies
CREATE POLICY "Users can view their own courses" ON public.user_courses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own courses" ON public.user_courses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create shop purchase function
CREATE OR REPLACE FUNCTION public.process_shop_purchase(
  p_user_id UUID,
  p_item_id UUID,
  p_item_price INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_user_balance INTEGER;
  v_new_balance INTEGER;
  v_order_id UUID;
  v_item_stock INTEGER;
BEGIN
  -- Get user's current balance
  SELECT balance INTO v_user_balance 
  FROM public.user_coins 
  WHERE user_id = p_user_id;
  
  IF v_user_balance IS NULL THEN
    RAISE EXCEPTION 'User has no coin balance';
  END IF;
  
  -- Check if user has enough coins
  IF v_user_balance < p_item_price THEN
    RAISE EXCEPTION 'Insufficient coins';
  END IF;
  
  -- Get item stock
  SELECT stock INTO v_item_stock 
  FROM public.items 
  WHERE id = p_item_id AND is_active = true;
  
  IF v_item_stock IS NULL THEN
    RAISE EXCEPTION 'Item not found or not active';
  END IF;
  
  IF v_item_stock <= 0 THEN
    RAISE EXCEPTION 'Item out of stock';
  END IF;
  
  -- Check if user already owns this item
  IF EXISTS (
    SELECT 1 FROM public.orders 
    WHERE user_id = p_user_id AND item_id = p_item_id AND status = 'completed'
  ) THEN
    RAISE EXCEPTION 'User already owns this item';
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_user_balance - p_item_price;
  
  -- Update user balance
  UPDATE public.user_coins 
  SET balance = v_new_balance, updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Create order
  INSERT INTO public.orders (user_id, item_id, price_paid, status)
  VALUES (p_user_id, p_item_id, p_item_price, 'completed')
  RETURNING id INTO v_order_id;
  
  -- Update item stock
  UPDATE public.items 
  SET stock = stock - 1, updated_at = NOW()
  WHERE id = p_item_id;
  
  -- Record transaction
  INSERT INTO public.coin_transactions (
    user_id, amount, balance_after, transaction_type, description, metadata
  ) VALUES (
    p_user_id, 
    -p_item_price, 
    v_new_balance, 
    'shop_purchase', 
    'Purchased item', 
    json_build_object('item_id', p_item_id, 'order_id', v_order_id)
  );
  
  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create course purchase function
CREATE OR REPLACE FUNCTION public.process_course_purchase(
  p_user_id UUID,
  p_course_id UUID,
  p_course_price INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_user_balance INTEGER;
  v_new_balance INTEGER;
  v_purchase_id UUID;
BEGIN
  -- Get user's current balance
  SELECT balance INTO v_user_balance 
  FROM public.user_coins 
  WHERE user_id = p_user_id;
  
  IF v_user_balance IS NULL THEN
    RAISE EXCEPTION 'User has no coin balance';
  END IF;
  
  -- Check if user has enough coins
  IF v_user_balance < p_course_price THEN
    RAISE EXCEPTION 'Insufficient coins';
  END IF;
  
  -- Check if user already owns this course
  IF EXISTS (
    SELECT 1 FROM public.user_courses 
    WHERE user_id = p_user_id AND course_id = p_course_id
  ) THEN
    RAISE EXCEPTION 'User already owns this course';
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_user_balance - p_course_price;
  
  -- Update user balance
  UPDATE public.user_coins 
  SET balance = v_new_balance, updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Create course access
  INSERT INTO public.user_courses (user_id, course_id)
  VALUES (p_user_id, p_course_id)
  RETURNING id INTO v_purchase_id;
  
  -- Record transaction
  INSERT INTO public.coin_transactions (
    user_id, amount, balance_after, transaction_type, description, metadata
  ) VALUES (
    p_user_id, 
    -p_course_price, 
    v_new_balance, 
    'course_purchase', 
    'Purchased course', 
    json_build_object('course_id', p_course_id, 'purchase_id', v_purchase_id)
  );
  
  RETURN v_purchase_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
