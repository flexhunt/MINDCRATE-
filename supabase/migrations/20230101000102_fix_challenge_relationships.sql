-- Fix the relationship issues and add proper foreign keys

-- First, let's make sure we have the profiles table reference
-- Add foreign key to profiles table for challenge_participants
ALTER TABLE challenge_participants 
ADD CONSTRAINT fk_challenge_participants_profiles 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add foreign key to profiles table for challenges
ALTER TABLE challenges 
ADD CONSTRAINT fk_challenges_profiles 
FOREIGN KEY (creator_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add foreign key to profiles table for challenge_checkins
ALTER TABLE challenge_checkins 
ADD CONSTRAINT fk_challenge_checkins_profiles 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add foreign key to profiles table for challenge_invites
ALTER TABLE challenge_invites 
ADD CONSTRAINT fk_challenge_invites_profiles 
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add foreign key to profiles table for challenge_achievements
ALTER TABLE challenge_achievements 
ADD CONSTRAINT fk_challenge_achievements_profiles 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user_id ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge_id ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_checkins_user_id ON challenge_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_checkins_challenge_id ON challenge_checkins(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_checkins_date ON challenge_checkins(date);
CREATE INDEX IF NOT EXISTS idx_challenges_creator_id ON challenges(creator_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_is_public ON challenges(is_public);

-- Update RLS policies to use profiles table correctly
DROP POLICY IF EXISTS "Users can view participants of challenges they're in" ON challenge_participants;
CREATE POLICY "Users can view participants of challenges they're in" ON challenge_participants
    FOR SELECT USING (
        user_id = auth.uid() OR 
        challenge_id IN (
            SELECT id FROM challenges 
            WHERE creator_id = auth.uid() OR is_public = true
        )
    );

-- Fix the challenge details function to properly join with profiles
CREATE OR REPLACE FUNCTION get_challenge_with_participants(challenge_id_param UUID)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    description TEXT,
    type VARCHAR,
    duration_days INTEGER,
    creator_id UUID,
    rules TEXT,
    penalty_reward TEXT,
    is_public BOOLEAN,
    max_participants INTEGER,
    status VARCHAR,
    created_at TIMESTAMPTZ,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    participant_id UUID,
    participant_user_id UUID,
    participant_status VARCHAR,
    current_streak INTEGER,
    longest_streak INTEGER,
    total_checkins INTEGER,
    xp_earned INTEGER,
    coins_earned INTEGER,
    participant_name VARCHAR,
    participant_username VARCHAR,
    participant_avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.description,
        c.type,
        c.duration_days,
        c.creator_id,
        c.rules,
        c.penalty_reward,
        c.is_public,
        c.max_participants,
        c.status,
        c.created_at,
        c.starts_at,
        c.ends_at,
        cp.id as participant_id,
        cp.user_id as participant_user_id,
        cp.status as participant_status,
        cp.current_streak,
        cp.longest_streak,
        cp.total_checkins,
        cp.xp_earned,
        cp.coins_earned,
        p.name as participant_name,
        p.username as participant_username,
        p.avatar_url as participant_avatar_url
    FROM challenges c
    LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
    LEFT JOIN profiles p ON cp.user_id = p.id
    WHERE c.id = challenge_id_param
    AND (c.is_public = true OR c.creator_id = auth.uid() OR cp.user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_challenge_with_participants TO authenticated;
