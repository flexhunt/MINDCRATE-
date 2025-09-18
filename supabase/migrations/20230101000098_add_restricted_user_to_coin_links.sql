-- Add restricted_to_user column to coin_links table
ALTER TABLE coin_links ADD COLUMN IF NOT EXISTS restricted_to_user UUID REFERENCES auth.users(id);
ALTER TABLE coin_links ADD COLUMN IF NOT EXISTS opportunity_id UUID REFERENCES coin_earning_opportunities(id);

-- Update the process_coin_link function to check for user restriction
CREATE OR REPLACE FUNCTION process_coin_link(p_code TEXT, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_link_id UUID;
    v_coins INT;
    v_max_uses INT;
    v_current_uses INT;
    v_restricted_to_user UUID;
    v_result JSON;
    v_current_balance INT;
BEGIN
    -- Get the link details
    SELECT id, coins, max_uses, restricted_to_user
    INTO v_link_id, v_coins, v_max_uses, v_restricted_to_user
    FROM coin_links
    WHERE code = p_code AND active = TRUE;
    
    IF v_link_id IS NULL THEN
        RETURN json_build_object(
            'success', FALSE,
            'message', 'Link not found or inactive'
        );
    END IF;
    
    -- Check if the link is restricted to a specific user
    IF v_restricted_to_user IS NOT NULL AND v_restricted_to_user != p_user_id THEN
        RETURN json_build_object(
            'success', FALSE,
            'message', 'This link can only be used by the user who generated it'
        );
    END IF;
    
    -- Check if the user has already used this link the maximum number of times
    SELECT COUNT(*)
    INTO v_current_uses
    FROM coin_link_uses
    WHERE link_id = v_link_id AND user_id = p_user_id;
    
    IF v_current_uses >= v_max_uses THEN
        RETURN json_build_object(
            'success', FALSE,
            'message', 'You have already used this link the maximum number of times'
        );
    END IF;
    
    -- Record the use
    INSERT INTO coin_link_uses (link_id, user_id)
    VALUES (v_link_id, p_user_id);
    
    -- Get current balance
    SELECT balance
    INTO v_current_balance
    FROM user_coins
    WHERE user_id = p_user_id;
    
    IF v_current_balance IS NULL THEN
        v_current_balance := 0;
    END IF;
    
    -- Update user's coin balance
    INSERT INTO user_coins (user_id, balance)
    VALUES (p_user_id, v_current_balance + v_coins)
    ON CONFLICT (user_id)
    DO UPDATE SET balance = user_coins.balance + v_coins;
    
    -- Record the transaction
    INSERT INTO coin_transactions (user_id, amount, description, transaction_type)
    VALUES (p_user_id, v_coins, 'Redeemed coin link: ' || p_code, 'EARN');
    
    -- Return success
    RETURN json_build_object(
        'success', TRUE,
        'message', 'Coins awarded successfully',
        'coins_awarded', v_coins
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to check restricted_to_user
DROP POLICY IF EXISTS "Users can only use links they are allowed to" ON coin_links;
CREATE POLICY "Users can only use links they are allowed to" ON coin_links
  FOR SELECT
  USING (
    (restricted_to_user IS NULL) OR 
    (restricted_to_user = auth.uid())
  );
