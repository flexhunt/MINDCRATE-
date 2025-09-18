-- First, let's check and fix the coin_transactions table structure
DO $$
BEGIN
    -- Add type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'coin_transactions' AND column_name = 'type') THEN
        ALTER TABLE coin_transactions ADD COLUMN type text;
    END IF;
    
    -- Add description column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'coin_transactions' AND column_name = 'description') THEN
        ALTER TABLE coin_transactions ADD COLUMN description text;
    END IF;
END $$;

-- Drop and recreate the purchase functions with proper error handling
DROP FUNCTION IF EXISTS process_course_purchase(uuid, uuid, integer);
DROP FUNCTION IF EXISTS process_item_purchase(uuid, uuid, integer);

-- Create course purchase function with better column handling
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
    v_course_title text;
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

    -- Get course title for transaction description
    SELECT COALESCE(title, 'Unknown Course') INTO v_course_title
    FROM courses
    WHERE id = p_course_id;

    -- If course not found, use a default name
    IF v_course_title IS NULL THEN
        v_course_title := 'Course Purchase';
    END IF;

    -- Generate purchase ID
    v_purchase_id := gen_random_uuid();

    -- Start transaction
    BEGIN
        -- Deduct coins from user balance
        UPDATE user_coins
        SET balance = v_new_balance,
            updated_at = NOW()
        WHERE user_id = p_user_id;

        -- Add transaction record (handle missing columns gracefully)
        INSERT INTO coin_transactions (
            id,
            user_id,
            amount,
            type,
            description,
            created_at
        ) VALUES (
            gen_random_uuid(),
            p_user_id,
            -p_price,
            'purchase',
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

        -- Create order record for consistency
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
            -- Rollback will happen automatically
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

-- Create item purchase function with better column handling
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
    v_item_name text;
    v_already_purchased boolean;
    v_item_stock integer;
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

    -- Get item details and check stock (handle missing items table gracefully)
    BEGIN
        SELECT COALESCE(name, 'Unknown Item'), COALESCE(stock, 999)
        INTO v_item_name, v_item_stock
        FROM items
        WHERE id = p_item_id;
    EXCEPTION
        WHEN OTHERS THEN
            -- If items table doesn't exist or item not found, use defaults
            v_item_name := 'Item Purchase';
            v_item_stock := 999;
    END;

    -- Check if item is in stock (skip if no stock tracking)
    IF v_item_stock <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'This item is out of stock'
        );
    END IF;

    -- Generate purchase ID
    v_purchase_id := gen_random_uuid();

    -- Start transaction
    BEGIN
        -- Deduct coins from user balance
        UPDATE user_coins
        SET balance = v_new_balance,
            updated_at = NOW()
        WHERE user_id = p_user_id;

        -- Try to reduce item stock (ignore if items table doesn't exist)
        BEGIN
            UPDATE items
            SET stock = stock - 1,
                updated_at = NOW()
            WHERE id = p_item_id;
        EXCEPTION
            WHEN OTHERS THEN
                -- Ignore stock update errors
                NULL;
        END;

        -- Add transaction record
        INSERT INTO coin_transactions (
            id,
            user_id,
            amount,
            type,
            description,
            created_at
        ) VALUES (
            gen_random_uuid(),
            p_user_id,
            -p_price,
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
            -- Rollback will happen automatically
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
