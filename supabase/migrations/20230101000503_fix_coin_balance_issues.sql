-- Fix any users who might not have coin balance records
INSERT INTO user_coins (user_id, balance, lifetime_earned, created_at, updated_at)
SELECT 
    id,
    0,
    0,
    created_at,
    NOW()
FROM profiles
WHERE id NOT IN (SELECT user_id FROM user_coins)
ON CONFLICT (user_id) DO NOTHING;

-- Ensure all coin transactions have proper balance_after values
-- This is a safety measure to prevent future issues
UPDATE coin_transactions 
SET balance_after = COALESCE(balance_after, 0)
WHERE balance_after IS NULL;

-- Add a function to safely add coins with proper balance tracking
CREATE OR REPLACE FUNCTION safe_add_coins(
    target_user_id UUID,
    coin_amount INTEGER,
    trans_type TEXT,
    trans_description TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    current_balance INTEGER := 0;
    new_balance INTEGER := 0;
BEGIN
    -- Get current balance or create record if doesn't exist
    SELECT COALESCE(balance, 0) INTO current_balance
    FROM user_coins
    WHERE user_id = target_user_id;

    -- If no record found, create one
    IF NOT FOUND THEN
        INSERT INTO user_coins (user_id, balance, lifetime_earned, created_at, updated_at)
        VALUES (target_user_id, 0, 0, NOW(), NOW());
        current_balance := 0;
    END IF;

    -- Calculate new balance
    new_balance := current_balance + coin_amount;

    -- Update balance
    UPDATE user_coins
    SET balance = new_balance,
        lifetime_earned = CASE 
            WHEN coin_amount > 0 THEN lifetime_earned + coin_amount
            ELSE lifetime_earned
        END,
        updated_at = NOW()
    WHERE user_id = target_user_id;

    -- Record transaction
    INSERT INTO coin_transactions (
        user_id,
        amount,
        balance_after,
        transaction_type,
        description,
        created_at
    ) VALUES (
        target_user_id,
        coin_amount,
        new_balance,
        trans_type,
        COALESCE(trans_description, 'Coin transaction'),
        NOW()
    );

    RETURN json_build_object(
        'success', true,
        'new_balance', new_balance,
        'amount_added', coin_amount
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
