-- Drop all existing purchase functions
DROP FUNCTION IF EXISTS process_course_purchase(uuid, uuid, integer);
DROP FUNCTION IF EXISTS process_item_purchase(uuid, uuid, integer);
DROP FUNCTION IF EXISTS process_shop_purchase(uuid, uuid, integer);

-- Create the CORRECT course purchase function with proper transaction_type
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
        -- Update user balance
        UPDATE user_coins
        SET balance = v_new_balance,
            updated_at = NOW()
        WHERE user_id = p_user_id;

        -- Add transaction record with CORRECT column name
        INSERT INTO coin_transactions (
            id,
            user_id,
            amount,
            balance_after,
            transaction_type,
            description,
            created_at
        ) VALUES (
            gen_random_uuid(),
            p_user_id,
            -p_price,
            v_new_balance,
            'purchase',
            'Course purchase',
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

-- Create the CORRECT item purchase function with proper transaction_type
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
    v_item_name text;
    v_item_stock integer;
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

    -- Get item details
    SELECT COALESCE(name, 'Unknown Item'), COALESCE(stock, 0)
    INTO v_item_name, v_item_stock
    FROM items
    WHERE id = p_item_id;

    -- Check stock
    IF v_item_stock <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'This item is out of stock'
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
        -- Update user balance
        UPDATE user_coins
        SET balance = v_new_balance,
            updated_at = NOW()
        WHERE user_id = p_user_id;

        -- Reduce item stock
        UPDATE items
        SET stock = stock - 1,
            updated_at = NOW()
        WHERE id = p_item_id;

        -- Add transaction record with CORRECT column name
        INSERT INTO coin_transactions (
            id,
            user_id,
            amount,
            balance_after,
            transaction_type,
            description,
            created_at
        ) VALUES (
            gen_random_uuid(),
            p_user_id,
            -p_price,
            v_new_balance,
            'purchase',
            'Item purchase: ' || v_item_name,
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
            v_item_name,
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

-- Also create the old shop function for backward compatibility
CREATE OR REPLACE FUNCTION process_shop_purchase(
    p_user_id uuid,
    p_item_id uuid,
    p_item_price integer
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result jsonb;
    v_purchase_id uuid;
BEGIN
    -- Call the new item purchase function
    SELECT process_item_purchase(p_user_id, p_item_id, p_item_price) INTO v_result;
    
    -- Extract purchase_id from result
    SELECT (v_result->>'purchase_id')::uuid INTO v_purchase_id;
    
    -- If purchase failed, raise exception
    IF NOT (v_result->>'success')::boolean THEN
        RAISE EXCEPTION '%', v_result->>'message';
    END IF;
    
    RETURN v_purchase_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION process_course_purchase(uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION process_item_purchase(uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION process_shop_purchase(uuid, uuid, integer) TO authenticated;
