-- Update the referral code generation to be based on username
-- First, make sure the referral_code column exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Drop the old function and trigger if they exist
DROP FUNCTION IF EXISTS generate_unique_referral_code() CASCADE;
DROP TRIGGER IF EXISTS set_profile_referral_code ON profiles;

-- Create a new function to generate referral code based on username
CREATE OR REPLACE FUNCTION generate_username_based_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  base_code TEXT;
  final_code TEXT;
  counter INT := 0;
BEGIN
  -- If referral_code is already set, don't change it
  IF NEW.referral_code IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Use username as the base for referral code
  base_code := LOWER(NEW.username);
  
  -- Initial code attempt
  final_code := base_code;
  
  -- Keep trying with incremented counters until we find a unique code
  WHILE EXISTS (SELECT 1 FROM profiles WHERE referral_code = final_code) LOOP
    counter := counter + 1;
    final_code := base_code || counter;
  END LOOP;
  
  -- Set the referral code
  NEW.referral_code := final_code;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to set referral code for new profiles
CREATE TRIGGER set_profile_referral_code
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
WHEN (NEW.referral_code IS NULL AND NEW.username IS NOT NULL)
EXECUTE FUNCTION generate_username_based_referral_code();

-- Update existing profiles with username-based referral codes if they don't have one
DO $$
BEGIN
  UPDATE profiles
  SET referral_code = LOWER(username)
  WHERE referral_code IS NULL AND username IS NOT NULL;
  
  -- Handle duplicates by adding a number suffix
  WITH duplicates AS (
    SELECT referral_code, COUNT(*) 
    FROM profiles 
    GROUP BY referral_code 
    HAVING COUNT(*) > 1
  )
  UPDATE profiles p
  SET referral_code = p.referral_code || p.id::text
  FROM duplicates d
  WHERE p.referral_code = d.referral_code;
END $$;
