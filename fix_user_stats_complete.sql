-- Drop and recreate user_stats table with ALL columns
DROP TABLE IF EXISTS user_stats CASCADE;

-- Create comprehensive user_stats table
CREATE TABLE user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_coins INTEGER DEFAULT 0,
  coins_earned INTEGER DEFAULT 0,
  coins_spent INTEGER DEFAULT 0,
  challenges_completed INTEGER DEFAULT 0,
  challenges_joined INTEGER DEFAULT 0,
  articles_read INTEGER DEFAULT 0,
  courses_completed INTEGER DEFAULT 0,
  courses_purchased INTEGER DEFAULT 0,
  quiz_attempts INTEGER DEFAULT 0,
  quiz_correct_answers INTEGER DEFAULT 0,
  login_streak INTEGER DEFAULT 0,
  max_login_streak INTEGER DEFAULT 0,
  days_active INTEGER DEFAULT 0,
  referrals_made INTEGER DEFAULT 0,
  referrals_completed INTEGER DEFAULT 0,
  badges_earned INTEGER DEFAULT 0,
  achievements_unlocked INTEGER DEFAULT 0,
  time_spent_learning INTEGER DEFAULT 0,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" ON user_stats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert stats" ON user_stats
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can do everything" ON user_stats
  FOR ALL USING (auth.role() = 'service_role');

-- Create safe functions
CREATE OR REPLACE FUNCTION increment_user_xp(user_id UUID, xp_amount INTEGER DEFAULT 1)
RETURNS void AS $$
BEGIN
  BEGIN
    INSERT INTO user_stats (user_id, xp, total_xp, level, last_active)
    VALUES (user_id, xp_amount, xp_amount, 1, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      xp = user_stats.xp + xp_amount,
      total_xp = user_stats.total_xp + xp_amount,
      level = CASE 
        WHEN (user_stats.total_xp + xp_amount) >= user_stats.level * 100 THEN user_stats.level + 1
        ELSE user_stats.level
      END,
      last_active = NOW(),
      updated_at = NOW();
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Failed to update user_stats for user %: %', user_id, SQLERRM;
  END;
  
  BEGIN
    UPDATE profiles 
    SET 
      xp = COALESCE(xp, 0) + xp_amount,
      level = CASE 
        WHEN (COALESCE(xp, 0) + xp_amount) >= COALESCE(level, 1) * 100 THEN COALESCE(level, 1) + 1
        ELSE COALESCE(level, 1)
      END,
      last_active = NOW()
    WHERE id = user_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Failed to update profiles for user %: %', user_id, SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_message_count(user_id UUID)
RETURNS void AS $$
BEGIN
  BEGIN
    INSERT INTO user_stats (user_id, total_messages, last_active)
    VALUES (user_id, 1, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      total_messages = user_stats.total_messages + 1,
      last_active = NOW(),
      updated_at = NOW();
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Failed to update user_stats message count for user %: %', user_id, SQLERRM;
  END;
  
  BEGIN
    UPDATE profiles 
    SET 
      total_messages = COALESCE(total_messages, 0) + 1,
      last_active = NOW()
    WHERE id = user_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Failed to update profiles message count for user %: %', user_id, SQLERRM;
  END;
  
  PERFORM increment_user_xp(user_id, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_user_coins(user_id UUID, coin_amount INTEGER, operation TEXT DEFAULT 'add')
RETURNS void AS $$
BEGIN
  BEGIN
    IF operation = 'add' THEN
      INSERT INTO user_stats (user_id, total_coins, coins_earned, last_active)
      VALUES (user_id, coin_amount, coin_amount, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        total_coins = user_stats.total_coins + coin_amount,
        coins_earned = user_stats.coins_earned + coin_amount,
        last_active = NOW(),
        updated_at = NOW();
    ELSIF operation = 'subtract' THEN
      INSERT INTO user_stats (user_id, total_coins, coins_spent, last_active)
      VALUES (user_id, -coin_amount, coin_amount, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        total_coins = GREATEST(user_stats.total_coins - coin_amount, 0),
        coins_spent = user_stats.coins_spent + coin_amount,
        last_active = NOW(),
        updated_at = NOW();
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Failed to update user_stats coins for user %: %', user_id, SQLERRM;
  END;
  
  BEGIN
    IF operation = 'add' THEN
      UPDATE profiles 
      SET 
        coins = COALESCE(coins, 0) + coin_amount,
        last_active = NOW()
      WHERE id = user_id;
    ELSIF operation = 'subtract' THEN
      UPDATE profiles 
      SET 
        coins = GREATEST(COALESCE(coins, 0) - coin_amount, 0),
        last_active = NOW()
      WHERE id = user_id;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Failed to update profiles coins for user %: %', user_id, SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Initialize stats for existing users
INSERT INTO user_stats (
  user_id, 
  level, 
  xp, 
  total_xp, 
  total_messages, 
  total_coins,
  login_streak,
  last_active,
  last_login
)
SELECT 
  id,
  COALESCE(level, 1),
  COALESCE(xp, 0),
  COALESCE(xp, 0),
  COALESCE(total_messages, 0),
  COALESCE(coins, 0),
  COALESCE(login_streak, 0),
  COALESCE(last_active, NOW()),
  COALESCE(last_active, NOW())
FROM profiles
ON CONFLICT (user_id) DO UPDATE SET
  level = EXCLUDED.level,
  xp = EXCLUDED.xp,
  total_xp = EXCLUDED.total_xp,
  total_messages = EXCLUDED.total_messages,
  total_coins = EXCLUDED.total_coins,
  login_streak = EXCLUDED.login_streak,
  last_active = EXCLUDED.last_active,
  last_login = EXCLUDED.last_login;

-- Create safe trigger function
CREATE OR REPLACE FUNCTION trigger_increment_message_count()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    PERFORM increment_message_count(NEW.user_id);
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Trigger failed for user %: %', NEW.user_id, SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (optional - the app works without it)
DROP TRIGGER IF EXISTS chat_message_stats_trigger ON global_chat_messages;
CREATE TRIGGER chat_message_stats_trigger
  AFTER INSERT ON global_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_increment_message_count();
