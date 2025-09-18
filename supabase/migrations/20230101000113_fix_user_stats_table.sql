-- Create user_stats table with all required columns
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

-- Add missing columns if they don't exist
ALTER TABLE user_stats 
ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0;

-- Enable RLS on user_stats
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can update their own stats" ON user_stats;
DROP POLICY IF EXISTS "System can insert stats" ON user_stats;

-- Create RLS policies for user_stats
CREATE POLICY "Users can view their own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" ON user_stats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert stats" ON user_stats
  FOR INSERT WITH CHECK (true);

-- Create function to safely increment user XP
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
      WHEN (COALESCE(xp, 0) + xp_amount) >= COALESCE(level, 1) * 100 THEN COALESCE(level, 1) + 1
      ELSE COALESCE(level, 1)
    END,
    last_active = NOW()
  WHERE id = user_id;
EXCEPTION
  WHEN OTHERS THEN
    -- If user_stats fails, at least update profiles
    UPDATE profiles 
    SET 
      xp = COALESCE(xp, 0) + xp_amount,
      level = CASE 
        WHEN (COALESCE(xp, 0) + xp_amount) >= COALESCE(level, 1) * 100 THEN COALESCE(level, 1) + 1
        ELSE COALESCE(level, 1)
      END,
      last_active = NOW()
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to safely increment message count
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
EXCEPTION
  WHEN OTHERS THEN
    -- If user_stats fails, at least update profiles
    UPDATE profiles 
    SET 
      total_messages = COALESCE(total_messages, 0) + 1,
      last_active = NOW()
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
