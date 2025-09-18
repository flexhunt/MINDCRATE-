-- Drop existing referral tables if they exist
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS referral_codes CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS process_referral(TEXT, UUID);
DROP FUNCTION IF EXISTS get_referral_stats(UUID);
DROP FUNCTION IF EXISTS create_user_referral_code(UUID);
DROP FUNCTION IF EXISTS generate_referral_code();

-- Create referral_codes table
CREATE TABLE referral_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    code TEXT NOT NULL UNIQUE,
    total_uses INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id)
);

-- Create referrals table
CREATE TABLE referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    referral_code TEXT NOT NULL,
    referrer_coins INTEGER DEFAULT 50,
    referred_coins INTEGER DEFAULT 25,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(referred_id), -- One referral per user
    CHECK (referrer_id != referred_id) -- No self referrals
);

-- Add referral tracking to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_used_referral BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS used_referral_code TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);

-- Enable RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_codes
DROP POLICY IF EXISTS "Users can view own referral code" ON referral_codes;
CREATE POLICY "Users can view own referral code" ON referral_codes
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own referral code" ON referral_codes;
CREATE POLICY "Users can insert own referral code" ON referral_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own referral code" ON referral_codes;
CREATE POLICY "Users can update own referral code" ON referral_codes
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for referrals
DROP POLICY IF EXISTS "Users can view their referrals" ON referrals;
CREATE POLICY "Users can view their referrals" ON referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

DROP POLICY IF EXISTS "Users can insert referrals" ON referrals;
CREATE POLICY "Users can insert referrals" ON referrals
    FOR INSERT WITH CHECK (auth.uid() = referred_id);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
    attempts INTEGER := 0;
BEGIN
    LOOP
        -- Generate 6 character alphanumeric code
        new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = new_code) INTO code_exists;
        
        -- Exit if code is unique or we've tried too many times
        IF NOT code_exists OR attempts > 100 THEN
            EXIT;
        END IF;
        
        attempts := attempts + 1;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to ensure user has referral code
