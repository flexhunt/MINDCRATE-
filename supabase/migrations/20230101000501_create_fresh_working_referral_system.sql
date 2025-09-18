CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    updated_at TIMESTAMP WITH TIME ZONE,
    username VARCHAR(150),
    full_name VARCHAR(255),
    avatar_url TEXT,
    website TEXT,
    referral_code VARCHAR(10) UNIQUE,
    used_referral_code VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_banned BOOLEAN DEFAULT FALSE
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individual read access" ON profiles FOR
SELECT
    USING (auth.uid() = id);

CREATE POLICY "Allow individual update access" ON profiles FOR
UPDATE
    USING (auth.uid() = id);

CREATE TABLE IF NOT EXISTS user_coins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    balance INTEGER DEFAULT 0,
    lifetime_earned INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_coins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individual read access" ON user_coins FOR
SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Allow individual update access" ON user_coins FOR
UPDATE
    USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS coin_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individual read access" ON coin_transactions FOR
SELECT
    USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individual read access" ON referrals FOR
SELECT
    TRUE;

-- Function to process referral codes
CREATE OR REPLACE FUNCTION process_referral(ref_code TEXT, new_user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    referrer_user_id UUID;
    current_balance INTEGER := 0;
    new_balance INTEGER := 0;
    result JSON;
BEGIN
    -- Check if user already used a referral code
    IF EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = new_user_uuid 
        AND used_referral_code IS NOT NULL
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'You have already used a referral code'
        );
    END IF;

    -- Find the referrer by referral code
    SELECT id INTO referrer_user_id
    FROM profiles
    WHERE referral_code = ref_code
    AND id != new_user_uuid; -- Can't refer yourself

    IF referrer_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid referral code'
        );
    END IF;

    -- Get current balance for new user (or create if doesn't exist)
    SELECT COALESCE(balance, 0) INTO current_balance
    FROM user_coins
    WHERE user_id = new_user_uuid;

    -- If no balance record exists, create one
    IF NOT FOUND THEN
        INSERT INTO user_coins (user_id, balance, lifetime_earned)
        VALUES (new_user_uuid, 0, 0);
        current_balance := 0;
    END IF;

    -- Calculate new balance
    new_balance := current_balance + 25;

    -- Update the new user's profile with used referral code
    UPDATE profiles
    SET used_referral_code = ref_code,
        updated_at = NOW()
    WHERE id = new_user_uuid;

    -- Add coins to new user's balance
    INSERT INTO user_coins (user_id, balance, lifetime_earned, updated_at)
    VALUES (new_user_uuid, new_balance, new_balance, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        balance = new_balance,
        lifetime_earned = user_coins.lifetime_earned + 25,
        updated_at = NOW();

    -- Record the transaction for new user
    INSERT INTO coin_transactions (
        user_id, 
        amount, 
        balance_after, 
        transaction_type, 
        description,
        created_at
    ) VALUES (
        new_user_uuid,
        25,
        new_balance,
        'referral_bonus',
        'Welcome bonus for using referral code: ' || ref_code,
        NOW()
    );

    -- Create referral record
    INSERT INTO referrals (referrer_id, referred_id, referral_code, status, created_at)
    VALUES (referrer_user_id, new_user_uuid, ref_code, 'completed', NOW());

    -- Also give bonus to referrer (optional - 10 coins)
    DECLARE
        referrer_current_balance INTEGER := 0;
        referrer_new_balance INTEGER := 0;
    BEGIN
        SELECT COALESCE(balance, 0) INTO referrer_current_balance
        FROM user_coins
        WHERE user_id = referrer_user_id;

        -- If referrer has no balance record, create one
        IF NOT FOUND THEN
            INSERT INTO user_coins (user_id, balance, lifetime_earned)
            VALUES (referrer_user_id, 0, 0);
            referrer_current_balance := 0;
        END IF;

        referrer_new_balance := referrer_current_balance + 10;

        -- Update referrer's balance
        INSERT INTO user_coins (user_id, balance, lifetime_earned, updated_at)
        VALUES (referrer_user_id, referrer_new_balance, referrer_new_balance, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            balance = referrer_new_balance,
            lifetime_earned = user_coins.lifetime_earned + 10,
            updated_at = NOW();

        -- Record transaction for referrer
        INSERT INTO coin_transactions (
            user_id, 
            amount, 
            balance_after, 
            transaction_type, 
            description,
            created_at
        ) VALUES (
            referrer_user_id,
            10,
            referrer_new_balance,
            'referral_reward',
            'Referral reward for user using code: ' || ref_code,
            NOW()
        );
    END;

    RETURN json_build_object(
        'success', true,
        'message', 'Referral code applied successfully! You earned 25 coins! 🎉'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to process referral: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
