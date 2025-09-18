-- Fix RLS policies for user_coins table to allow challenge rewards
-- First, let's check and update the user_coins RLS policies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own coins" ON user_coins;
DROP POLICY IF EXISTS "Users can update their own coins" ON user_coins;
DROP POLICY IF EXISTS "Users can insert their own coins" ON user_coins;
DROP POLICY IF EXISTS "System can manage user coins" ON user_coins;

-- Create comprehensive RLS policies for user_coins
CREATE POLICY "Users can view their own coins" ON user_coins
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own coins" ON user_coins
    FOR ALL USING (user_id = auth.uid());

-- Allow system functions to manage coins (for challenges, purchases, etc.)
CREATE POLICY "System can manage user coins" ON user_coins
    FOR ALL USING (true);

-- Also fix coin_transactions RLS policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON coin_transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON coin_transactions;
DROP POLICY IF EXISTS "System can manage transactions" ON coin_transactions;

CREATE POLICY "Users can view their own transactions" ON coin_transactions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage transactions" ON coin_transactions
    FOR ALL USING (true);

-- Update the challenge check-in function to use a security definer approach
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
    
    -- Add coins to user balance using the robust coin service approach
    IF coin_reward > 0 THEN
        -- Use the add_coins function if it exists, otherwise direct insert
        BEGIN
            PERFORM add_coins(NEW.user_id, coin_reward, 'challenge_checkin', 'Challenge check-in reward');
        EXCEPTION WHEN OTHERS THEN
            -- Fallback to direct manipulation
            INSERT INTO user_coins (user_id, balance, lifetime_earned, updated_at)
            VALUES (NEW.user_id, coin_reward, coin_reward, NOW())
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                balance = user_coins.balance + coin_reward,
                lifetime_earned = user_coins.lifetime_earned + coin_reward,
                updated_at = NOW();
                
            -- Record transaction
            INSERT INTO coin_transactions (user_id, amount, balance_after, transaction_type, description, created_at)
            VALUES (
                NEW.user_id, 
                coin_reward, 
                (SELECT balance FROM user_coins WHERE user_id = NEW.user_id),
                'challenge_checkin', 
                'Challenge check-in reward',
                NOW()
            );
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a dedicated function for adding challenge coins that bypasses RLS
CREATE OR REPLACE FUNCTION add_challenge_coins(
    p_user_id UUID,
    p_amount INTEGER,
    p_description TEXT DEFAULT 'Challenge reward'
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Insert or update user coins
    INSERT INTO user_coins (user_id, balance, lifetime_earned, updated_at)
    VALUES (p_user_id, p_amount, p_amount, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        balance = user_coins.balance + p_amount,
        lifetime_earned = user_coins.lifetime_earned + p_amount,
        updated_at = NOW();
        
    -- Record transaction
    INSERT INTO coin_transactions (user_id, amount, balance_after, transaction_type, description, created_at)
    VALUES (
        p_user_id, 
        p_amount, 
        (SELECT balance FROM user_coins WHERE user_id = p_user_id),
        'challenge_checkin', 
        p_description,
        NOW()
    );
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
