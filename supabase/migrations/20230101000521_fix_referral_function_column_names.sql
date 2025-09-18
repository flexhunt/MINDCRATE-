-- Fix the process_referral function to use correct column names
CREATE OR REPLACE FUNCTION process_referral(
  p_referral_code TEXT,
  p_referred_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referrer_id UUID;
  v_existing_referral RECORD;
  v_result JSON;
BEGIN
  -- Check if user already used a referral code
  SELECT * INTO v_existing_referral
  FROM referrals 
  WHERE referred_user_id = p_referred_user_id;
  
  IF FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'You have already used a referral code'
    );
  END IF;

  -- Find the referrer by code
  SELECT user_id INTO v_referrer_id
  FROM referral_codes 
  WHERE code = p_referral_code;
  
  IF v_referrer_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid referral code'
    );
  END IF;

  -- Check if user is trying to use their own code
  IF v_referrer_id = p_referred_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'You cannot use your own referral code'
    );
  END IF;

  -- Create the referral record
  INSERT INTO referrals (referrer_id, referred_user_id, referral_code)
  VALUES (v_referrer_id, p_referred_user_id, p_referral_code);

  -- Add coins to the new user (25 coins welcome bonus)
  INSERT INTO user_coins (user_id, balance, lifetime_earned)
  VALUES (p_referred_user_id, 25, 25)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance = user_coins.balance + 25,
    lifetime_earned = user_coins.lifetime_earned + 25;

  -- Add coins to the referrer (10 coins referral bonus)
  INSERT INTO user_coins (user_id, balance, lifetime_earned)
  VALUES (v_referrer_id, 10, 10)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance = user_coins.balance + 10,
    lifetime_earned = user_coins.lifetime_earned + 10;

  -- Update referral code usage count
  UPDATE referral_codes 
  SET used_count = used_count + 1
  WHERE code = p_referral_code;

  RETURN json_build_object(
    'success', true,
    'message', 'Referral code applied successfully! You earned 25 coins!'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'An error occurred while processing the referral'
    );
END;
$$;
