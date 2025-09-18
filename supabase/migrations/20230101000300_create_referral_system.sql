-- Create referral system tables
CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    total_uses INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    referral_code_id UUID REFERENCES referral_codes(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    referrer_reward_coins INTEGER DEFAULT 0,
    referred_reward_coins INTEGER DEFAULT 0,
    referrer_reward_claimed BOOLEAN DEFAULT false,
    referred_reward_claimed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    metadata JSONB DEFAULT '{}',
    
    -- Prevent self-referrals and duplicate referrals
    CONSTRAINT no_self_referral CHECK (referrer_id != referred_id),
    CONSTRAINT unique_referral UNIQUE (referrer_id, referred_id)
);

CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referral_id UUID REFERENCES referrals(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reward_type TEXT NOT NULL CHECK (reward_type IN ('referrer', 'referred')),
    coins_awarded INTEGER NOT NULL,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    transaction_id UUID REFERENCES coin_transactions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS referral_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    total_referrals INTEGER DEFAULT 0,
    successful_referrals INTEGER DEFAULT 0,
    total_coins_earned INTEGER DEFAULT 0,
    referral_level INTEGER DEFAULT 1, -- For multi-level referrals
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_referral_rewards_user_id ON referral_rewards(user_id);
CREATE INDEX idx_referral_analytics_user_id ON referral_analytics(user_id);

-- RLS Policies
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_analytics ENABLE ROW LEVEL SECURITY;

-- Referral codes policies
CREATE POLICY "Users can view their own referral codes" ON referral_codes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral codes" ON referral_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own referral codes" ON referral_codes
    FOR UPDATE USING (auth.uid() = user_id);

-- Referrals policies
CREATE POLICY "Users can view their referrals" ON referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "System can create referrals" ON referrals
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update referrals" ON referrals
    FOR UPDATE USING (true);

-- Referral rewards policies
CREATE POLICY "Users can view their own rewards" ON referral_rewards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create rewards" ON referral_rewards
    FOR INSERT WITH CHECK (true);

-- Referral analytics policies
CREATE POLICY "Users can view their own analytics" ON referral_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage analytics" ON referral_analytics
    FOR ALL USING (true);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 8-character code with letters and numbers
        code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM referral_codes WHERE referral_codes.code = code) INTO exists;
        
        -- If code doesn't exist, return it
        IF NOT exists THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to create referral code for new users
CREATE OR REPLACE FUNCTION create_user_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO referral_codes (user_id, code)
    VALUES (NEW.id, generate_referral_code());
    
    INSERT INTO referral_analytics (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create referral code when user signs up
CREATE TRIGGER create_referral_code_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_referral_code();

-- Function to process referral
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
    -- Get referral code details
    SELECT rc.*, rc.user_id as referrer_id
    INTO v_referral_code_record
    FROM referral_codes rc
    WHERE rc.code = p_referral_code
    AND rc.is_active = true;
    
    -- Check if referral code exists and is valid
    IF v_referral_code_record IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid or expired referral code'
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
    
    -- Update referral code usage count
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

-- Function to get referral stats
CREATE OR REPLACE FUNCTION get_referral_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_referrals', COALESCE(ra.total_referrals, 0),
        'successful_referrals', COALESCE(ra.successful_referrals, 0),
        'total_coins_earned', COALESCE(ra.total_coins_earned, 0),
        'referral_level', COALESCE(ra.referral_level, 1),
        'referral_code', rc.code,
        'referral_link', CONCAT(current_setting('app.base_url', true), '/signup?ref=', rc.code),
        'pending_referrals', (
            SELECT COUNT(*) FROM referrals 
            WHERE referrer_id = p_user_id AND status = 'pending'
        ),
        'recent_referrals', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', r.id,
                    'referred_user', p.name,
                    'status', r.status,
                    'coins_earned', r.referrer_reward_coins,
                    'created_at', r.created_at
                )
            )
            FROM referrals r
            LEFT JOIN profiles p ON p.id = r.referred_id
            WHERE r.referrer_id = p_user_id
            ORDER BY r.created_at DESC
            LIMIT 10
        )
    ) INTO v_stats
    FROM referral_analytics ra
    LEFT JOIN referral_codes rc ON rc.user_id = p_user_id
    WHERE ra.user_id = p_user_id;
    
    RETURN COALESCE(v_stats, jsonb_build_object(
        'total_referrals', 0,
        'successful_referrals', 0,
        'total_coins_earned', 0,
        'referral_level', 1,
        'referral_code', null,
        'referral_link', null,
        'pending_referrals', 0,
        'recent_referrals', '[]'::jsonb
    ));
END;
$$ LANGUAGE plpgsql;
