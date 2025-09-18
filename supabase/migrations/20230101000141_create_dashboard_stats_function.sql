-- Create function to get user dashboard stats
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    user_coins_balance INTEGER DEFAULT 0;
    courses_completed INTEGER DEFAULT 0;
    quiz_best_score INTEGER DEFAULT 0;
    chat_messages_count INTEGER DEFAULT 0;
    current_streak INTEGER DEFAULT 0;
    can_claim_reward BOOLEAN DEFAULT FALSE;
    articles_read INTEGER DEFAULT 0;
BEGIN
    -- Get user coins balance
    SELECT COALESCE(balance, 0) INTO user_coins_balance
    FROM user_coins 
    WHERE user_id = p_user_id;

    -- Get completed courses count
    SELECT COUNT(*) INTO courses_completed
    FROM user_courses 
    WHERE user_id = p_user_id;

    -- Get best quiz score from user_progress or quiz_attempts
    SELECT COALESCE(MAX(score), 0) INTO quiz_best_score
    FROM quiz_attempts 
    WHERE user_id = p_user_id;

    -- If quiz_attempts doesn't exist, try user_progress
    IF quiz_best_score = 0 THEN
        SELECT COALESCE(MAX(CAST(progress AS INTEGER)), 0) INTO quiz_best_score
        FROM user_progress 
        WHERE user_id = p_user_id 
        AND progress ~ '^[0-9]+$';
    END IF;

    -- Get chat messages count
    SELECT COUNT(*) INTO chat_messages_count
    FROM global_chat_messages 
    WHERE user_id = p_user_id;

    -- Get current streak from daily_rewards
    SELECT COALESCE(MAX(current_streak), 0) INTO current_streak
    FROM daily_rewards 
    WHERE user_id = p_user_id;

    -- Check if user can claim daily reward
    SELECT NOT EXISTS (
        SELECT 1 FROM daily_rewards 
        WHERE user_id = p_user_id 
        AND claimed_at::date = CURRENT_DATE
    ) INTO can_claim_reward;

    -- Get articles read (estimate from user activities or set default)
    SELECT COUNT(*) INTO articles_read
    FROM user_activities 
    WHERE user_id = p_user_id 
    AND activity_type ILIKE '%article%';

    -- If no articles tracked, use a default based on other activity
    IF articles_read = 0 THEN
        articles_read := LEAST(chat_messages_count / 10, 15);
    END IF;

    -- Build result JSON
    result := json_build_object(
        'coins', user_coins_balance,
        'courses_completed', courses_completed,
        'quiz_best_score', quiz_best_score,
        'chat_messages', chat_messages_count,
        'current_streak', current_streak,
        'can_claim_daily_reward', can_claim_reward,
        'articles_read', articles_read
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_dashboard_stats(UUID) TO authenticated;

-- Create RLS policy for daily_rewards if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'daily_rewards') THEN
        -- Create daily_rewards table if it doesn't exist
        CREATE TABLE daily_rewards (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            reward_amount INTEGER DEFAULT 5 NOT NULL,
            current_streak INTEGER DEFAULT 1 NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            UNIQUE(user_id, claimed_at::date)
        );

        -- Enable RLS
        ALTER TABLE daily_rewards ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        CREATE POLICY "Users can view own daily rewards" ON daily_rewards
            FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert own daily rewards" ON daily_rewards
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
