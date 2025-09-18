-- Create the add_coins function that's missing
CREATE OR REPLACE FUNCTION add_coins(
    p_user_id UUID,
    p_amount INTEGER,
    p_source TEXT DEFAULT 'manual'
)
RETURNS JSON AS $$
DECLARE
    current_balance INTEGER := 0;
    new_balance INTEGER := 0;
    lifetime_earned INTEGER := 0;
    result JSON;
BEGIN
    -- Get current balance
    SELECT COALESCE(balance, 0), COALESCE(lifetime_earned, 0) 
    INTO current_balance, lifetime_earned
    FROM user_coins 
    WHERE user_id = p_user_id;
    
    -- Calculate new balance
    new_balance := current_balance + p_amount;
    
    -- Update or insert user coins
    INSERT INTO user_coins (user_id, balance, lifetime_earned, updated_at)
    VALUES (p_user_id, new_balance, lifetime_earned + GREATEST(p_amount, 0), NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        balance = new_balance,
        lifetime_earned = CASE 
            WHEN p_amount > 0 THEN user_coins.lifetime_earned + p_amount
            ELSE user_coins.lifetime_earned
        END,
        updated_at = NOW();
    
    -- Record transaction
    INSERT INTO coin_transactions (user_id, amount, balance_after, transaction_type, description, created_at)
    VALUES (
        p_user_id,
        p_amount,
        new_balance,
        p_source,
        CASE p_source
            WHEN 'daily_reward' THEN 'Daily login reward'
            WHEN 'quiz_completion' THEN 'Quiz completion bonus'
            WHEN 'course_purchase' THEN 'Course purchase'
            ELSE 'Coin transaction'
        END,
        NOW()
    );
    
    -- Return success result
    RETURN json_build_object(
        'success', true,
        'amount_added', p_amount,
        'new_balance', new_balance,
        'previous_balance', current_balance,
        'source', p_source
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', 'Failed to add coins: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_coins(UUID, INTEGER, TEXT) TO authenticated;

-- Create simplified claim daily reward function
CREATE OR REPLACE FUNCTION claim_daily_reward_simple(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    last_claim_date DATE;
    today_date DATE;
    current_streak INTEGER := 0;
    new_streak INTEGER := 1;
    reward_amount INTEGER := 5;
    coin_result JSON;
    result JSON;
BEGIN
    -- Get today's date
    today_date := CURRENT_DATE;
    
    -- Check if already claimed today
    SELECT last_claimed_at::date, streak_count 
    INTO last_claim_date, current_streak
    FROM daily_rewards
    WHERE user_id = p_user_id;
    
    -- If already claimed today, return error
    IF last_claim_date = today_date THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Daily reward already claimed today'
        );
    END IF;
    
    -- Calculate new streak
    IF last_claim_date IS NULL THEN
        -- First time claiming
        new_streak := 1;
    ELSIF last_claim_date = today_date - INTERVAL '1 day' THEN
        -- Claimed yesterday, continue streak
        new_streak := COALESCE(current_streak, 0) + 1;
    ELSE
        -- Streak broken, reset to 1
        new_streak := 1;
    END IF;
    
    -- Add coins using the add_coins function
    SELECT add_coins(p_user_id, reward_amount, 'daily_reward') INTO coin_result;
    
    -- Check if coin addition was successful
    IF (coin_result->>'success')::boolean = false THEN
        RETURN coin_result;
    END IF;
    
    -- Update daily reward record
    INSERT INTO daily_rewards (user_id, last_claimed_at, streak_count, total_claims)
    VALUES (p_user_id, NOW(), new_streak, 1)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        last_claimed_at = NOW(),
        streak_count = new_streak,
        total_claims = daily_rewards.total_claims + 1,
        updated_at = NOW();
    
    -- Return success result
    RETURN json_build_object(
        'success', true,
        'reward_amount', reward_amount,
        'streak', new_streak,
        'new_balance', (coin_result->>'new_balance')::integer,
        'message', 'Daily reward claimed successfully!'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', 'Failed to claim daily reward: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION claim_daily_reward_simple(UUID) TO authenticated;
