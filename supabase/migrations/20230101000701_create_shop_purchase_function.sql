-- Create function to process shop purchases
CREATE OR REPLACE FUNCTION process_shop_purchase(
    p_user_id UUID,
    p_item_id UUID,
    p_item_name TEXT,
    p_item_price INTEGER
) RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_current_balance INTEGER;
BEGIN
    -- Get current balance
    SELECT balance INTO v_current_balance
    FROM user_coins
    WHERE user_id = p_user_id;

    -- Check if user has enough coins
    IF v_current_balance < p_item_price THEN
        RAISE EXCEPTION 'Insufficient coins';
    END IF;

    -- Check if user already owns this item
    IF EXISTS (
        SELECT 1 FROM shop_orders 
        WHERE user_id = p_user_id 
        AND item_id = p_item_id 
        AND status = 'completed'
    ) THEN
        RAISE EXCEPTION 'Item already purchased';
    END IF;

    -- Deduct coins
    UPDATE user_coins
    SET balance = balance - p_item_price,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Create order record
    INSERT INTO shop_orders (user_id, item_id, item_name, item_price, status)
    VALUES (p_user_id, p_item_id, p_item_name, p_item_price, 'completed')
    RETURNING id INTO v_order_id;

    -- Update item stock if applicable
    UPDATE shop_items
    SET stock = GREATEST(0, stock - 1),
        updated_at = NOW()
    WHERE id = p_item_id AND stock IS NOT NULL AND stock > 0;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
