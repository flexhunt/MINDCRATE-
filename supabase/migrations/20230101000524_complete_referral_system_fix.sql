-- -----------------------------------------------------------------------------
-- COMPLETE REFERRAL SYSTEM FIX - Fix all column issues at once
-- -----------------------------------------------------------------------------

-- First, let's check and fix the referral_codes table structure
ALTER TABLE referral_codes 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Ensure all existing codes are active
UPDATE referral_codes SET is_active = true WHERE is_active IS NULL;

-- Make sure we have the right columns in referrals table
ALTER TABLE referrals 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

-- Drop the problematic function completely and recreate with correct schema
DROP FUNCTION IF EXISTS process_referral(TEXT, UUID);
DROP FUNCTION IF EXISTS process_referral(VARCHAR, UUID);
DROP FUNCTION IF EXISTS process_referral(p_referral_code TEXT, p_referred_user_id UUID);
DROP FUNCTION IF EXISTS process_referral(p_referral_code VARCHAR, p_referred_user_id UUID);

-- Create the function with the ACTUAL column names from your schema
CREATE OR REPLACE FUNCTION process_referral(
  p_referral_code TEXT,
  p_referred_user_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referrer_id        UUID;
  v_referral_code_id   UUID;
  v_existing_referral  RECORD;
  v_referrer_username  TEXT;
BEGIN
  -- Validation
  IF p_referral_code IS NULL OR LENGTH(TRIM(p_referral_code)) = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Referral code is required');
  END IF;

  IF p_referred_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User ID is required');
  END IF;

  p_referral_code := UPPER(TRIM(p_referral_code));

  -- Check if user already used a referral code
  SELECT 1 INTO v_existing_referral
  FROM referrals
  WHERE referred_id = p_referred_user_id;

  IF FOUND THEN
    RETURN json_build_object('success', false, 'error', 'You have already used a referral code');
  END IF;

  -- Find the referral code and referrer
  SELECT rc.id, rc.user_id, p.username
    INTO v_referral_code_id, v_referrer_id, v_referrer_username
  FROM referral_codes rc
  JOIN profiles p ON p.id = rc.user_id
  WHERE rc.code = p_referral_code
    AND rc.is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or inactive referral code');
  END IF;

  -- Prevent self-referral
  IF v_referrer_id = p_referred_user_id THEN
    RETURN json_build_object('success', false, 'error', 'You cannot use your own referral code');
  END IF;

  -- Create the referral record
  INSERT INTO referrals (referrer_id, referred_id, referral_code_id, status, created_at)
  VALUES (v_referrer_id, p_referred_user_id, v_referral_code_id, 'completed', NOW());

  -- Update referral code usage count
  UPDATE referral_codes
  SET used_count = COALESCE(used_count, 0) + 1,
      updated_at = NOW()
  WHERE id = v_referral_code_id;

  -- Award coins to the new user (25 coins)
  INSERT INTO user_coins (user_id, balance, lifetime_earned, created_at, updated_at)
  VALUES (p_referred_user_id, 25, 25, NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET balance = user_coins.balance + 25,
      lifetime_earned = user_coins.lifetime_earned + 25,
      updated_at = NOW();

  -- Award coins to the referrer (10 coins)
  INSERT INTO user_coins (user_id, balance, lifetime_earned, created_at, updated_at)
  VALUES (v_referrer_id, 10, 10, NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET balance = user_coins.balance + 10,
      lifetime_earned = user_coins.lifetime_earned + 10,
      updated_at = NOW();

  RETURN json_build_object(
    'success', true,
    'message', 'Referral code applied successfully! You earned 25 coins!',
    'coins_earned', 25,
    'referrer_coins', 10,
    'referrer_username', v_referrer_username
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'An error occurred while processing the referral: ' || SQLERRM
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION process_referral(TEXT, UUID) TO authenticated;

-- Ensure all existing referral codes are active
UPDATE referral_codes SET is_active = true WHERE is_active IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);

-- Create RLS policies if they don't exist
DO $$
BEGIN
  -- Enable RLS on tables
  ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
  ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies to avoid conflicts
  DROP POLICY IF EXISTS "Users can view their own referral codes" ON referral_codes;
  DROP POLICY IF EXISTS "Users can view all active referral codes" ON referral_codes;
  DROP POLICY IF EXISTS "Users can view their referrals" ON referrals;
  DROP POLICY IF EXISTS "Users can create referrals" ON referrals;
  
  -- Create new policies
  CREATE POLICY "Users can view their own referral codes" ON referral_codes
    FOR SELECT USING (auth.uid() = user_id);
    
  CREATE POLICY "Users can view all active referral codes" ON referral_codes
    FOR SELECT USING (is_active = true);
    
  CREATE POLICY "Users can view their referrals" ON referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
    
  CREATE POLICY "Users can create referrals" ON referrals
    FOR INSERT WITH CHECK (auth.uid() = referred_id);
    
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if policies already exist
    NULL;
END $$;
