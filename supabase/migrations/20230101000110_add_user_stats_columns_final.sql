-- Add user stats columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_messages INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS challenges_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS articles_read INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS courses_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS login_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create user_stats table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  challenges_completed INTEGER DEFAULT 0,
  articles_read INTEGER DEFAULT 0,
  courses_completed INTEGER DEFAULT 0,
  login_streak INTEGER DEFAULT 0,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on user_stats
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_stats
CREATE POLICY "Users can view their own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" ON user_stats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert stats" ON user_stats
  FOR INSERT WITH CHECK (true);

-- Create function to increment user XP
CREATE OR REPLACE FUNCTION increment_user_xp(user_id UUID, xp_amount INTEGER DEFAULT 1)
RETURNS void AS $$
BEGIN
  -- Insert or update user stats
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
    
  -- Also update profiles table for backward compatibility
  UPDATE profiles 
  SET 
    xp = COALESCE(xp, 0) + xp_amount,
    level = CASE 
      WHEN (COALESCE(xp, 0) + xp_amount) >= level * 100 THEN level + 1
      ELSE level
    END,
    last_active = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment message count
CREATE OR REPLACE FUNCTION increment_message_count(user_id UUID)
RETURNS void AS $$
BEGIN
  -- Insert or update user stats
  INSERT INTO user_stats (user_id, total_messages, last_active)
  VALUES (user_id, 1, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    total_messages = user_stats.total_messages + 1,
    last_active = NOW(),
    updated_at = NOW();
    
  -- Also update profiles table for backward compatibility
  UPDATE profiles 
  SET 
    total_messages = COALESCE(total_messages, 0) + 1,
    last_active = NOW()
  WHERE id = user_id;
  
  -- Also give XP for sending message
  PERFORM increment_user_xp(user_id, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update login streak
CREATE OR REPLACE FUNCTION update_login_streak(user_id UUID)
RETURNS void AS $$
DECLARE
  last_login DATE;
  current_streak INTEGER;
BEGIN
  SELECT DATE(last_active), login_streak 
  INTO last_login, current_streak
  FROM user_stats 
  WHERE user_id = update_login_streak.user_id;
  
  IF last_login = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Consecutive day, increment streak
    INSERT INTO user_stats (user_id, login_streak, last_active)
    VALUES (user_id, 1, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      login_streak = user_stats.login_streak + 1,
      last_active = NOW(),
      updated_at = NOW();
  ELSIF last_login < CURRENT_DATE - INTERVAL '1 day' OR last_login IS NULL THEN
    -- Streak broken or first login, reset to 1
    INSERT INTO user_stats (user_id, login_streak, last_active)
    VALUES (user_id, 1, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      login_streak = 1,
      last_active = NOW(),
      updated_at = NOW();
  END IF;
  
  -- Also update profiles table
  UPDATE profiles 
  SET 
    login_streak = (SELECT login_streak FROM user_stats WHERE user_stats.user_id = update_login_streak.user_id),
    last_active = NOW()
  WHERE id = user_id;
  
  -- Give XP for daily login
  PERFORM increment_user_xp(user_id, 5);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-increment message count when chat messages are sent
CREATE OR REPLACE FUNCTION trigger_increment_message_count()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM increment_message_count(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on global_chat_messages table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'global_chat_messages') THEN
    DROP TRIGGER IF EXISTS chat_message_stats_trigger ON global_chat_messages;
    CREATE TRIGGER chat_message_stats_trigger
      AFTER INSERT ON global_chat_messages
      FOR EACH ROW
      EXECUTE FUNCTION trigger_increment_message_count();
  END IF;
END $$;

-- Create trigger on chat_messages table (legacy support)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
    DROP TRIGGER IF EXISTS chat_message_stats_trigger_legacy ON chat_messages;
    CREATE TRIGGER chat_message_stats_trigger_legacy
      AFTER INSERT ON chat_messages
      FOR EACH ROW
      EXECUTE FUNCTION trigger_increment_message_count();
  END IF;
END $$;
