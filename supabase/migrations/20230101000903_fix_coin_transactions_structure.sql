-- Drop existing functions
DROP FUNCTION IF EXISTS process_course_purchase(uuid, uuid, integer);
DROP FUNCTION IF EXISTS process_item_purchase(uuid, uuid, integer);

-- Create course purchase function that handles all required columns
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
    v_course_title text;
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

    -- Get course title (optional)
    BEGIN
        SELECT COALESCE(title, 'Course Purchase') INTO v_course_title
        FROM courses
        WHERE id = p_course_id;
    EXCEPTION
        WHEN OTHERS THEN
            v_course_title := 'Course Purchase';
    END;

    -- Start transaction
    BEGIN
        -- Deduct coins from user balance
        UPDATE user_coins
        SET balance = v_new_balance,
            updated_at = NOW()
        WHERE user_id = p_user_id;

        -- Add transaction record with all required columns
        INSERT INTO coin_transactions (
            id,
            user_id,
            amount,
            balance_after,
            type,
            description,
            created_at
        ) VALUES (
            gen_random_uuid(),
            p_user_id,
            -p_price,
            v_new_balance,
            COALESCE('purchase', 'debit'),
            'Course purchase: ' || v_course_title,
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
            v_course_title,
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

-- Create item purchase function that handles all required columns
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

    -- Get item name (optional)
    BEGIN
        SELECT COALESCE(name, 'Item Purchase') INTO v_item_name
        FROM items
        WHERE id = p_item_id;
    EXCEPTION
        WHEN OTHERS THEN
            v_item_name := 'Item Purchase';
    END;

    -- Start transaction
    BEGIN
        -- Deduct coins from user balance
        UPDATE user_coins
        SET balance = v_new_balance,
            updated_at = NOW()
        WHERE user_id = p_user_id;

        -- Add transaction record with all required columns
        INSERT INTO coin_transactions (
            id,
            user_id,
            amount,
            balance_after,
            type,
            description,
            created_at
        ) VALUES (
            gen_random_uuid(),
            p_user_id,
            -p_price,
            v_new_balance,
            COALESCE('purchase', 'debit'),
            'Item purchase: ' || v_item_name,
            NOW()
        );

        -- Try to update item stock (ignore if items table doesn't exist)
        BEGIN
            UPDATE items
            SET stock = GREATEST(stock - 1, 0),
                updated_at = NOW()
            WHERE id = p_item_id;
        EXCEPTION
            WHEN OTHERS THEN
                -- Ignore stock update errors
                NULL;
        END;

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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION process_course_purchase(uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION process_item_purchase(uuid, uuid, integer) TO authenticated;
