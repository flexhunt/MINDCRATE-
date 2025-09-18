-- Drop all existing process_referral functions to avoid conflicts
DROP FUNCTION IF EXISTS process_referral(character varying, uuid);
DROP FUNCTION IF EXISTS process_referral(text, uuid);
DROP FUNCTION IF EXISTS process_referral(p_referral_code character varying, p_referred_user_id uuid);
DROP FUNCTION IF EXISTS process_referral(p_referral_code text, p_referred_user_id uuid);

-- Create a single, clean process_referral function
CREATE OR REPLACE FUNCTION process_referral(
  p_referral_code TEXT,
  p_referred_user_id UUID
) RETURNS JSON AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_code_id UUID;
  v_referrer_profile RECORD;
  v_referred_profile RECORD;
  v_existing_referral RECORD;
BEGIN
  -- Validate input
  IF p_referral_code IS NULL OR LENGTH(TRIM(p_referral_code)) = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Referral code is required');
  END IF;

  IF p_referred_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User ID is required');
  END IF;

  -- Clean the referral code
  p_referral_code := UPPER(TRIM(p_referral_code));

  -- Check if user already used a referral code
  SELECT * INTO v_existing_referral 
  FROM referrals 
  WHERE referred_user_id = p_referred_user_id;

  IF FOUND THEN
    RETURN json_build_object('success', false, 'error', 'You have already used a referral code');
  END IF;

  -- Find the referral code and get the referrer
  SELECT rc.id, rc.user_id INTO v_referral_code_id, v_referrer_id
  FROM referral_codes rc
  WHERE rc.code = p_referral_code AND rc.is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or inactive referral code');
  END IF;

  -- Check if user is trying to refer themselves
  IF v_referrer_id = p_referred_user_id THEN
    RETURN json_build_object('success', false, 'error', 'You cannot use your own referral code');
  END IF;

  -- Get referrer profile
  SELECT * INTO v_referrer_profile FROM profiles WHERE id = v_referrer_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Referrer profile not found');
  END IF;

  -- Get referred user profile
  SELECT * INTO v_referred_profile FROM profiles WHERE id = p_referred_user_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Your profile not found');
  END IF;

  -- Create the referral record
  INSERT INTO referrals (referrer_id, referred_user_id, referral_code_id, status)
  VALUES (v_referrer_id, p_referred_user_id, v_referral_code_id, 'completed');

  -- Update referral code usage count
  UPDATE referral_codes 
  SET used_count = used_count + 1, updated_at = NOW()
  WHERE id = v_referral_code_id;

  -- Add coins to the new user (25 coins)
  INSERT INTO user_coins (user_id, balance, lifetime_earned)
  VALUES (p_referred_user_id, 25, 25)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance = user_coins.balance + 25,
    lifetime_earned = user_coins.lifetime_earned + 25,
    updated_at = NOW();

  -- Add coins to the referrer (10 coins)
  INSERT INTO user_coins (user_id, balance, lifetime_earned)
  VALUES (v_referrer_id, 10, 10)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance = user_coins.balance + 10,
    lifetime_earned = user_coins.lifetime_earned + 10,
    updated_at = NOW();

  -- Return success response
  RETURN json_build_object(
    'success', true,
    'message', 'Referral processed successfully! You earned 25 coins.',
    'coins_earned', 25,
    'referrer_name', COALESCE(v_referrer_profile.name, v_referrer_profile.username, 'Unknown'),
    'referrer_coins_earned', 10
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'An error occurred while processing the referral: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION process_referral(TEXT, UUID) TO authenticated;