CREATE OR REPLACE FUNCTION ensure_user_referral_code(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    user_code TEXT;
BEGIN
    -- Check if user already has a referral code
    SELECT code INTO user_code FROM referral_codes WHERE user_id = user_uuid;
    
    -- If no code exists, create one
    IF user_code IS NULL THEN
        user_code := generate_referral_code();
        
        INSERT INTO referral_codes (user_id, code, total_uses, created_at, updated_at)
        VALUES (user_uuid, user_code, 0, NOW(), NOW())
        ON CONFLICT (user_id) DO UPDATE SET
            code = EXCLUDED.code,
            updated_at = NOW();
    END IF;
    
    RETURN user_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely add coins to user
CREATE OR REPLACE FUNCTION safe_add_coins(
    target_user_id UUID,
    coin_amount INTEGER,
    transaction_type TEXT,
    description TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    current_balance INTEGER := 0;
    new_balance INTEGER := 0;
BEGIN
    -- Get current balance or create record if doesn't exist
    SELECT COALESCE(balance, 0) INTO current_balance
    FROM user_coins
    WHERE user_id = target_user_id;
    
    -- If no record found, create one
    IF NOT FOUND THEN
        INSERT INTO user_coins (user_id, balance, lifetime_earned, created_at, updated_at)
        VALUES (target_user_id, 0, 0, NOW(), NOW());
        current_balance := 0;
    END IF;
    
    -- Calculate new balance
    new_balance := current_balance + coin_amount;
    
    -- Update user coins
    UPDATE user_coins 
    SET 
        balance = new_balance,
        lifetime_earned = CASE 
            WHEN coin_amount > 0 THEN lifetime_earned + coin_amount 
            ELSE lifetime_earned 
        END,
        updated_at = NOW()
    WHERE user_id = target_user_id;
    
    -- Record transaction
    INSERT INTO coin_transactions (
        user_id,
        amount,
        balance_after,
        transaction_type,
        description,
        created_at
    ) VALUES (
        target_user_id,
        coin_amount,
        new_balance,
        transaction_type,
        COALESCE(description, transaction_type),
        NOW()
    );
    
    RETURN json_build_object(
        'success', true,
        'old_balance', current_balance,
        'new_balance', new_balance,
        'amount_added', coin_amount
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Main function to process referral
CREATE OR REPLACE FUNCTION process_referral(ref_code TEXT, new_user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    referrer_uuid UUID;
    existing_referral_count INTEGER;
    coin_result JSON;
BEGIN
    -- Validate inputs
    IF ref_code IS NULL OR trim(ref_code) = '' THEN
        RETURN json_build_object('success', false, 'error', 'Referral code is required');
    END IF;
    
    IF new_user_uuid IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User ID is required');
    END IF;
    
    -- Clean the referral code
    ref_code := upper(trim(ref_code));
    
    -- Check if user has already used a referral code
    SELECT COUNT(*) INTO existing_referral_count
    FROM referrals
    WHERE referred_id = new_user_uuid;
    
    IF existing_referral_count > 0 THEN
        RETURN json_build_object('success', false, 'error', 'You have already used a referral code');
    END IF;
    
    -- Check if user has referral flag set in profile
    IF EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = new_user_uuid 
        AND has_used_referral = true
    ) THEN
        RETURN json_build_object('success', false, 'error', 'You have already used a referral code');
    END IF;
    
    -- Find the referrer by referral code
    SELECT user_id INTO referrer_uuid
    FROM referral_codes
    WHERE code = ref_code;
    
    IF referrer_uuid IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Invalid referral code');
    END IF;
    
    -- Check if user is trying to refer themselves
    IF referrer_uuid = new_user_uuid THEN
        RETURN json_build_object('success', false, 'error', 'You cannot refer yourself');
    END IF;
    
    -- Add coins to the new user (25 coins)
    SELECT safe_add_coins(
        new_user_uuid,
        25,
        'referral_bonus',
        'Welcome bonus for using referral code: ' || ref_code
    ) INTO coin_result;
    
    IF NOT (coin_result->>'success')::boolean THEN
        RETURN json_build_object('success', false, 'error', 'Failed to add coins to new user');
    END IF;
    
    -- Add coins to the referrer (50 coins)
    SELECT safe_add_coins(
        referrer_uuid,
        50,
        'referral_reward',
        'Referral reward for code: ' || ref_code
    ) INTO coin_result;
    
    IF NOT (coin_result->>'success')::boolean THEN
        RETURN json_build_object('success', false, 'error', 'Failed to add coins to referrer');
    END IF;
    
    -- Create the referral record
    INSERT INTO referrals (
        referrer_id,
        referred_id,
        referral_code,
        referrer_coins,
        referred_coins,
        status,
        created_at
    ) VALUES (
        referrer_uuid,
        new_user_uuid,
        ref_code,
        50,
        25,
        'completed',
        NOW()
    );
    
    -- Update the referral code usage count
    UPDATE referral_codes
    SET 
        total_uses = total_uses + 1,
        updated_at = NOW()
    WHERE user_id = referrer_uuid;
    
    -- Update the user's profile to mark referral as used
    UPDATE profiles
    SET 
        has_used_referral = true,
        used_referral_code = ref_code,
        updated_at = NOW()
    WHERE id = new_user_uuid;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Referral code applied successfully! You earned 25 coins! 🎉',
        'coins_earned', 25,
        'referrer_coins', 50
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Database error: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get referral stats for a user
CREATE OR REPLACE FUNCTION get_referral_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    user_code TEXT;
    total_referrals INTEGER;
    total_coins_earned INTEGER;
    recent_referrals JSON;
BEGIN
    -- Ensure user has a referral code
    user_code := ensure_user_referral_code(user_uuid);
    
    -- Get total referrals count
    SELECT COUNT(*) INTO total_referrals
    FROM referrals
    WHERE referrer_id = user_uuid;
    
    -- Calculate total coins earned from referrals
    SELECT COALESCE(SUM(referrer_coins), 0) INTO total_coins_earned
    FROM referrals
    WHERE referrer_id = user_uuid;
    
    -- Get recent referrals
    SELECT COALESCE(
        json_agg(
            json_build_object(
                'id', r.id,
                'created_at', r.created_at,
                'coins_earned', r.referrer_coins,
                'status', r.status
            ) ORDER BY r.created_at DESC
        ),
        '[]'::json
    ) INTO recent_referrals
    FROM (
        SELECT * FROM referrals
        WHERE referrer_id = user_uuid
        ORDER BY created_at DESC
        LIMIT 10
    ) r;
    
    RETURN json_build_object(
        'referral_code', user_code,
        'referral_link', 'https://mindcrate.vercel.app/signup?ref=' || user_code,
        'total_referrals', total_referrals,
        'total_coins_earned', total_coins_earned,
        'recent_referrals', recent_referrals
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION generate_referral_code() TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_user_referral_code(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION safe_add_coins(UUID, INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION process_referral(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_referral_stats(UUID) TO authenticated;

-- Create referral codes for existing users
INSERT INTO referral_codes (user_id, code, total_uses, created_at, updated_at)
SELECT 
    id,
    generate_referral_code(),
    0,
    NOW(),
    NOW()
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM referral_codes)
ON CONFLICT (user_id) DO NOTHING;
