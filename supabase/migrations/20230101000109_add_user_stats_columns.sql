-- Add missing columns to profiles table for user stats
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_messages INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS challenges_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS articles_read INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS courses_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS login_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create function to increment user XP
CREATE OR REPLACE FUNCTION increment_user_xp(user_id UUID, xp_amount INTEGER)
RETURNS void AS $$
DECLARE
    current_xp INTEGER;
    new_level INTEGER;
BEGIN
    -- Get current XP
    SELECT xp INTO current_xp FROM profiles WHERE id = user_id;
    
    -- Update XP
    UPDATE profiles 
    SET xp = COALESCE(xp, 0) + xp_amount,
        last_active = NOW()
    WHERE id = user_id;
    
    -- Calculate new level (every 100 XP = 1 level)
    SELECT FLOOR((COALESCE(xp, 0) + xp_amount) / 100) + 1 INTO new_level;
    
    -- Update level
    UPDATE profiles 
    SET level = new_level
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment message count and give XP
CREATE OR REPLACE FUNCTION increment_message_count(user_id UUID)
RETURNS void AS $$
BEGIN
    -- Increment message count
    UPDATE profiles 
    SET total_messages = COALESCE(total_messages, 0) + 1,
        last_active = NOW()
    WHERE id = user_id;
    
    -- Give 1 XP for each message
    PERFORM increment_user_xp(user_id, 1);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-increment message count when chat messages are sent
CREATE OR REPLACE FUNCTION auto_increment_message_stats()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM increment_message_count(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on chat_messages table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
        DROP TRIGGER IF EXISTS trigger_increment_message_stats ON chat_messages;
        CREATE TRIGGER trigger_increment_message_stats
            AFTER INSERT ON chat_messages
            FOR EACH ROW
            EXECUTE FUNCTION auto_increment_message_stats();
    END IF;
END $$;
