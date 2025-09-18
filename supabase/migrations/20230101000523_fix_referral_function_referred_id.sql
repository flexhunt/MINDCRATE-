-- -----------------------------------------------------------------------------
-- Fix process_referral() to use the correct column name: referred_id
-- -----------------------------------------------------------------------------

/* Drop any in-memory version so CREATE OR REPLACE won’t conflict */
DROP FUNCTION IF EXISTS process_referral(TEXT, UUID);

CREATE OR REPLACE FUNCTION process_referral(
  p_referral_code TEXT,
  p_referred_user_id UUID        -- <- same signature, safer for callers
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referrer_id        UUID;
  v_referral_code_id   UUID;
  v_existing_referral  RECORD;
BEGIN
  /* ---------- Validation ---------- */
  IF p_referral_code IS NULL OR LENGTH(TRIM(p_referral_code)) = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Referral code is required');
  END IF;

  IF p_referred_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User ID is required');
  END IF;

  p_referral_code := UPPER(TRIM(p_referral_code));

  /* ---------- Duplicate-use check ---------- */
  SELECT 1 INTO v_existing_referral
  FROM referrals
  WHERE referred_id = p_referred_user_id;      -- <<< fixed column name

  IF FOUND THEN
    RETURN json_build_object('success', false, 'error', 'You have already used a referral code');
  END IF;

  /* ---------- Locate code / referrer ---------- */
  SELECT id, user_id
    INTO v_referral_code_id, v_referrer_id
  FROM referral_codes
  WHERE code = p_referral_code
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or inactive referral code');
  END IF;

  IF v_referrer_id = p_referred_user_id THEN
    RETURN json_build_object('success', false, 'error', 'You cannot use your own referral code');
  END IF;

  /* ---------- Record the referral ---------- */
  INSERT INTO referrals (referrer_id, referred_id, referral_code_id, status)   -- <<< fixed column name
  VALUES (v_referrer_id, p_referred_user_id, v_referral_code_id, 'completed');

  /* ---------- Update referral code stats ---------- */
  UPDATE referral_codes
     SET used_count = used_count + 1,
         updated_at = NOW()
   WHERE id = v_referral_code_id;

  /* ---------- Coin awards ---------- */
  -- New user
  INSERT INTO user_coins (user_id, balance, lifetime_earned)
  VALUES (p_referred_user_id, 25, 25)
  ON CONFLICT (user_id) DO UPDATE
    SET balance         = user_coins.balance + 25,
        lifetime_earned = user_coins.lifetime_earned + 25,
        updated_at      = NOW();

  -- Referrer
  INSERT INTO user_coins (user_id, balance, lifetime_earned)
  VALUES (v_referrer_id, 10, 10)
  ON CONFLICT (user_id) DO UPDATE
    SET balance         = user_coins.balance + 10,
        lifetime_earned = user_coins.lifetime_earned + 10,
        updated_at      = NOW();

  RETURN json_build_object(
    'success',        true,
    'message',        'Referral processed successfully! You earned 25 coins.',
    'coins_earned',   25,
    'referrer_coins', 10
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error',   'An error occurred while processing the referral: ' || SQLERRM
    );
END;
$$;

-- Ensure authenticated role can execute
GRANT EXECUTE ON FUNCTION process_referral(TEXT, UUID) TO authenticated;
