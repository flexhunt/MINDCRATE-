-- Create daily_rewards table if it doesn't exist
CREATE TABLE IF NOT EXISTS daily_rewards (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_claimed_at TIMESTAMPTZ,
  streak_count INTEGER DEFAULT 0,
  total_claims INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE daily_rewards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own daily rewards" ON daily_rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily rewards" ON daily_rewards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily rewards" ON daily_rewards
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to check if user can claim daily reward
CREATE OR REPLACE FUNCTION can_claim_daily_reward(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  last_claim TIMESTAMPTZ;
  today_start TIMESTAMPTZ;
BEGIN
  -- Get today's start time in UTC
  today_start := DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC');
  
  -- Get user's last claim time
  SELECT last_claimed_at INTO last_claim
  FROM daily_rewards
  WHERE user_id = p_user_id;
  
  -- If no record exists, user can claim
  IF last_claim IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- If last claim was before today, user can claim
  IF last_claim < today_start THEN
    RETURN TRUE;
  END IF;
  
  -- Otherwise, user cannot claim
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to claim daily reward
CREATE OR REPLACE FUNCTION claim_daily_reward(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  can_claim BOOLEAN;
  current_streak INTEGER := 0;
  last_claim TIMESTAMPTZ;
  yesterday_start TIMESTAMPTZ;
  today_start TIMESTAMPTZ;
  reward_amount INTEGER := 5;
  current_balance INTEGER := 0;
  new_balance INTEGER := 0;
  lifetime_earned INTEGER := 0;
  result JSON;
BEGIN
  -- Check if user can claim
  SELECT can_claim_daily_reward(p_user_id) INTO can_claim;
  
  IF NOT can_claim THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Daily reward already claimed today'
    );
  END IF;
  
  -- Get current time boundaries
  today_start := DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC');
  yesterday_start := today_start - INTERVAL '1 day';
  
  -- Get user's current streak and last claim
  SELECT last_claimed_at, streak_count INTO last_claim, current_streak
  FROM daily_rewards
  WHERE user_id = p_user_id;
  
  -- Calculate new streak
  IF last_claim IS NULL THEN
    -- First time claiming
    current_streak := 1;
  ELSIF last_claim >= yesterday_start AND last_claim < today_start THEN
    -- Claimed yesterday, continue streak
    current_streak := current_streak + 1;
  ELSE
    -- Streak broken, reset to 1
    current_streak := 1;
  END IF;
  
  -- Get current coin balance
  SELECT balance, lifetime_earned INTO current_balance, lifetime_earned
  FROM user_coins
  WHERE user_id = p_user_id;
  
  IF current_balance IS NULL THEN
    current_balance := 0;
    lifetime_earned := 0;
  END IF;
  
  new_balance := current_balance + reward_amount;
  
  -- Update or insert daily rewards record
  INSERT INTO daily_rewards (user_id, last_claimed_at, streak_count, total_claims)
  VALUES (p_user_id, NOW(), current_streak, 1)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    last_claimed_at = NOW(),
    streak_count = current_streak,
    total_claims = daily_rewards.total_claims + 1,
    updated_at = NOW();
  
  -- Update user coins
  INSERT INTO user_coins (user_id, balance, lifetime_earned)
  VALUES (p_user_id, new_balance, lifetime_earned + reward_amount)
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance = new_balance,
    lifetime_earned = user_coins.lifetime_earned + reward_amount,
    updated_at = NOW();
  
  -- Record transaction
  INSERT INTO coin_transactions (user_id, amount, balance_after, transaction_type, description, metadata)
  VALUES (
    p_user_id,
    reward_amount,
    new_balance,
    'daily_reward',
    'Daily login reward',
    json_build_object('streak', current_streak, 'claim_date', NOW())
  );
  
  -- Return success result
  RETURN json_build_object(
    'success', true,
    'coins_awarded', reward_amount,
    'new_balance', new_balance,
    'streak', current_streak,
    'message', 'Daily reward claimed successfully!'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', 'Failed to claim daily reward: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user stats
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  coin_balance INTEGER := 0;
  courses_completed INTEGER := 0;
  quiz_best_score INTEGER := 0;
  current_streak INTEGER := 0;
  chat_messages INTEGER := 0;
  articles_read INTEGER := 0;
  can_claim_reward BOOLEAN := false;
  result JSON;
BEGIN
  -- Get coin balance
  SELECT COALESCE(balance, 0) INTO coin_balance
  FROM user_coins
  WHERE user_id = p_user_id;
  
  -- Get courses completed (purchased courses)
  SELECT COUNT(*) INTO courses_completed
  FROM course_purchases
  WHERE user_id = p_user_id;
  
  -- Get best quiz score
  SELECT COALESCE(MAX(score), 0) INTO quiz_best_score
  FROM quiz_attempts
  WHERE user_id = p_user_id;
  
  -- Get current streak
  SELECT COALESCE(streak_count, 0) INTO current_streak
  FROM daily_rewards
  WHERE user_id = p_user_id;
  
  -- Get chat messages count
  SELECT COUNT(*) INTO chat_messages
  FROM global_chat_messages
  WHERE user_id = p_user_id;
  
  -- Get articles read (we'll use a placeholder for now)
  articles_read := 0;
  
  -- Check if can claim daily reward
  SELECT can_claim_daily_reward(p_user_id) INTO can_claim_reward;
  
  RETURN json_build_object(
    'coins', coin_balance,
    'courses_completed', courses_completed,
    'quiz_best_score', quiz_best_score,
    'current_streak', current_streak,
    'chat_messages', chat_messages,
    'articles_read', articles_read,
    'can_claim_daily_reward', can_claim_reward
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
