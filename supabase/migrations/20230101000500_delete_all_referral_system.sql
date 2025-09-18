-- Delete everything referral related completely
DROP FUNCTION IF EXISTS get_user_referral_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS process_user_referral(TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS generate_unique_referral_code() CASCADE;
DROP FUNCTION IF EXISTS create_referral_code_for_user() CASCADE;
DROP FUNCTION IF EXISTS check_table_exists(TEXT) CASCADE;

DROP TRIGGER IF EXISTS trigger_create_referral_code ON auth.users CASCADE;

DROP TABLE IF EXISTS referral_rewards CASCADE;
DROP TABLE IF EXISTS referral_analytics CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS referral_codes CASCADE;

-- Remove any referral columns from profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS referral_code_used;
ALTER TABLE profiles DROP COLUMN IF EXISTS used_referral_code;
ALTER TABLE profiles DROP COLUMN IF EXISTS has_used_referral_code;

-- Clean up any remaining indexes
DROP INDEX IF EXISTS idx_referral_codes_user;
DROP INDEX IF EXISTS idx_referral_codes_code;
DROP INDEX IF EXISTS idx_referrals_referrer;
DROP INDEX IF EXISTS idx_referrals_referred;
DROP INDEX IF EXISTS idx_referral_codes_user_id;
DROP INDEX IF EXISTS idx_referrals_referrer_id;
DROP INDEX IF EXISTS idx_referrals_referred_id;
DROP INDEX IF EXISTS idx_referrals_status;
DROP INDEX IF EXISTS idx_referral_rewards_user_id;
DROP INDEX IF EXISTS idx_referral_analytics_user_id;

-- Remove any RLS policies
DROP POLICY IF EXISTS "Users can view own referral code" ON referral_codes;
DROP POLICY IF EXISTS "Users can insert own referral code" ON referral_codes;
DROP POLICY IF EXISTS "Users can view their referrals" ON referrals;
DROP POLICY IF EXISTS "Anyone can insert referrals" ON referrals;
