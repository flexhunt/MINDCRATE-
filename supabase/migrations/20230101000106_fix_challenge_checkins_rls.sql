-- Fix RLS policies for challenge_checkins table
DROP POLICY IF EXISTS "Users can create their own check-ins" ON challenge_checkins;
DROP POLICY IF EXISTS "Users can view check-ins of challenges they're in" ON challenge_checkins;
DROP POLICY IF EXISTS "Users can view all check-ins" ON challenge_checkins;
DROP POLICY IF EXISTS "Users can update their own check-ins" ON challenge_checkins;

-- Create new, more permissive policies for challenge_checkins
CREATE POLICY "Users can view challenge check-ins" ON challenge_checkins
    FOR SELECT USING (true);

CREATE POLICY "Users can create check-ins for challenges they joined" ON challenge_checkins
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM challenge_participants 
            WHERE challenge_id = challenge_checkins.challenge_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own check-ins" ON challenge_checkins
    FOR UPDATE USING (user_id = auth.uid());

-- Also fix challenge_participants policies to be more permissive
DROP POLICY IF EXISTS "Users can view participants of challenges they're in" ON challenge_participants;
DROP POLICY IF EXISTS "Users can view all participants" ON challenge_participants;

CREATE POLICY "Users can view challenge participants" ON challenge_participants
    FOR SELECT USING (true);

CREATE POLICY "Users can join challenges" ON challenge_participants
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participation" ON challenge_participants
    FOR UPDATE USING (user_id = auth.uid());

-- Fix challenges policies
DROP POLICY IF EXISTS "Users can view public challenges and their own" ON challenges;
DROP POLICY IF EXISTS "Users can view all challenges" ON challenges;

CREATE POLICY "Users can view challenges" ON challenges
    FOR SELECT USING (true);

CREATE POLICY "Users can create challenges" ON challenges
    FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update their own challenges" ON challenges
    FOR UPDATE USING (creator_id = auth.uid());

-- Update the challenge check-in function to be more robust
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
    
    -- If no participant record found, something is wrong
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User is not a participant in this challenge';
    END IF;
    
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
    
    -- Add coins to user balance using the dedicated function
    IF coin_reward > 0 THEN
        PERFORM add_challenge_coins(NEW.user_id, coin_reward, 'Challenge check-in reward');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS process_challenge_checkin_trigger ON challenge_checkins;
CREATE TRIGGER process_challenge_checkin_trigger
    BEFORE INSERT ON challenge_checkins
    FOR EACH ROW
    EXECUTE FUNCTION process_challenge_checkin();

-- Create a function to get challenge details with proper permissions
CREATE OR REPLACE FUNCTION get_challenge_details(challenge_id_param UUID)
RETURNS JSONB AS $$
DECLARE
    challenge_data JSONB;
    participants_data JSONB;
BEGIN
    -- Get challenge data
    SELECT to_jsonb(c.*) INTO challenge_data
    FROM challenges c
    WHERE c.id = challenge_id_param;
    
    IF challenge_data IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Get participants data
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', cp.id,
            'challenge_id', cp.challenge_id,
            'user_id', cp.user_id,
            'joined_at', cp.joined_at,
            'status', cp.status,
            'current_streak', cp.current_streak,
            'longest_streak', cp.longest_streak,
            'total_checkins', cp.total_checkins,
            'last_checkin_date', cp.last_checkin_date,
            'xp_earned', cp.xp_earned,
            'coins_earned', cp.coins_earned,
            'profiles', jsonb_build_object(
                'id', p.id,
                'username', p.username,
                'name', p.name,
                'avatar_url', p.avatar_url
            )
        )
    ) INTO participants_data
    FROM challenge_participants cp
    LEFT JOIN profiles p ON p.id = cp.user_id
    WHERE cp.challenge_id = challenge_id_param;
    
    -- Combine challenge and participants data
    RETURN challenge_data || jsonb_build_object('participants', COALESCE(participants_data, '[]'::jsonb));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
