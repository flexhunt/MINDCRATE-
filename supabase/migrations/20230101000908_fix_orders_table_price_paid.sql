-- Fix the orders table structure and purchase function to handle price_paid column

-- First, let's make sure the orders table has all required columns
DO $$ 
BEGIN
    -- Add missing columns to orders table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'price_paid') THEN
        ALTER TABLE orders ADD COLUMN price_paid INTEGER NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'item_name') THEN
        ALTER TABLE orders ADD COLUMN item_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'item_type') THEN
        ALTER TABLE orders ADD COLUMN item_type TEXT DEFAULT 'item';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'status') THEN
        ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'completed';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'created_at') THEN
        ALTER TABLE orders ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'updated_at') THEN
        ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Drop and recreate the item purchase function with proper column handling
DROP FUNCTION IF EXISTS process_item_purchase(uuid, uuid, integer);

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

    -- Get item details from shop_items table (more likely to exist)
    SELECT COALESCE(name, 'Unknown Item'), COALESCE(stock, 999)
    INTO v_item_name, v_item_stock
    FROM shop_items
    WHERE id = p_item_id;

    -- If not found in shop_items, try items table
    IF v_item_name = 'Unknown Item' THEN
        SELECT COALESCE(name, 'Unknown Item'), COALESCE(stock, 999)
        INTO v_item_name, v_item_stock
        FROM items
        WHERE id = p_item_id;
    END IF;

    -- Check stock (only if stock tracking is enabled)
    IF v_item_stock IS NOT NULL AND v_item_stock <= 0 THEN
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

        -- Reduce item stock (try both tables)
        UPDATE shop_items
        SET stock = GREATEST(0, COALESCE(stock, 999) - 1),
            updated_at = NOW()
        WHERE id = p_item_id;

        UPDATE items
        SET stock = GREATEST(0, COALESCE(stock, 999) - 1),
            updated_at = NOW()
        WHERE id = p_item_id;

        -- Add transaction record
        INSERT INTO coin_transactions (
            user_id,
            amount,
            balance_after,
            transaction_type,
            description,
            created_at
        ) VALUES (
            p_user_id,
            -p_price,
            v_new_balance,
            'purchase',
            'Item purchase: ' || v_item_name,
            NOW()
        );

        -- Create order record with ALL required columns
        INSERT INTO orders (
            id,
            user_id,
            item_id,
            price_paid,
            item_name,
            item_type,
            status,
            created_at,
            updated_at
        ) VALUES (
            v_purchase_id,
            p_user_id,
            p_item_id,
            p_price,
            v_item_name,
            'item',
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

-- Also fix the shop purchase function to handle price_paid
DROP FUNCTION IF EXISTS process_shop_purchase(uuid, uuid, text, integer);
DROP FUNCTION IF EXISTS process_shop_purchase(uuid, uuid, integer);

CREATE OR REPLACE FUNCTION process_shop_purchase(
    p_user_id uuid,
    p_item_id uuid,
    p_item_name text,
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
GRANT EXECUTE ON FUNCTION process_item_purchase(uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION process_shop_purchase(uuid, uuid, text, integer) TO authenticated;
