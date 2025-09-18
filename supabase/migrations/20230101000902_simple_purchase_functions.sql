-- Drop existing functions
DROP FUNCTION IF EXISTS process_course_purchase(uuid, uuid, integer);
DROP FUNCTION IF EXISTS process_item_purchase(uuid, uuid, integer);

-- Create simplified course purchase function that works with existing schema
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
    v_purchase_id uuid;
    v_already_purchased boolean;
    v_new_balance integer;
BEGIN
    -- Check if user already has access
    SELECT EXISTS(
        SELECT 1 FROM user_courses 
        WHERE user_id = p_user_id AND course_id = p_course_id
    ) INTO v_already_purchased;
    
    IF v_already_purchased THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'You already have access to this course'
        );
    END IF;

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
        -- Deduct coins from user balance
        UPDATE user_coins
        SET balance = v_new_balance,
            updated_at = NOW()
        WHERE user_id = p_user_id;

        -- Add simple transaction record (only required columns)
        INSERT INTO coin_transactions (
            user_id,
            amount,
            created_at
        ) VALUES (
            p_user_id,
            -p_price,
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

        -- Create order record
        INSERT INTO orders (
            id,
            user_id,
            item_id,
            item_name,
            item_type,
            price,
            status,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            p_user_id,
            p_course_id,
            'Course Purchase',
            'course',
            p_price,
            'completed',
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

-- Create simplified item purchase function
CREATE OR REPLACE FUNCTION process_item_purchase(
    p_user_id uuid,
    p_item_id uuid,
    p_price integer
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_balance integer;
    v_purchase_id uuid;
    v_already_purchased boolean;
    v_new_balance integer;
BEGIN
    -- Check if user already purchased this item
    SELECT EXISTS(
        SELECT 1 FROM orders 
        WHERE user_id = p_user_id AND item_id = p_item_id AND status = 'completed'
    ) INTO v_already_purchased;
    
    IF v_already_purchased THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'You already own this item'
        );
    END IF;

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
        -- Deduct coins from user balance
        UPDATE user_coins
        SET balance = v_new_balance,
            updated_at = NOW()
        WHERE user_id = p_user_id;

        -- Add simple transaction record (only required columns)
        INSERT INTO coin_transactions (
            user_id,
            amount,
            created_at
        ) VALUES (
            p_user_id,
            -p_price,
            NOW()
        );

        -- Create order record
        INSERT INTO orders (
            id,
            user_id,
            item_id,
            item_name,
            item_type,
            price,
            status,
            created_at,
            updated_at
        ) VALUES (
            v_purchase_id,
            p_user_id,
            p_item_id,
            'Item Purchase',
            'item',
            p_price,
            'completed',
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
        'message', 'Item purchased successfully!',
        'purchase_id', v_purchase_id,
        'new_balance', v_new_balance
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION process_course_purchase(uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION process_item_purchase(uuid, uuid, integer) TO authenticated;
