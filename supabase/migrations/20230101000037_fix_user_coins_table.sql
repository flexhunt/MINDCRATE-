-- First, check if the user_coins table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_coins') THEN
    -- Table exists, check if created_at column exists
    IF EXISTS (SELECT FROM information_schema.columns 
               WHERE table_schema = 'public' AND table_name = 'user_coins' AND column_name = 'created_at') THEN
      -- Drop the created_at column
      ALTER TABLE public.user_coins DROP COLUMN created_at;
    END IF;
    
    -- Check if updated_at column exists
    IF EXISTS (SELECT FROM information_schema.columns 
               WHERE table_schema = 'public' AND table_name = 'user_coins' AND column_name = 'updated_at') THEN
      -- Drop the updated_at column
      ALTER TABLE public.user_coins DROP COLUMN updated_at;
    END IF;
  ELSE
    -- Table doesn't exist, create it with the correct structure
    CREATE TABLE public.user_coins (
      user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      balance INTEGER NOT NULL DEFAULT 0,
      lifetime_earned INTEGER NOT NULL DEFAULT 0
    );
  END IF;
END $$;

-- Fix the handle_new_user function to not reference created_at or updated_at
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a profile for the new user
  INSERT INTO public.profiles (id, email, name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'name')::text, 'User'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Create a coin balance for the new user
  INSERT INTO public.user_coins (user_id, balance, lifetime_earned)
  VALUES (
    NEW.id,
    0,
    0
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
