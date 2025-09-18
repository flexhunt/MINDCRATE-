-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'daily_checkin', -- daily_checkin, score_based, time_bound
    duration_days INTEGER NOT NULL,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rules TEXT,
    penalty_reward TEXT,
    is_public BOOLEAN DEFAULT false,
    max_participants INTEGER DEFAULT 10,
    status VARCHAR(20) DEFAULT 'active', -- active, completed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ends_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create challenge participants table
CREATE TABLE IF NOT EXISTS challenge_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active', -- active, completed, failed, quit
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_checkins INTEGER DEFAULT 0,
    last_checkin_date DATE,
    xp_earned INTEGER DEFAULT 0,
    coins_earned INTEGER DEFAULT 0,
    UNIQUE(challenge_id, user_id)
);

-- Create challenge check-ins table
CREATE TABLE IF NOT EXISTS challenge_checkins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES challenge_participants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL, -- success, failed, missed
    notes TEXT,
    xp_gained INTEGER DEFAULT 0,
    coins_gained INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(challenge_id, user_id, date)
);

-- Create challenge invites table
CREATE TABLE IF NOT EXISTS challenge_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    max_uses INTEGER DEFAULT 10,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create challenge templates table
CREATE TABLE IF NOT EXISTS challenge_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    duration_days INTEGER NOT NULL,
    type VARCHAR(50) DEFAULT 'daily_checkin',
    rules TEXT,
    category VARCHAR(50),
    is_popular BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create challenge achievements table
CREATE TABLE IF NOT EXISTS challenge_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    achievement_type VARCHAR(50) NOT NULL, -- streak_master, challenge_winner, perfect_week, etc.
    achievement_data JSONB,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert popular challenge templates
INSERT INTO challenge_templates (name, description, duration_days, type, rules, category, is_popular) VALUES
('MuthhiMat Challenge', 'Break free from bad habits and build willpower', 30, 'daily_checkin', 'Check in daily before 12 PM. Be honest about your progress.', 'self_improvement', true),
('InstaOff Challenge', 'Take a break from social media addiction', 7, 'daily_checkin', 'No Instagram, Facebook, or TikTok. Check in daily to confirm.', 'digital_detox', true),
('Wake-Up Grind', 'Build the habit of waking up early', 14, 'daily_checkin', 'Wake up at 6 AM every day. Check in within 1 hour of waking.', 'productivity', true),
('Fit Bros Challenge', 'Get your daily steps in', 10, 'score_based', 'Walk at least 5000 steps daily. Higher steps = bonus points.', 'fitness', true),
('Focus Sprint', 'Deep work without distractions', 21, 'time_bound', '2 hours of focused work daily. No phone, no social media.', 'productivity', true),
('No Sugar Challenge', 'Cut out refined sugar completely', 14, 'daily_checkin', 'No sweets, sodas, or processed sugar. Natural fruits are okay.', 'health', true);

-- Add RLS policies
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_achievements ENABLE ROW LEVEL SECURITY;

-- Challenges policies
CREATE POLICY "Users can view public challenges and their own" ON challenges
    FOR SELECT USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Users can create challenges" ON challenges
    FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update their own challenges" ON challenges
    FOR UPDATE USING (creator_id = auth.uid());

