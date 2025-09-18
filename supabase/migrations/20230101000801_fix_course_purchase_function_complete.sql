-- Drop existing function if it exists
DROP FUNCTION IF EXISTS process_course_purchase(uuid, uuid, integer);

-- Create the course purchase function
CREATE OR REPLACE FUNCTION process_course_purchase(
  p_user_id uuid,
  p_course_id uuid,
  p_course_price integer
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_balance integer;
  v_purchase_id uuid;
  v_course_exists boolean;
  v_already_purchased boolean;
BEGIN
  -- Check if course exists
  SELECT EXISTS(
    SELECT 1 FROM courses WHERE id = p_course_id
  ) INTO v_course_exists;
  
  IF NOT v_course_exists THEN
    RAISE EXCEPTION 'Course not found';
  END IF;

  -- Check if user already has access
  SELECT EXISTS(
    SELECT 1 FROM user_courses 
    WHERE user_id = p_user_id AND course_id = p_course_id
  ) INTO v_already_purchased;
  
  IF v_already_purchased THEN
    RAISE EXCEPTION 'You already have access to this course';
  END IF;

  -- Get user's current balance
  SELECT COALESCE(balance, 0) INTO v_user_balance
  FROM user_coins
  WHERE user_id = p_user_id;

  -- Check if user has enough coins
  IF v_user_balance < p_course_price THEN
    RAISE EXCEPTION 'Insufficient coins. You have % coins but need %', v_user_balance, p_course_price;
  END IF;

  -- Generate purchase ID
  v_purchase_id := gen_random_uuid();

  -- Start transaction
  BEGIN
    -- Deduct coins from user balance
    UPDATE user_coins
    SET balance = balance - p_course_price,
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
      -p_course_price,
      'purchase',
      'Course purchase: ' || (SELECT title FROM courses WHERE id = p_course_id),
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
      (SELECT title FROM courses WHERE id = p_course_id),
      'course',
      p_course_price,
      'completed',
      NOW(),
      NOW()
    );

  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback will happen automatically
      RAISE EXCEPTION 'Purchase failed: %', SQLERRM;
  END;

  RETURN v_purchase_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION process_course_purchase(uuid, uuid, integer) TO authenticated;
