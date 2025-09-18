-- Drop referrals table
DROP TABLE IF EXISTS public.referrals;

-- Remove referral_code column from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS referral_code;

-- Drop any functions related to referrals
DROP FUNCTION IF EXISTS generate_unique_referral_code() CASCADE;
DROP FUNCTION IF EXISTS generate_username_based_referral_code() CASCADE;
DROP FUNCTION IF EXISTS set_referral_code_on_new_profile() CASCADE;

-- Drop any triggers related to referrals
DROP TRIGGER IF EXISTS set_profile_referral_code ON profiles;
