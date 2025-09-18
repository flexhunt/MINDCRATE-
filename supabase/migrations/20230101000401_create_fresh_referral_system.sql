-- Create fresh referral system from scratch
-- Simple and clean approach

-- 1. Referral codes table - one per user, unlimited usage
CREATE TABLE referral_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    total_uses INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Referrals table - track who referred whom
CREATE TABLE referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    referral_code TEXT NOT NULL,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed')),
    referrer_coins INTEGER DEFAULT 50,
    referred_coins INTEGER DEFAULT 25,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicates and self-referrals
    UNIQUE(referrer_id, referred_id),
    CHECK (referrer_id != referred_id)
);

-- Create indexes
CREATE INDEX idx_referral_codes_user ON referral_codes(user_id);
CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_id);

-- Enable RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own referral code" ON referral_codes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own referral code" ON referral_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their referrals" ON referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Anyone can insert referrals" ON referrals
    FOR INSERT WITH CHECK (true);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_unique_referral_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 8 character code
        new_code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if exists
        SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = new_code) INTO code_exists;
        
        -- Return if unique
        IF NOT code_exists THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to create referral code for new users
CREATE OR REPLACE FUNCTION create_referral_code_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO referral_codes (user_id, code)
    VALUES (NEW.id, generate_unique_referral_code())
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new users
CREATE TRIGGER trigger_create_referral_code
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_referral_code_for_user();

-- Simple function to get referral stats
CREATE OR REPLACE FUNCTION get_user_referral_stats(user_uuid UUID)
RETURNS TABLE(
    referral_code TEXT,
    referral_link TEXT,
    total_referrals BIGINT,
    successful_referrals BIGINT,
    total_coins_earned BIGINT,
    referral_level INTEGER,
    recent_referrals JSON
) AS $$
DECLARE
    user_code TEXT;
    base_url TEXT := 'https://yourapp.com';
BEGIN
    -- Get user's referral code
    SELECT code INTO user_code FROM referral_codes WHERE user_id = user_uuid;
    
    -- If no code exists, create one
    IF user_code IS NULL THEN
        user_code := generate_unique_referral_code();
        INSERT INTO referral_codes (user_id, code) VALUES (user_uuid, user_code);
    END IF;
    
    -- Return stats
    RETURN QUERY
    SELECT 
        user_code as referral_code,
        (base_url || '/signup?ref=' || user_code) as referral_link,
        COALESCE((SELECT COUNT(*) FROM referrals WHERE referrer_id = user_uuid), 0) as total_referrals,
        COALESCE((SELECT COUNT(*) FROM referrals WHERE referrer_id = user_uuid AND status = 'completed'), 0) as successful_referrals,
        COALESCE((SELECT COUNT(*) FROM referrals WHERE referrer_id = user_uuid AND status = 'completed'), 0) * 50 as total_coins_earned,
        CASE 
            WHEN COALESCE((SELECT COUNT(*) FROM referrals WHERE referrer_id = user_uuid AND status = 'completed'), 0) >= 100 THEN 5
            WHEN COALESCE((SELECT COUNT(*) FROM referrals WHERE referrer_id = user_uuid AND status = 'completed'), 0) >= 50 THEN 4
            WHEN COALESCE((SELECT COUNT(*) FROM referrals WHERE referrer_id = user_uuid AND status = 'completed'), 0) >= 25 THEN 3
            WHEN COALESCE((SELECT COUNT(*) FROM referrals WHERE referrer_id = user_uuid AND status = 'completed'), 0) >= 10 THEN 2
            ELSE 1
        END as referral_level,
        COALESCE((
            SELECT json_agg(
                json_build_object(
                    'id', r.id,
                    'referred_user', COALESCE(p.username, p.name, 'Anonymous'),
                    'status', r.status,
                    'coins_earned', r.referrer_coins,
                    'created_at', r.created_at
                ) ORDER BY r.created_at DESC
            )
            FROM (
                SELECT * FROM referrals 
                WHERE referrer_id = user_uuid 
                ORDER BY created_at DESC 
                LIMIT 10
            ) r
            LEFT JOIN profiles p ON r.referred_id = p.id
        ), '[]'::json) as recent_referrals;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process referral
CREATE OR REPLACE FUNCTION process_user_referral(ref_code TEXT, new_user_id UUID)
RETURNS JSON AS $$
DECLARE
    referrer_user_id UUID;
    referral_record_id UUID;
    result JSON;
BEGIN
    -- Find referrer by code
    SELECT user_id INTO referrer_user_id 
    FROM referral_codes 
    WHERE code = upper(ref_code);
    
    -- Check if code exists
    IF referrer_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Invalid referral code');
    END IF;
    
    -- Prevent self-referral
    IF referrer_user_id = new_user_id THEN
        RETURN json_build_object('success', false, 'error', 'Cannot refer yourself');
    END IF;
    
    -- Check if already referred
    IF EXISTS(SELECT 1 FROM referrals WHERE referred_id = new_user_id) THEN
        RETURN json_build_object('success', false, 'error', 'User already referred');
    END IF;
    
    -- Create referral record
    INSERT INTO referrals (referrer_id, referred_id, referral_code, status)
    VALUES (referrer_user_id, new_user_id, upper(ref_code), 'completed')
    RETURNING id INTO referral_record_id;
    
    -- Update referral code usage
    UPDATE referral_codes 
    SET total_uses = total_uses + 1 
    WHERE user_id = referrer_user_id;
    
    -- Add coins to referrer
    INSERT INTO coin_transactions (user_id, amount, transaction_type, description)
    VALUES (referrer_user_id, 50, 'referral_bonus', 'Referral bonus for inviting new user');
    
    -- Add coins to referred user
    INSERT INTO coin_transactions (user_id, amount, transaction_type, description)
    VALUES (new_user_id, 25, 'referred_bonus', 'Welcome bonus for joining with referral');
    
    -- Update coin balances
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
    
    RETURN json_build_object(
        'success', true,
        'referral_id', referral_record_id,
        'referrer_coins', 50,
        'referred_coins', 25,
        'message', 'Referral processed successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_referral_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION process_user_referral(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_unique_referral_code() TO authenticated;
