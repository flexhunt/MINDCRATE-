-- Drop existing daily_rewards table if it exists
DROP TABLE IF EXISTS daily_rewards CASCADE;

-- Create daily_rewards table with correct structure
CREATE TABLE daily_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    reward_amount INTEGER DEFAULT 5 NOT NULL,
    current_streak INTEGER DEFAULT 1 NOT NULL,
    UNIQUE(user_id, created_at::date)
);

-- Enable RLS
ALTER TABLE daily_rewards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own daily rewards" ON daily_rewards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily rewards" ON daily_rewards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_daily_rewards_user_date ON daily_rewards(user_id, created_at::date);

-- Create function to claim daily reward
CREATE OR REPLACE FUNCTION claim_daily_reward(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    existing_claim daily_rewards;
    last_reward daily_rewards;
    new_streak INTEGER := 1;
    reward_amount INTEGER := 5;
    current_balance INTEGER := 0;
    new_balance INTEGER := 0;
    result JSON;
BEGIN
    -- Check if user already claimed today
    SELECT * INTO existing_claim
    FROM daily_rewards 
    WHERE user_id = p_user_id 
    AND created_at::date = CURRENT_DATE;

    IF FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Daily reward already claimed today'
        );
    END IF;

    -- Get last reward to calculate streak
    SELECT * INTO last_reward
    FROM daily_rewards 
    WHERE user_id = p_user_id 
    ORDER BY created_at DESC 
    LIMIT 1;

    -- Calculate streak
    IF FOUND THEN
        IF last_reward.created_at::date = (CURRENT_DATE - INTERVAL '1 day')::date THEN
            new_streak := last_reward.current_streak + 1;
        ELSE
            new_streak := 1;
        END IF;
    END IF;

    -- Insert new reward record
    INSERT INTO daily_rewards (user_id, reward_amount, current_streak)
    VALUES (p_user_id, reward_amount, new_streak);

    -- Get current coin balance
    SELECT COALESCE(balance, 0) INTO current_balance
    FROM user_coins 
    WHERE user_id = p_user_id;

    -- Calculate new balance
    new_balance := current_balance + reward_amount;

    -- Update user coins
    INSERT INTO user_coins (user_id, balance)
    VALUES (p_user_id, new_balance)
    ON CONFLICT (user_id) 
    DO UPDATE SET balance = new_balance;

    -- Return success result
    result := json_build_object(
        'success', true,
        'reward_amount', reward_amount,
        'new_balance', new_balance,
        'streak', new_streak
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION claim_daily_reward(UUID) TO authenticated;