-- Challenge participants policies
CREATE POLICY "Users can view participants of challenges they're in" ON challenge_participants
    FOR SELECT USING (
        user_id = auth.uid() OR 
        challenge_id IN (SELECT id FROM challenges WHERE creator_id = auth.uid()) OR
        challenge_id IN (SELECT challenge_id FROM challenge_participants WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can join challenges" ON challenge_participants
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participation" ON challenge_participants
    FOR UPDATE USING (user_id = auth.uid());

-- Challenge check-ins policies
CREATE POLICY "Users can view check-ins of challenges they're in" ON challenge_checkins
    FOR SELECT USING (
        user_id = auth.uid() OR 
        challenge_id IN (SELECT challenge_id FROM challenge_participants WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create their own check-ins" ON challenge_checkins
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Challenge invites policies
CREATE POLICY "Anyone can view invites to join" ON challenge_invites
    FOR SELECT USING (true);

CREATE POLICY "Challenge creators can create invites" ON challenge_invites
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        challenge_id IN (SELECT id FROM challenges WHERE creator_id = auth.uid())
    );

-- Templates are public
CREATE POLICY "Anyone can view templates" ON challenge_templates
    FOR SELECT USING (true);

-- Achievements policies
CREATE POLICY "Users can view their own achievements" ON challenge_achievements
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create achievements" ON challenge_achievements
    FOR INSERT WITH CHECK (true);

-- Create functions for challenge management
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
BEGIN
    RETURN upper(substring(md5(random()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- Function to update challenge ends_at when created
CREATE OR REPLACE FUNCTION set_challenge_end_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ends_at = NEW.starts_at + (NEW.duration_days || ' days')::INTERVAL;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_challenge_end_date_trigger
    BEFORE INSERT OR UPDATE ON challenges
    FOR EACH ROW
    EXECUTE FUNCTION set_challenge_end_date();

-- Function to update streaks and XP on check-in
CREATE OR REPLACE FUNCTION process_challenge_checkin()
RETURNS TRIGGER AS $$
DECLARE
    participant_record RECORD;
    xp_reward INTEGER := 10;
    coin_reward INTEGER := 5;
    streak_bonus INTEGER := 0;
BEGIN
    -- Get participant record
    SELECT * INTO participant_record 
    FROM challenge_participants 
    WHERE challenge_id = NEW.challenge_id AND user_id = NEW.user_id;
    
    -- Calculate rewards based on status
    IF NEW.status = 'success' THEN
        -- Update streak
        IF participant_record.last_checkin_date = CURRENT_DATE - INTERVAL '1 day' THEN
            -- Continue streak
            UPDATE challenge_participants 
            SET current_streak = current_streak + 1,
                total_checkins = total_checkins + 1,
                last_checkin_date = CURRENT_DATE
            WHERE challenge_id = NEW.challenge_id AND user_id = NEW.user_id;
        ELSE
            -- Start new streak
            UPDATE challenge_participants 
            SET current_streak = 1,
                total_checkins = total_checkins + 1,
                last_checkin_date = CURRENT_DATE
            WHERE challenge_id = NEW.challenge_id AND user_id = NEW.user_id;
        END IF;
        
        -- Update longest streak if needed
        UPDATE challenge_participants 
        SET longest_streak = GREATEST(longest_streak, current_streak)
        WHERE challenge_id = NEW.challenge_id AND user_id = NEW.user_id;
        
        -- Calculate streak bonus
        SELECT current_streak INTO streak_bonus 
        FROM challenge_participants 
        WHERE challenge_id = NEW.challenge_id AND user_id = NEW.user_id;
        
        IF streak_bonus >= 7 THEN
            xp_reward := xp_reward + 20;
            coin_reward := coin_reward + 10;
        ELSIF streak_bonus >= 3 THEN
            xp_reward := xp_reward + 5;
            coin_reward := coin_reward + 2;
        END IF;
        
    ELSIF NEW.status = 'failed' THEN
        -- Reset streak
        UPDATE challenge_participants 
        SET current_streak = 0,
            last_checkin_date = CURRENT_DATE
        WHERE challenge_id = NEW.challenge_id AND user_id = NEW.user_id;
        
        xp_reward := 0;
        coin_reward := 0;
    END IF;
    
    -- Update XP and coins
    NEW.xp_gained := xp_reward;
    NEW.coins_gained := coin_reward;
    
    -- Add to participant totals
    UPDATE challenge_participants 
    SET xp_earned = xp_earned + xp_reward,
        coins_earned = coins_earned + coin_reward
    WHERE challenge_id = NEW.challenge_id AND user_id = NEW.user_id;
    
    -- Add coins to user balance
    IF coin_reward > 0 THEN
        -- Insert transaction record
        INSERT INTO coin_transactions (user_id, amount, transaction_type, description)
        VALUES (NEW.user_id, coin_reward, 'challenge_checkin', 'Challenge check-in reward');
        
        -- Update user balance
        INSERT INTO user_coins (user_id, balance, lifetime_earned)
        VALUES (NEW.user_id, coin_reward, coin_reward)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            balance = user_coins.balance + coin_reward,
            lifetime_earned = user_coins.lifetime_earned + coin_reward,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER process_challenge_checkin_trigger
    BEFORE INSERT ON challenge_checkins
    FOR EACH ROW
    EXECUTE FUNCTION process_challenge_checkin();

-- Function to join challenge via invite code
CREATE OR REPLACE FUNCTION join_challenge_by_code(invite_code_param TEXT, user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
    invite_record RECORD;
    challenge_record RECORD;
    participant_count INTEGER;
    result JSONB;
BEGIN
    -- Get invite record
    SELECT * INTO invite_record 
    FROM challenge_invites 
    WHERE invite_code = invite_code_param 
    AND (expires_at IS NULL OR expires_at > NOW())
    AND used_count < max_uses;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invite code');
    END IF;
    
    -- Get challenge record
    SELECT * INTO challenge_record 
    FROM challenges 
    WHERE id = invite_record.challenge_id 
    AND status = 'active'
    AND ends_at > NOW();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Challenge not found or expired');
    END IF;
    
    -- Check if user already joined
    IF EXISTS (SELECT 1 FROM challenge_participants WHERE challenge_id = challenge_record.id AND user_id = user_id_param) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Already joined this challenge');
    END IF;
    
    -- Check participant limit
    SELECT COUNT(*) INTO participant_count 
    FROM challenge_participants 
    WHERE challenge_id = challenge_record.id;
    
    IF participant_count >= challenge_record.max_participants THEN
        RETURN jsonb_build_object('success', false, 'error', 'Challenge is full');
    END IF;
    
    -- Join the challenge
    INSERT INTO challenge_participants (challenge_id, user_id)
    VALUES (challenge_record.id, user_id_param);
    
    -- Update invite usage
    UPDATE challenge_invites 
    SET used_count = used_count + 1 
    WHERE invite_code = invite_code_param;
    
    RETURN jsonb_build_object(
        'success', true, 
        'challenge_id', challenge_record.id,
        'challenge_title', challenge_record.title
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
