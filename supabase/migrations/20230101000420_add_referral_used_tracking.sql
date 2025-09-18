-- Add column to track if user has already used a referral code
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code_used BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS used_referral_code TEXT;

-- Update referral processing function to check if user already used code
CREATE OR REPLACE FUNCTION process_user_referral(ref_code TEXT, new_user_id UUID)
RETURNS JSON AS $$
DECLARE
    referrer_user_id UUID;
    user_already_referred BOOLEAN;
BEGIN
    -- Check if user already used a referral code
    SELECT referral_code_used INTO user_already_referred 
    FROM profiles 
    WHERE id = new_user_id;
    
    IF user_already_referred = true THEN
        RETURN json_build_object('success', false, 'error', 'You have already used a referral code');
    END IF;
    
    -- Find referrer
    SELECT user_id INTO referrer_user_id FROM referral_codes WHERE code = upper(ref_code);
    
    IF referrer_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Invalid referral code');
    END IF;
    
    IF referrer_user_id = new_user_id THEN
        RETURN json_build_object('success', false, 'error', 'Cannot refer yourself');
    END IF;
    
    -- Create referral record
    INSERT INTO referrals (referrer_id, referred_id, referral_code, status)
    VALUES (referrer_user_id, new_user_id, upper(ref_code), 'completed');
    
    -- Update usage count
    UPDATE referral_codes SET total_uses = total_uses + 1 WHERE user_id = referrer_user_id;
    
    -- Mark user as having used referral code
    UPDATE profiles 
    SET referral_code_used = true, used_referral_code = upper(ref_code)
    WHERE id = new_user_id;
    
    -- Add coins (with error handling)
    BEGIN
        -- Referrer gets 50 coins
        INSERT INTO coin_transactions (user_id, amount, transaction_type, description)
        VALUES (referrer_user_id, 50, 'referral_bonus', 'Referral bonus for inviting user');
        
        -- Referred user gets 25 coins
        INSERT INTO coin_transactions (user_id, amount, transaction_type, description)
        VALUES (new_user_id, 25, 'referred_bonus', 'Welcome bonus for using referral code');
        
        -- Update balances
        INSERT INTO user_coins (user_id, balance, lifetime_earned)
        VALUES (referrer_user_id, 50, 50)
        ON CONFLICT (user_id) DO UPDATE SET
            balance = user_coins.balance + 50,
            lifetime_earned = user_coins.lifetime_earned + 50;
            
        INSERT INTO user_coins (user_id, balance, lifetime_earned)
        VALUES (new_user_id, 25, 25)
        ON CONFLICT (user_id) DO UPDATE SET
            balance = user_coins.balance + 25,
            lifetime_earned = user_coins.lifetime_earned + 25;
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE WARNING 'Failed to add coins for referral: %', SQLERRM;
    END;
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Referral code applied successfully! You earned 25 coins, and your referrer earned 50 coins!'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
