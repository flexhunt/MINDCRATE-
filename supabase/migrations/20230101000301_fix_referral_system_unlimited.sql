-- Remove expiration and usage limits from referral system
-- Make referral codes unlimited and permanent

-- Drop the existing process_referral function and recreate without limits
DROP FUNCTION IF EXISTS process_referral(TEXT, UUID);

-- Recreate process_referral function without expiration/usage limits
CREATE OR REPLACE FUNCTION process_referral(
    p_referral_code TEXT,
    p_referred_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_referral_code_record RECORD;
    v_referrer_id UUID;
    v_referral_id UUID;
    v_referrer_coins INTEGER := 50; -- Coins for referrer
    v_referred_coins INTEGER := 25; -- Coins for referred user
    v_result JSONB;
BEGIN
    -- Get referral code details (simplified - no expiration/usage checks)
    SELECT rc.*, rc.user_id as referrer_id
    INTO v_referral_code_record
    FROM referral_codes rc
    WHERE rc.code = p_referral_code
    AND rc.is_active = true;
    
    -- Check if referral code exists and is valid
    IF v_referral_code_record IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid referral code'
        );
    END IF;
    
    v_referrer_id := v_referral_code_record.referrer_id;
    
    -- Prevent self-referral
    IF v_referrer_id = p_referred_user_id THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cannot refer yourself'
        );
    END IF;
    
    -- Check if user has already been referred by this referrer
    IF EXISTS(
        SELECT 1 FROM referrals 
        WHERE referrer_id = v_referrer_id 
        AND referred_id = p_referred_user_id
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User has already been referred by this referrer'
        );
    END IF;
    
    -- Check if user has already been referred by anyone
    IF EXISTS(
        SELECT 1 FROM referrals 
        WHERE referred_id = p_referred_user_id 
        AND status = 'completed'
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User has already been referred'
        );
    END IF;
    
    -- Create referral record
    INSERT INTO referrals (
        referrer_id,
        referred_id,
        referral_code_id,
        status,
        referrer_reward_coins,
        referred_reward_coins,
        completed_at
    ) VALUES (
        v_referrer_id,
        p_referred_user_id,
        v_referral_code_record.id,
        'completed',
        v_referrer_coins,
        v_referred_coins,
        NOW()
    ) RETURNING id INTO v_referral_id;
    
    -- Award coins to referrer
    INSERT INTO coin_transactions (
        user_id,
        amount,
        balance_after,
        transaction_type,
        description,
        metadata
    ) VALUES (
        v_referrer_id,
        v_referrer_coins,
        (SELECT COALESCE(balance, 0) + v_referrer_coins FROM user_coins WHERE user_id = v_referrer_id),
        'referral_bonus',
        'Referral bonus for inviting a new user',
        jsonb_build_object('referral_id', v_referral_id, 'referred_user_id', p_referred_user_id)
    );
    
    -- Award coins to referred user
    INSERT INTO coin_transactions (
        user_id,
        amount,
        balance_after,
        transaction_type,
        description,
        metadata
    ) VALUES (
        p_referred_user_id,
        v_referred_coins,
        (SELECT COALESCE(balance, 0) + v_referred_coins FROM user_coins WHERE user_id = p_referred_user_id),
        'referred_bonus',
        'Welcome bonus for joining with a referral code',
        jsonb_build_object('referral_id', v_referral_id, 'referrer_user_id', v_referrer_id)
    );
    
    -- Update user coin balances
    INSERT INTO user_coins (user_id, balance, lifetime_earned, updated_at)
    VALUES (
        v_referrer_id,
        (SELECT COALESCE(balance, 0) + v_referrer_coins FROM user_coins WHERE user_id = v_referrer_id),
        (SELECT COALESCE(lifetime_earned, 0) + v_referrer_coins FROM user_coins WHERE user_id = v_referrer_id),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        balance = user_coins.balance + v_referrer_coins,
        lifetime_earned = user_coins.lifetime_earned + v_referrer_coins,
        updated_at = NOW();
    
    INSERT INTO user_coins (user_id, balance, lifetime_earned, updated_at)
    VALUES (
        p_referred_user_id,
        (SELECT COALESCE(balance, 0) + v_referred_coins FROM user_coins WHERE user_id = p_referred_user_id),
        (SELECT COALESCE(lifetime_earned, 0) + v_referred_coins FROM user_coins WHERE user_id = p_referred_user_id),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        balance = user_coins.balance + v_referred_coins,
        lifetime_earned = user_coins.lifetime_earned + v_referred_coins,
        updated_at = NOW();
    
    -- Update referral code usage count (just for stats)
    UPDATE referral_codes 
    SET total_uses = total_uses + 1, updated_at = NOW()
    WHERE id = v_referral_code_record.id;
    
    -- Update referral analytics
    UPDATE referral_analytics 
    SET 
        total_referrals = total_referrals + 1,
        successful_referrals = successful_referrals + 1,
        total_coins_earned = total_coins_earned + v_referrer_coins,
        updated_at = NOW()
    WHERE user_id = v_referrer_id;
    
    -- Create referral reward records
    INSERT INTO referral_rewards (referral_id, user_id, reward_type, coins_awarded)
    VALUES 
        (v_referral_id, v_referrer_id, 'referrer', v_referrer_coins),
        (v_referral_id, p_referred_user_id, 'referred', v_referred_coins);
    
    RETURN jsonb_build_object(
        'success', true,
        'referral_id', v_referral_id,
        'referrer_coins', v_referrer_coins,
        'referred_coins', v_referred_coins,
        'message', 'Referral processed successfully'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to create referral codes for existing users who don't have them
CREATE OR REPLACE FUNCTION create_missing_referral_codes()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_user RECORD;
BEGIN
    -- Create referral codes for users who don't have them
    FOR v_user IN 
        SELECT au.id 
        FROM auth.users au
        LEFT JOIN referral_codes rc ON rc.user_id = au.id
        WHERE rc.id IS NULL
    LOOP
        INSERT INTO referral_codes (user_id, code)
        VALUES (v_user.id, generate_referral_code());
        
        INSERT INTO referral_analytics (user_id)
        VALUES (v_user.id)
        ON CONFLICT (user_id) DO NOTHING;
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;
