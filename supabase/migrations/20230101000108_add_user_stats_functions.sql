-- Add functions to increment user stats
CREATE OR REPLACE FUNCTION increment_message_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET 
    total_messages = COALESCE(total_messages, 0) + 1,
    last_active = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_articles_read(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET 
    articles_read = COALESCE(articles_read, 0) + 1,
    last_active = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_courses_completed(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET 
    courses_completed = COALESCE(courses_completed, 0) + 1,
    last_active = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_challenges_completed(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET 
    challenges_completed = COALESCE(challenges_completed, 0) + 1,
    last_active = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add missing columns to profiles table if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_messages INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS challenges_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS articles_read INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS courses_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS login_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();
