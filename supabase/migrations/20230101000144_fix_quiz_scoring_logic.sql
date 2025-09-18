-- Update the dashboard stats function to match leaderboard logic exactly
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    user_coins_balance INTEGER DEFAULT 0;
    courses_completed INTEGER DEFAULT 0;
    quiz_total_score INTEGER DEFAULT 0;
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

    -- Get TOTAL quiz score (sum of all level scores) - SAME AS LEADERBOARD
    SELECT COALESCE(SUM(score), 0) INTO quiz_total_score
    FROM user_progress 
    WHERE user_id = p_user_id;

    -- Get chat messages count
    SELECT COUNT(*) INTO chat_messages_count
    FROM global_chat_messages 
    WHERE user_id = p_user_id;

    -- Get current streak from daily_rewards
    SELECT COALESCE(MAX(current_streak), 0) INTO current_streak
    FROM daily_rewards 
    WHERE user_id = p_user_id;

    -- Check if user can claim daily reward (not claimed today)
    SELECT NOT EXISTS (
        SELECT 1 FROM daily_rewards 
        WHERE user_id = p_user_id 
        AND created_at::date = CURRENT_DATE
    ) INTO can_claim_reward;

    -- Get articles read count from activities
    SELECT COUNT(*) INTO articles_read
    FROM user_activities 
    WHERE user_id = p_user_id 
    AND activity_type ILIKE '%article%';

    -- If no articles tracked, estimate based on other activity
    IF articles_read = 0 THEN
        articles_read := LEAST(chat_messages_count / 5, 20);
    END IF;

    -- Build result JSON
    result := json_build_object(
        'coins', user_coins_balance,
        'courses_completed', courses_completed,
        'quiz_total_score', quiz_total_score,
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
