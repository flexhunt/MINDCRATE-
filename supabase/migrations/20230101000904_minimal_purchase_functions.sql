-- Drop existing functions
DROP FUNCTION IF EXISTS process_course_purchase(uuid, uuid, integer);
DROP FUNCTION IF EXISTS process_item_purchase(uuid, uuid, integer);

-- Create minimal course purchase function
CREATE OR REPLACE FUNCTION process_course_purchase(
    p_user_id uuid,
    p_course_id uuid,
    p_price integer
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_balance integer;
    v_new_balance integer;
    v_purchase_id uuid;
BEGIN
    -- Get user's current balance
    SELECT COALESCE(balance, 0) INTO v_user_balance
    FROM user_coins
    WHERE user_id = p_user_id;

    -- Check if user has enough coins
    IF v_user_balance < p_price THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', format('Insufficient coins. You have %s coins but need %s', v_user_balance, p_price)
        );
    END IF;

    -- Calculate new balance
    v_new_balance := v_user_balance - p_price;
    v_purchase_id := gen_random_uuid();

    -- Start transaction
    BEGIN
        -- Update user balance
        UPDATE user_coins
        SET balance = v_new_balance,
            updated_at = NOW()
        WHERE user_id = p_user_id;

        -- Insert transaction with balance_after
        INSERT INTO coin_transactions (
            user_id,
            amount,
            balance_after,
            created_at
        ) VALUES (
            p_user_id,
            -p_price,
            v_new_balance,
            NOW()
        );

        -- Grant course access
        INSERT INTO user_courses (
            id,
            user_id,
            course_id,
            purchased_at,
            created_at,
            updated_at
        ) VALUES (
            v_purchase_id,
            p_user_id,
            p_course_id,
            NOW(),
            NOW(),
            NOW()
        );

    EXCEPTION
        WHEN OTHERS THEN
            RETURN jsonb_build_object(
                'success', false,
                'message', 'Purchase failed: ' || SQLERRM
            );
    END;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Course purchased successfully!',
        'purchase_id', v_purchase_id,
        'new_balance', v_new_balance
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION process_course_purchase(uuid, uuid, integer) TO authenticated;
