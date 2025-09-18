-- Fix the purchase_item function to avoid ambiguous column references
CREATE OR REPLACE FUNCTION public.purchase_item(item_id UUID, input_user_id UUID)
RETURNS JSON AS $$
DECLARE
  item_record RECORD;
  user_balance INTEGER;
  new_balance INTEGER;
  order_id UUID;
BEGIN
  -- Check if item exists and is active
  SELECT * INTO item_record FROM public.items WHERE id = item_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Item not found or not available');
  END IF;

  -- Check if item is in stock
  IF item_record.stock = 0 THEN
    RETURN json_build_object('success', false, 'message', 'Item out of stock');
  END IF;

  -- Get user's current balance
  SELECT balance INTO user_balance FROM public.user_coins WHERE user_id = input_user_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'User has no coin balance');
  END IF;

  -- Check if user has enough coins
  IF user_balance < item_record.price THEN
    RETURN json_build_object('success', false, 'message', 'Insufficient coins');
  END IF;

  -- Begin transaction
  BEGIN
    -- Deduct coins from user's balance
    new_balance := user_balance - item_record.price;
    UPDATE public.user_coins 
    SET balance = new_balance, updated_at = NOW() 
    WHERE user_id = input_user_id;

    -- Record the transaction
    INSERT INTO public.coin_transactions (
      user_id, 
      amount, 
      balance_after, 
      transaction_type, 
      description, 
      metadata
    ) VALUES (
      input_user_id, 
      -item_record.price, 
      new_balance, 
      'shop_purchase', 
      'Purchased item: ' || item_record.name, 
      json_build_object('item_id', item_id)
    );

    -- Create order record
    INSERT INTO public.orders (
      user_id, 
      item_id, 
      price_paid
    ) VALUES (
      input_user_id, 
      item_id, 
      item_record.price
    ) RETURNING id INTO order_id;

    -- Decrease item stock
    UPDATE public.items 
    SET stock = stock - 1, updated_at = NOW() 
    WHERE id = item_id;

    -- Return success
    RETURN json_build_object(
      'success', true, 
      'message', 'Purchase successful', 
      'order_id', order_id, 
      'new_balance', new_balance
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback is automatic on exception
      RETURN json_build_object('success', false, 'message', 'Transaction failed: ' || SQLERRM);
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
