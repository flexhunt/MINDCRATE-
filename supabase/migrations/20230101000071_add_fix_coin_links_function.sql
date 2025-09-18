-- Function to create a fixed process_coin_link function with the correct column names
CREATE OR REPLACE FUNCTION admin_create_fixed_coin_link_function(
  p_user_id_column TEXT,
  p_transaction_user_id_column TEXT
) RETURNS VOID AS $$
DECLARE
  v_function_sql TEXT;
BEGIN
  -- Create the function with the correct column names
  v_function_sql := '
  CREATE OR REPLACE FUNCTION process_coin_link(
    p_code TEXT,
    p_user_id UUID
  ) RETURNS JSONB AS $func$
  DECLARE
    v_link_id UUID;
    v_coins INTEGER;
    v_description TEXT;
    v_max_uses INTEGER;
    v_uses INTEGER;
    v_result JSONB;
  BEGIN
    -- Get link details
    SELECT id, coins, description, max_uses
    INTO v_link_id, v_coins, v_description, v_max_uses
    FROM coin_links
    WHERE code = p_code AND active = true;
    
    IF v_link_id IS NULL THEN
      RETURN jsonb_build_object(''success'', false, ''message'', ''Link not found or inactive'');
    END IF;
    
    -- Check if user has already used this link
    SELECT COUNT(*)
    INTO v_uses
    FROM coin_link_uses
    WHERE link_id = v_link_id AND user_id = p_user_id;
    
    IF v_uses >= v_max_uses THEN
      RETURN jsonb_build_object(''success'', false, ''message'', ''You have already used this link'');
    END IF;
    
    -- Record the use
    INSERT INTO coin_link_uses (link_id, user_id)
    VALUES (v_link_id, p_user_id);
    
    -- Add coins to user using the existing user_coins table with the correct column name
    UPDATE user_coins
    SET balance = balance + v_coins,
        lifetime_earned = lifetime_earned + v_coins,
        updated_at = now()
    WHERE ' || p_user_id_column || ' = p_user_id;
    
    -- Record the transaction in the existing coin_transactions table with the correct column name
    INSERT INTO coin_transactions (
      ' || p_transaction_user_id_column || ',
      amount,
      balance_after,
      transaction_type,
      description,
      metadata
    )
    VALUES (
      p_user_id,
      v_coins,
      (SELECT balance FROM user_coins WHERE ' || p_user_id_column || ' = p_user_id),
      ''coin_link'',
      COALESCE(v_description, ''Earned from coin link''),
      jsonb_build_object(''link_id'', v_link_id, ''code'', p_code)
    );
    
    v_result := jsonb_build_object(
      ''success'', true,
      ''coins'', v_coins,
      ''message'', ''Coins added successfully''
    );
    
    RETURN v_result;
  END;
  $func$ LANGUAGE plpgsql SECURITY DEFINER;
  ';
  
  -- Execute the dynamic SQL
  EXECUTE v_function_sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
