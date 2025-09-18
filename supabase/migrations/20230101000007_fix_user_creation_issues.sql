-- This migration fixes issues with user creation and referral codes

-- First, check if the handle_new_user function exists and drop it if it does
-- This function might be causing conflicts during user creation
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Drop the on_auth_user_created trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a simpler version of the function that won't conflict with signups
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert a profile if one doesn't already exist
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (
      id, 
      email,
      name, 
      username,
      updated_at
    )
    VALUES (
      NEW.id, 
      NEW.email,
      NEW.raw_user_meta_data->>'name',
      COALESCE(
        NEW.raw_user_meta_data->>'username',
        LOWER(SPLIT_PART(NEW.email, '@', 1))
      ),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger with a more reliable approach
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Make sure referral_code column exists but make it nullable
ALTER TABLE profiles 
ALTER COLUMN referral_code DROP NOT NULL;

-- Create a separate function to set referral codes that won't block user creation
CREATE OR REPLACE FUNCTION set_profile_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  base_code TEXT;
  final_code TEXT;
  counter INT := 0;
BEGIN
  -- Skip if referral code is already set
  IF NEW.referral_code IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Use username as base for referral code
  base_code := LOWER(NEW.username);
  
  -- If no username, use part of the id
  IF base_code IS NULL OR base_code = '' THEN
    base_code := 'user_' || SUBSTRING(NEW.id::text, 1, 8);
  END IF;
  
  -- Initial code attempt
  final_code := base_code;
  
  -- Try up to 5 times to find a unique code
  FOR counter IN 1..5 LOOP
    -- Check if code exists
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = final_code) THEN
      -- Found a unique code
      NEW.referral_code := final_code;
      RETURN NEW;
    END IF;
    
    -- Try with a counter
    final_code := base_code || counter;
  END LOOP;
  
  -- If we get here, just use a random code as fallback
  NEW.referral_code := base_code || '_' || FLOOR(RANDOM() * 10000)::TEXT;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger that runs BEFORE INSERT OR UPDATE
-- This won't block the initial user creation
DROP TRIGGER IF EXISTS set_profile_referral_code ON profiles;
CREATE TRIGGER set_profile_referral_code
BEFORE UPDATE ON profiles
FOR EACH ROW
WHEN (NEW.referral_code IS NULL)
EXECUTE FUNCTION set_profile_referral_code();
