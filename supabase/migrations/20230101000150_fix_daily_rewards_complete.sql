-- Drop existing daily_rewards table completely
DROP TABLE IF EXISTS daily_rewards CASCADE;

-- Create fresh daily_rewards table with correct structure
CREATE TABLE daily_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    last_claimed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    streak_count INTEGER DEFAULT 1 NOT NULL,
    total_claims INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE daily_rewards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own daily rewards" ON daily_rewards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily rewards" ON daily_rewards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily rewards" ON daily_rewards
    FOR UPDATE USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_daily_rewards_user_id ON daily_rewards(user_id);
CREATE INDEX idx_daily_rewards_last_claimed ON daily_rewards(last_claimed_at);

-- Create function to check if user can claim daily reward
CREATE OR REPLACE FUNCTION can_claim_daily_reward(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    last_claim_date DATE;
    today_date DATE;
BEGIN
    -- Get today's date
    today_date := CURRENT_DATE;
    
    -- Get user's last claim date
    SELECT last_claimed_at::date INTO last_claim_date
    FROM daily_rewards
    WHERE user_id = p_user_id;
    
    -- If no record exists, user can claim
    IF last_claim_date IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- If last claim was before today, user can claim
    IF last_claim_date < today_date THEN
        RETURN TRUE;
    END IF;
    
    -- Otherwise, user cannot claim
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user daily reward status
CREATE OR REPLACE FUNCTION get_daily_reward_status(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    reward_record daily_rewards;
    can_claim BOOLEAN;
    result JSON;
BEGIN
    -- Get user's daily reward record
    SELECT * INTO reward_record
    FROM daily_rewards
    WHERE user_id = p_user_id;
    
    -- Check if user can claim
    SELECT can_claim_daily_reward(p_user_id) INTO can_claim;
    
    -- Return status
    RETURN json_build_object(
        'can_claim', can_claim,
        'current_streak', COALESCE(reward_record.streak_count, 0),
        'total_claims', COALESCE(reward_record.total_claims, 0),
        'last_claimed_at', reward_record.last_claimed_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION can_claim_daily_reward(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_reward_status(UUID) TO authenticated;
