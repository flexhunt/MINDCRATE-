-- Drop everything referral-related to start fresh
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS referral_codes CASCADE;
DROP FUNCTION IF EXISTS process_referral CASCADE;
DROP FUNCTION IF EXISTS get_referral_stats CASCADE;
DROP FUNCTION IF EXISTS generate_referral_code CASCADE;

-- Create referral_codes table
CREATE TABLE referral_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    code TEXT NOT NULL UNIQUE,
    uses_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Create referrals table
CREATE TABLE referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    referral_code TEXT NOT NULL,
    coins_earned INTEGER DEFAULT 25,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(referred_id)
);

-- Add indexes
CREATE INDEX idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);

-- Enable RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_codes
CREATE POLICY "Users can view own referral code" ON referral_codes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own referral code" ON referral_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own referral code" ON referral_codes
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for referrals
CREATE POLICY "Users can view their referrals" ON referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "System can insert referrals" ON referrals
    FOR INSERT WITH CHECK (true);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
    attempts INTEGER := 0;
BEGIN
    LOOP
        new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
        SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = new_code) INTO code_exists;
        
        IF NOT code_exists OR attempts > 100 THEN
            EXIT;
        END IF;
        
        attempts := attempts + 1;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to process referral
CREATE OR REPLACE FUNCTION process_referral(
    p_referral_code TEXT,
    p_referred_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_referrer_id UUID;
    v_existing_referral INTEGER;
    v_current_balance INTEGER;
    v_referrer_balance INTEGER;
BEGIN
    -- Validate inputs
    IF p_referral_code IS NULL OR trim(p_referral_code) = '' THEN
        RETURN json_build_object('success', false, 'error', 'Referral code is required');
    END IF;
    
    IF p_referred_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User ID is required');
    END IF;
    
    -- Check if user already used a referral
    SELECT COUNT(*) INTO v_existing_referral
    FROM referrals
    WHERE referred_id = p_referred_user_id;
    
    IF v_existing_referral > 0 THEN
        RETURN json_build_object('success', false, 'error', 'You have already used a referral code');
    END IF;
    
    -- Find referrer
    SELECT user_id INTO v_referrer_id
    FROM referral_codes
    WHERE code = upper(trim(p_referral_code));
    
    IF v_referrer_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Invalid referral code');
    END IF;
    
    -- Check self-referral
    IF v_referrer_id = p_referred_user_id THEN
        RETURN json_build_object('success', false, 'error', 'Cannot use your own referral code');
    END IF;
    
    -- Add coins to referred user (25 coins)
    INSERT INTO user_coins (user_id, balance, lifetime_earned, created_at, updated_at)
    VALUES (p_referred_user_id, 25, 25, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        balance = user_coins.balance + 25,
        lifetime_earned = user_coins.lifetime_earned + 25,
        updated_at = NOW();
    
    -- Add coins to referrer (10 coins)
    INSERT INTO user_coins (user_id, balance, lifetime_earned, created_at, updated_at)
    VALUES (v_referrer_id, 10, 10, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        balance = user_coins.balance + 10,
        lifetime_earned = user_coins.lifetime_earned + 10,
        updated_at = NOW();
    
    -- Create referral record
    INSERT INTO referrals (referrer_id, referred_id, referral_code, coins_earned, created_at)
    VALUES (v_referrer_id, p_referred_user_id, upper(trim(p_referral_code)), 25, NOW());
    
    -- Update referral code usage
    UPDATE referral_codes
    SET uses_count = uses_count + 1, updated_at = NOW()
    WHERE user_id = v_referrer_id;
    
    -- Add coin transactions
    INSERT INTO coin_transactions (user_id, amount, balance_after, transaction_type, description, created_at)
    SELECT p_referred_user_id, 25, uc.balance, 'referral_bonus', 'Welcome bonus for using referral code', NOW()
    FROM user_coins uc WHERE uc.user_id = p_referred_user_id;
    
    INSERT INTO coin_transactions (user_id, amount, balance_after, transaction_type, description, created_at)
    SELECT v_referrer_id, 10, uc.balance, 'referral_reward', 'Reward for successful referral', NOW()
    FROM user_coins uc WHERE uc.user_id = v_referrer_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Referral code applied successfully! You earned 25 coins! 🎉',
        'coins_earned', 25
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', 'Database error: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_referral_code() TO authenticated;
GRANT EXECUTE ON FUNCTION process_referral(TEXT, UUID) TO authenticated;

-- Create referral codes for existing users
INSERT INTO referral_codes (user_id, code, uses_count, created_at, updated_at)
SELECT 
    id,
    generate_referral_code(),
    0,
    NOW(),
    NOW()
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM referral_codes)
ON CONFLICT (user_id) DO NOTHING;
