-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view participants of challenges they're in" ON challenge_participants;
DROP POLICY IF EXISTS "Users can view check-ins of challenges they're in" ON challenge_checkins;

-- Create simpler, non-recursive policies for challenge_participants
CREATE POLICY "Users can view all participants" ON challenge_participants
    FOR SELECT USING (true);

CREATE POLICY "Users can join challenges" ON challenge_participants
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participation" ON challenge_participants
    FOR UPDATE USING (user_id = auth.uid());

-- Create simpler policies for challenge_checkins
CREATE POLICY "Users can view all check-ins" ON challenge_checkins
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own check-ins" ON challenge_checkins
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own check-ins" ON challenge_checkins
    FOR UPDATE USING (user_id = auth.uid());

-- Fix challenges policies to be more permissive for now
DROP POLICY IF EXISTS "Users can view public challenges and their own" ON challenges;

CREATE POLICY "Users can view all challenges" ON challenges
    FOR SELECT USING (true);

CREATE POLICY "Users can create challenges" ON challenges
    FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update their own challenges" ON challenges
    FOR UPDATE USING (creator_id = auth.uid());

-- Make sure templates are accessible
DROP POLICY IF EXISTS "Anyone can view templates" ON challenge_templates;
CREATE POLICY "Anyone can view templates" ON challenge_templates
    FOR SELECT USING (true);

-- Make invites more accessible
DROP POLICY IF EXISTS "Anyone can view invites to join" ON challenge_invites;
DROP POLICY IF EXISTS "Challenge creators can create invites" ON challenge_invites;

CREATE POLICY "Anyone can view invites" ON challenge_invites
    FOR SELECT USING (true);

CREATE POLICY "Users can create invites for their challenges" ON challenge_invites
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Achievements policies
DROP POLICY IF EXISTS "Users can view their own achievements" ON challenge_achievements;
DROP POLICY IF EXISTS "System can create achievements" ON challenge_achievements;

CREATE POLICY "Users can view their own achievements" ON challenge_achievements
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create achievements" ON challenge_achievements
    FOR INSERT WITH CHECK (true);

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user_id ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge_id ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_checkins_user_id ON challenge_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_checkins_challenge_id ON challenge_checkins(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_checkins_date ON challenge_checkins(date);
CREATE INDEX IF NOT EXISTS idx_challenges_creator_id ON challenges(creator_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_is_public ON challenges(is_public);
