-- Fix the challenge check-in function to use correct coin table structure
CREATE OR REPLACE FUNCTION process_challenge_checkin()
RETURNS TRIGGER AS $$
DECLARE
    participant_record RECORD;
    xp_reward INTEGER := 10;
    coin_reward INTEGER := 5;
    streak_bonus INTEGER := 0;
    current_balance INTEGER := 0;
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
    
    -- Add coins to user balance (FIXED)
    IF coin_reward > 0 THEN
        -- Get current balance
        SELECT COALESCE(balance, 0) INTO current_balance 
        FROM user_coins 
        WHERE user_id = NEW.user_id;
        
        -- Insert transaction record
        INSERT INTO coin_transactions (user_id, amount, balance_after, transaction_type, description)
        VALUES (NEW.user_id, coin_reward, current_balance + coin_reward, 'challenge_checkin', 'Challenge check-in reward');
        
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
