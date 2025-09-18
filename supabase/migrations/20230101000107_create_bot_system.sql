-- Create bot system tables
CREATE TABLE IF NOT EXISTS bot_commands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  command VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  response_template TEXT,
  is_active BOOLEAN DEFAULT true,
  admin_only BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user stats table for comprehensive tracking
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  total_coins INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  challenges_completed INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  articles_read INTEGER DEFAULT 0,
  courses_completed INTEGER DEFAULT 0,
  quiz_score INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create bot responses table for dynamic responses
CREATE TABLE IF NOT EXISTS bot_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_type VARCHAR(50) NOT NULL, -- 'command', 'mention', 'keyword'
  trigger_value VARCHAR(100) NOT NULL,
  response_text TEXT NOT NULL,
  response_type VARCHAR(20) DEFAULT 'text', -- 'text', 'embed', 'stats'
  is_active BOOLEAN DEFAULT true,
  admin_only BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default bot commands
INSERT INTO bot_commands (command, description, response_template, admin_only) VALUES
('info', 'Show user information and stats', 'user_stats', false),
('help', 'Show available commands', 'command_list', false),
('leaderboard', 'Show top users', 'leaderboard', false),
('stats', 'Show your detailed statistics', 'detailed_stats', false),
('challenges', 'Show active challenges', 'challenge_list', false),
('coins', 'Show coin balance and earning opportunities', 'coin_info', false),
('admin', 'Admin commands', 'admin_help', true);

-- Insert default bot responses
INSERT INTO bot_responses (trigger_type, trigger_value, response_text, response_type) VALUES
('mention', 'mindcrate', '🤖 **MindCrate Bot** is here to help! Use `!help` to see available commands.', 'text'),
('command', 'ping', '🏓 Pong! Bot is online and ready!', 'text'),
('keyword', 'welcome', '👋 Welcome to MindCrate! Start your learning journey today!', 'text');

-- Create function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats(
  p_user_id UUID,
  p_xp_gain INTEGER DEFAULT 0,
  p_coin_gain INTEGER DEFAULT 0,
  p_message_count INTEGER DEFAULT 0,
  p_challenge_complete BOOLEAN DEFAULT false,
  p_article_read BOOLEAN DEFAULT false,
  p_course_complete BOOLEAN DEFAULT false
) RETURNS void AS $$
BEGIN
  INSERT INTO user_stats (user_id, total_xp, total_coins, messages_sent, challenges_completed, articles_read, courses_completed, last_activity)
  VALUES (p_user_id, p_xp_gain, p_coin_gain, p_message_count, 
          CASE WHEN p_challenge_complete THEN 1 ELSE 0 END,
          CASE WHEN p_article_read THEN 1 ELSE 0 END,
          CASE WHEN p_course_complete THEN 1 ELSE 0 END,
          NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp = user_stats.total_xp + p_xp_gain,
    total_coins = user_stats.total_coins + p_coin_gain,
    messages_sent = user_stats.messages_sent + p_message_count,
    challenges_completed = user_stats.challenges_completed + CASE WHEN p_challenge_complete THEN 1 ELSE 0 END,
    articles_read = user_stats.articles_read + CASE WHEN p_article_read THEN 1 ELSE 0 END,
    courses_completed = user_stats.courses_completed + CASE WHEN p_course_complete THEN 1 ELSE 0 END,
    level = GREATEST(1, (user_stats.total_xp + p_xp_gain) / 100),
    last_activity = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user comprehensive stats
CREATE OR REPLACE FUNCTION get_user_comprehensive_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  user_data JSON;
  profile_data JSON;
  stats_data JSON;
  challenge_data JSON;
  coin_data JSON;
BEGIN
  -- Get profile data
  SELECT to_json(p.*) INTO profile_data
  FROM profiles p
  WHERE p.id = p_user_id;

  -- Get stats data
  SELECT to_json(s.*) INTO stats_data
  FROM user_stats s
  WHERE s.user_id = p_user_id;

  -- Get challenge data
  SELECT json_build_object(
    'active_challenges', COUNT(CASE WHEN c.status = 'active' THEN 1 END),
    'completed_challenges', COUNT(CASE WHEN cp.status = 'completed' THEN 1 END),
    'current_streak', COALESCE(MAX(cp.current_streak), 0)
  ) INTO challenge_data
  FROM challenge_participants cp
  LEFT JOIN challenges c ON c.id = cp.challenge_id
  WHERE cp.user_id = p_user_id;

  -- Get coin data
  SELECT json_build_object(
    'balance', COALESCE(balance, 0),
    'total_earned', COALESCE(total_earned, 0),
    'total_spent', COALESCE(total_spent, 0)
  ) INTO coin_data
  FROM user_coins
  WHERE user_id = p_user_id;

  -- Combine all data
  SELECT json_build_object(
    'profile', COALESCE(profile_data, '{}'::json),
    'stats', COALESCE(stats_data, '{}'::json),
    'challenges', COALESCE(challenge_data, '{}'::json),
    'coins', COALESCE(coin_data, '{}'::json)
  ) INTO user_data;

  RETURN user_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies
ALTER TABLE bot_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_responses ENABLE ROW LEVEL SECURITY;

-- Bot commands - readable by all, writable by admins
CREATE POLICY "Bot commands are viewable by everyone" ON bot_commands FOR SELECT USING (true);
CREATE POLICY "Bot commands are editable by admins" ON bot_commands FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- User stats - users can view their own, admins can view all
CREATE POLICY "Users can view own stats" ON user_stats FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all stats" ON user_stats FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);
CREATE POLICY "Stats can be updated by system" ON user_stats FOR ALL USING (true);

-- Bot responses - readable by all, writable by admins
CREATE POLICY "Bot responses are viewable by everyone" ON bot_responses FOR SELECT USING (true);
CREATE POLICY "Bot responses are editable by admins" ON bot_responses FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- Create trigger to update user stats on message send
CREATE OR REPLACE FUNCTION trigger_update_message_stats()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_user_stats(NEW.user_id, 1, 0, 1); -- 1 XP per message
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_message_stats_trigger
  AFTER INSERT ON global_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_message_stats();
