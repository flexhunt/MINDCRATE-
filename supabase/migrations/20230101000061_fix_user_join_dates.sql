-- Fix user join dates for profiles that show incorrect membership duration
-- This updates the created_at timestamp for profiles to match their actual join date

-- First, create a function to fix user join dates
CREATE OR REPLACE FUNCTION fix_user_join_dates()
RETURNS void AS $$
BEGIN
  -- Update profiles where created_at is recent but they are actually older members
  -- We'll use the auth.users table as the source of truth for when users actually joined
  UPDATE public.profiles
  SET created_at = auth.users.created_at
  FROM auth.users
  WHERE profiles.id = auth.users.id
  AND (profiles.created_at > NOW() - INTERVAL '7 days');
  
  -- Also ensure updated_at is set properly
  UPDATE public.profiles
  SET updated_at = NOW()
  WHERE updated_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function
SELECT fix_user_join_dates();

-- Drop the function after use
DROP FUNCTION fix_user_join_dates();
