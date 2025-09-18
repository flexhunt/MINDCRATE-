-- Create items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL CHECK (price > 0),
  image_url TEXT,
  stock INTEGER NOT NULL DEFAULT 1 CHECK (stock >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Check if is_active column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'is_active'
  ) THEN
    -- Add is_active column
    ALTER TABLE public.items 
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
  END IF;
  
  -- Check if image_url column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'image_url'
  ) THEN
    -- Add image_url column
    ALTER TABLE public.items 
    ADD COLUMN image_url TEXT;
  END IF;
  
  -- Check if created_by column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'created_by'
  ) THEN
    -- Add created_by column
    ALTER TABLE public.items 
    ADD COLUMN created_by UUID;
  END IF;
  
  -- Check if stock column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'stock'
  ) THEN
    -- Add stock column
    ALTER TABLE public.items 
    ADD COLUMN stock INTEGER NOT NULL DEFAULT 1;
  END IF;
END $$;

-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  granted_by UUID
);

-- Create is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(input_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = input_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create exec_sql function for future use
CREATE OR REPLACE FUNCTION public.exec_sql(sql_string TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_string;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
