-- Drop the existing function
DROP FUNCTION IF EXISTS public.process_coin_link(text, uuid);

-- Recreate the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.process_coin_link(
  link_code text,
  uid uuid
) RETURNS jsonb 
SECURITY DEFINER -- This allows the function to bypass RLS
SET search_path = public
AS $$
DECLARE
  link_record record;
  uses_count integer;
BEGIN
  -- Get the coin link
  SELECT * INTO link_record FROM public.coin_links
  WHERE code = link_code AND active = true;

  -- Check if link exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Link not found or inactive');
  END IF;

  -- Check if user has already used this link
  SELECT count(*) INTO uses_count FROM public.coin_link_uses
  WHERE link_id = link_record.id AND user_id = uid;

  -- Check if max uses reached
  IF uses_count >= link_record.max_uses THEN
    RETURN jsonb_build_object('success', false, 'message', 'Maximum uses reached');
  END IF;

  -- Record the use
  INSERT INTO public.coin_link_uses (link_id, user_id)
  VALUES (link_record.id, uid);

  -- Update user's coin balance
  INSERT INTO public.user_coins (user_id, balance, lifetime_earned)
  VALUES (uid, link_record.coins, link_record.coins)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance = public.user_coins.balance + link_record.coins,
    lifetime_earned = public.user_coins.lifetime_earned + link_record.coins,
    updated_at = now();

  -- Return success
  RETURN jsonb_build_object(
    'success', true, 
    'coins_awarded', link_record.coins
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.process_coin_link(text, uuid) TO authenticated;
