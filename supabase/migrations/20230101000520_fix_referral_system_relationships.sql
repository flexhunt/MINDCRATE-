-- Drop existing referral tables if they exist
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS referral_codes CASCADE;

-- Create referral_codes table
CREATE TABLE referral_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referrals table (tracks who used whose code)
CREATE TABLE referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code VARCHAR(6) NOT NULL,
    coins_earned INTEGER DEFAULT 25,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referred_id) -- Each user can only be referred once
);

-- Create indexes for better performance
CREATE INDEX idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);

-- Enable RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_codes
CREATE POLICY "Users can view their own referral code" ON referral_codes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own referral code" ON referral_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own referral code" ON referral_codes
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for referrals
CREATE POLICY "Users can view referrals they made" ON referrals
    FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view referrals they received" ON referrals
    FOR SELECT USING (auth.uid() = referred_id);

CREATE POLICY "Anyone can insert referrals" ON referrals
    FOR INSERT WITH CHECK (true);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(6) AS $$
DECLARE
    new_code VARCHAR(6);
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a 6-character code with letters and numbers
        new_code := UPPER(
            CHR(65 + (RANDOM() * 25)::INT) ||
            CHR(65 + (RANDOM() * 25)::INT) ||
            CHR(65 + (RANDOM() * 25)::INT) ||
            (RANDOM() * 9)::INT ||
            (RANDOM() * 9)::INT ||
            (RANDOM() * 9)::INT
        );
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = new_code) INTO code_exists;
        
        -- If code doesn't exist, we can use it
        IF NOT code_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to create referral code for new users
CREATE OR REPLACE FUNCTION create_referral_code_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO referral_codes (user_id, code)
    VALUES (NEW.id, generate_referral_code());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create referral code when user signs up
CREATE TRIGGER create_referral_code_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_referral_code_for_user();

-- Function to process referral and add coins
CREATE OR REPLACE FUNCTION process_referral(
    p_referral_code VARCHAR(6),
    p_referred_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_referrer_id UUID;
    v_referral_exists BOOLEAN;
    v_result JSON;
BEGIN
    -- Check if user already used a referral code
    SELECT EXISTS(
        SELECT 1 FROM referrals WHERE referred_id = p_referred_user_id
    ) INTO v_referral_exists;
    
    IF v_referral_exists THEN
        RETURN json_build_object(
            'success', false,
            'error', 'You have already used a referral code'
        );
    END IF;
    
    -- Find the referrer
    SELECT user_id INTO v_referrer_id
    FROM referral_codes
    WHERE code = p_referral_code;
    
    IF v_referrer_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid referral code'
        );
    END IF;
    
    -- Can't refer yourself
    IF v_referrer_id = p_referred_user_id THEN
        RETURN json_build_object(
            'success', false,
            'error', 'You cannot use your own referral code'
        );
    END IF;
    
    -- Create the referral record
    INSERT INTO referrals (referrer_id, referred_id, referral_code, coins_earned)
    VALUES (v_referrer_id, p_referred_user_id, p_referral_code, 25);
    
    -- Add coins to both users (25 for referred, 10 for referrer)
    -- Add coins to referred user
    INSERT INTO user_coins (user_id, balance, earned_total)
    VALUES (p_referred_user_id, 25, 25)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        balance = user_coins.balance + 25,
        earned_total = user_coins.earned_total + 25;
    
    -- Add coins to referrer
    INSERT INTO user_coins (user_id, balance, earned_total)
    VALUES (v_referrer_id, 10, 10)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        balance = user_coins.balance + 10,
        earned_total = user_coins.earned_total + 10;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Referral processed successfully! You earned 25 coins!'
    );
END;
$$ LANGUAGE plpgsql;

-- Create referral codes for existing users who don't have one
INSERT INTO referral_codes (user_id, code)
SELECT 
    au.id,
    generate_referral_code()
FROM auth.users au
LEFT JOIN referral_codes rc ON au.id = rc.user_id
WHERE rc.user_id IS NULL;
