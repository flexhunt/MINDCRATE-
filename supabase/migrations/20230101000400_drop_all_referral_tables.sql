-- Drop all referral system tables and functions completely
DROP FUNCTION IF EXISTS get_referral_stats(UUID);
DROP FUNCTION IF EXISTS process_referral(TEXT, UUID);
DROP FUNCTION IF EXISTS generate_referral_code();
DROP FUNCTION IF EXISTS create_user_referral_code();
DROP FUNCTION IF EXISTS create_missing_referral_codes();

DROP TRIGGER IF EXISTS create_referral_code_trigger ON auth.users;

DROP TABLE IF EXISTS referral_rewards CASCADE;
DROP TABLE IF EXISTS referral_analytics CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS referral_codes CASCADE;

-- Clean up any remaining indexes
DROP INDEX IF EXISTS idx_referral_codes_user_id;
DROP INDEX IF EXISTS idx_referral_codes_code;
DROP INDEX IF EXISTS idx_referrals_referrer_id;
DROP INDEX IF EXISTS idx_referrals_referred_id;
DROP INDEX IF EXISTS idx_referrals_status;
DROP INDEX IF EXISTS idx_referral_rewards_user_id;
DROP INDEX IF EXISTS idx_referral_analytics_user_id;
