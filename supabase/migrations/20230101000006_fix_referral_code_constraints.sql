-- Check if referral_code column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN referral_code TEXT;
  END IF;
END $$;

-- Make sure referral_code has a unique constraint but allow nulls
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_referral_code_key;
ALTER TABLE profiles ADD CONSTRAINT profiles_referral_code_key UNIQUE (referral_code);

-- Create an index for faster lookups
DROP INDEX IF EXISTS idx_profiles_referral_code;
CREATE INDEX idx_profiles_referral_code ON profiles(referral_code);

-- Update any NULL referral codes with username-based codes
UPDATE profiles 
SET referral_code = LOWER(username)
WHERE referral_code IS NULL AND username IS NOT NULL;

-- Fix any duplicate referral codes by adding a random suffix
WITH duplicates AS (
  SELECT referral_code
  FROM profiles
  WHERE referral_code IS NOT NULL
  GROUP BY referral_code
  HAVING COUNT(*) > 1
)
UPDATE profiles p
SET referral_code = p.referral_code || '_' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4)
FROM duplicates d
WHERE p.referral_code = d.referral_code;
