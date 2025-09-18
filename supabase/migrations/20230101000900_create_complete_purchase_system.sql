-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS process_course_purchase(uuid, uuid, integer);
DROP FUNCTION IF EXISTS process_item_purchase(uuid, uuid, integer);

-- Ensure all required tables exist
CREATE TABLE IF NOT EXISTS user_coins (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    balance integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS coin_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount integer NOT NULL,
    type text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS user_courses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    course_id uuid NOT NULL,
    purchased_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    item_id uuid NOT NULL,
    item_name text NOT NULL,
    item_type text NOT NULL DEFAULT 'item',
    price integer NOT NULL,
    status text DEFAULT 'completed' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create course purchase function
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

    -- Get course title for transaction description
    SELECT COALESCE(title, 'Unknown Course') INTO v_course_title
    FROM courses
    WHERE id = p_course_id;

    -- Generate purchase ID
    v_purchase_id := gen_random_uuid();

    -- Start transaction
    BEGIN
        -- Deduct coins from user balance
        UPDATE user_coins
        SET balance = balance - p_price,
            updated_at = NOW()
        WHERE user_id = p_user_id;

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
        'new_balance', v_user_balance - p_price
    );
END;
$$;

-- Create item purchase function
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

    -- Get item details and check stock
    SELECT COALESCE(name, 'Unknown Item'), COALESCE(stock, 0)
    INTO v_item_name, v_item_stock
    FROM items
    WHERE id = p_item_id;

    -- Check if item is in stock
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

    -- Generate purchase ID
    v_purchase_id := gen_random_uuid();

    -- Start transaction
    BEGIN
        -- Deduct coins from user balance
        UPDATE user_coins
        SET balance = balance - p_price,
            updated_at = NOW()
        WHERE user_id = p_user_id;

        -- Reduce item stock
        UPDATE items
        SET stock = stock - 1,
            updated_at = NOW()
        WHERE id = p_item_id;

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
        'new_balance', v_user_balance - p_price
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION process_course_purchase(uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION process_item_purchase(uuid, uuid, integer) TO authenticated;

-- Enable RLS on all tables
ALTER TABLE user_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own coins" ON user_coins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own coins" ON user_coins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own coins" ON user_coins FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own transactions" ON coin_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions" ON coin_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own courses" ON user_courses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own courses" ON user_courses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_coins_user_id ON user_coins(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_course_id ON user_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_item_id ON orders(item_id);
