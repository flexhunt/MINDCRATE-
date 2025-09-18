-- Create user presence tracking system
CREATE TABLE IF NOT EXISTS user_presence (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    is_online BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_online ON user_presence(is_online, last_seen);

-- Enable RLS
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view all presence data" ON user_presence
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own presence" ON user_presence
    FOR ALL USING (auth.uid() = user_id);

-- Function to update user presence
CREATE OR REPLACE FUNCTION update_user_presence(p_user_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO user_presence (user_id, last_seen, is_online)
    VALUES (p_user_id, NOW(), true)
    ON CONFLICT (user_id)
    DO UPDATE SET
        last_seen = NOW(),
        is_online = true,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark users as offline after 5 minutes of inactivity
CREATE OR REPLACE FUNCTION cleanup_offline_users()
RETURNS void AS $$
BEGIN
    UPDATE user_presence
    SET is_online = false,
        updated_at = NOW()
    WHERE is_online = true
    AND last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_user_presence(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_offline_users() TO authenticated;
