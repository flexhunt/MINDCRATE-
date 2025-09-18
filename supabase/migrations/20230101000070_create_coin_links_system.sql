-- Create coin_links table
CREATE TABLE IF NOT EXISTS coin_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  coins INTEGER NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  active BOOLEAN DEFAULT true,
  max_uses INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create coin_link_uses table to track which users have used which links
CREATE TABLE IF NOT EXISTS coin_link_uses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id UUID REFERENCES coin_links(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(link_id, user_id)
);

-- Create coin_earning_opportunities table for the /earn-coins page
CREATE TABLE IF NOT EXISTS coin_earning_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  coins INTEGER NOT NULL,
  short_url TEXT NOT NULL,
  original_link_id UUID REFERENCES coin_links(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up RLS policies
ALTER TABLE coin_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_link_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_earning_opportunities ENABLE ROW LEVEL SECURITY;

-- Admin can see and manage all coin links
CREATE POLICY "Admins can do everything with coin_links" ON coin_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM owners WHERE user_id = auth.uid()
    )
  );

-- Users can only see their own coin link uses
CREATE POLICY "Users can see their own coin link uses" ON coin_link_uses
  FOR SELECT USING (user_id = auth.uid());

-- Admins can manage all coin link uses
CREATE POLICY "Admins can do everything with coin_link_uses" ON coin_link_uses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM owners WHERE user_id = auth.uid()
    )
  );

-- Everyone can see active earning opportunities
CREATE POLICY "Everyone can see active earning opportunities" ON coin_earning_opportunities
  FOR SELECT USING (active = true);

-- Admins can manage all earning opportunities
CREATE POLICY "Admins can do everything with coin_earning_opportunities" ON coin_earning_opportunities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM owners WHERE user_id = auth.uid()
    )
  );

-- Function to process a coin link visit
-- Let's check the structure of your existing tables first
CREATE OR REPLACE FUNCTION process_coin_link(
  p_code TEXT,
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_link_id UUID;
  v_coins INTEGER;
  v_description TEXT;
  v_max_uses INTEGER;
  v_uses INTEGER;
  v_result JSONB;
  v_user_coins_column_name TEXT;
  v_transaction_column_name TEXT;
BEGIN
  -- Get link details
  SELECT id, coins, description, max_uses
  INTO v_link_id, v_coins, v_description, v_max_uses
  FROM coin_links
  WHERE code = p_code AND active = true;
  
  IF v_link_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Link not found or inactive');
  END IF;
  
  -- Check if user has already used this link
  SELECT COUNT(*)
  INTO v_uses
  FROM coin_link_uses
  WHERE link_id = v_link_id AND user_id = p_user_id;
  
  IF v_uses >= v_max_uses THEN
    RETURN jsonb_build_object('success', false, 'message', 'You have already used this link the maximum number of times');
  END IF;
  
  -- We're not checking total uses across all users anymore, just per user

  -- Record the use
  INSERT INTO coin_link_uses (link_id, user_id)
  VALUES (v_link_id, p_user_id);
  
  -- Add coins to user using the existing user_coins table
  -- Check if the column is named user_id or id
  BEGIN
    UPDATE user_coins
    SET balance = balance + v_coins,
        lifetime_earned = lifetime_earned + v_coins,
        updated_at = now()
    WHERE user_id = p_user_id;
    
    -- Record the transaction in the existing coin_transactions table
    INSERT INTO coin_transactions (
      user_id,
      amount,
      balance_after,
      transaction_type,
      description,
      metadata
    )
    VALUES (
      p_user_id,
      v_coins,
      (SELECT balance FROM user_coins WHERE user_id = p_user_id),
      'coin_link',
      COALESCE(v_description, 'Earned from coin link'),
      jsonb_build_object('link_id', v_link_id, 'code', p_code)
    );
  EXCEPTION
    WHEN undefined_column THEN
      -- Try with a different column name
      UPDATE user_coins
      SET balance = balance + v_coins,
          lifetime_earned = lifetime_earned + v_coins,
          updated_at = now()
      WHERE id = p_user_id;
      
      -- Record the transaction with different column name
      INSERT INTO coin_transactions (
        id,
        amount,
        balance_after,
        transaction_type,
        description,
        metadata
      )
      VALUES (
        p_user_id,
        v_coins,
        (SELECT balance FROM user_coins WHERE id = p_user_id),
        'coin_link',
        COALESCE(v_description, 'Earned from coin link'),
        jsonb_build_object('link_id', v_link_id, 'code', p_code)
      );
  END;
  
  v_result := jsonb_build_object(
    'success', true,
    'coins', v_coins,
    'message', 'Coins added successfully'
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
