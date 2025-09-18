-- Drop any functions that reference the leaderboard table
DROP FUNCTION IF EXISTS public.update_leaderboard_on_signup CASCADE;
DROP FUNCTION IF EXISTS public.update_leaderboard_on_activity CASCADE;
DROP FUNCTION IF EXISTS public.get_leaderboard CASCADE;
DROP FUNCTION IF EXISTS public.reset_leaderboard CASCADE;

-- Drop any triggers that reference the leaderboard table
DROP TRIGGER IF EXISTS update_leaderboard_on_signup ON auth.users;
DROP TRIGGER IF EXISTS update_leaderboard_on_activity ON public.user_activity;

-- Create a function to safely handle user creation without leaderboard
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a profile for the new user if it doesn't exist
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
  INSERT INTO public.user_coins (user_id, balance, lifetime_earned, created_at, updated_at)
  VALUES (
    NEW.id,
    0,
    0,
    NOW(),
    NOW()
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
