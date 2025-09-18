-- Improve the coin deduction functionality
CREATE OR REPLACE FUNCTION deduct_coins(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Lock the user_coins row to prevent concurrent updates
  SELECT balance INTO v_current_balance
  FROM user_coins
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Check if user has enough coins
  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User has no coin balance'
    );
  END IF;
  
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Insufficient coins',
      'required', p_amount,
      'balance', v_current_balance
    );
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_current_balance - p_amount;
  
  -- Update user_coins table
  UPDATE user_coins
  SET balance = v_new_balance,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Record the transaction
  INSERT INTO coin_transactions (
    user_id,
    amount,
    balance_after,
    transaction_type,
    description,
    metadata
  ) VALUES (
    p_user_id,
    -p_amount,  -- Negative amount for deduction
    v_new_balance,
    p_transaction_type,
    p_description,
    p_metadata
  ) RETURNING id INTO v_transaction_id;
  
  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Coins deducted successfully',
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'amount_deducted', p_amount,
    'transaction_id', v_transaction_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the purchase_course function to use the new deduct_coins function
CREATE OR REPLACE FUNCTION purchase_course(
  course_id UUID,
  user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_course_price INTEGER;
  v_course_title TEXT;
  v_deduction_result JSONB;
BEGIN
  -- Check if user already has access to this course
  IF EXISTS (
    SELECT 1 FROM user_courses
    WHERE user_id = purchase_course.user_id
    AND course_id = purchase_course.course_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'You already have access to this course'
    );
  END IF;
  
  -- Get course details
  SELECT price, title INTO v_course_price, v_course_title
  FROM courses
  WHERE id = course_id;
  
  IF v_course_price IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Course not found'
    );
  END IF;
  
  -- Deduct coins using the dedicated function
  v_deduction_result := deduct_coins(
    user_id,
    v_course_price,
    'course_purchase',
    'Purchased course: ' || v_course_title,
    jsonb_build_object('course_id', course_id)
  );
  
  -- If deduction failed, return the error
  IF NOT (v_deduction_result->>'success')::BOOLEAN THEN
    RETURN v_deduction_result;
  END IF;
  
  -- Grant access to the course
  INSERT INTO user_courses (
    user_id,
    course_id,
    price_paid,
    purchased_at
  ) VALUES (
    user_id,
    course_id,
    v_course_price,
    NOW()
  );
  
  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Course purchased successfully',
    'course_title', v_course_title,
    'price', v_course_price,
    'new_balance', (v_deduction_result->>'new_balance')::INTEGER
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
