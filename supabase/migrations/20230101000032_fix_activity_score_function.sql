-- Drop the existing function
DROP FUNCTION IF EXISTS add_activity_score(UUID, TEXT, INTEGER);

-- Recreate the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION add_activity_score(
  p_user_id UUID,
  p_activity_type TEXT,
  p_score INTEGER
) RETURNS VOID AS $
BEGIN
  -- Insert activity score
  INSERT INTO public.user_activity_scores (user_id, activity_type, score)
  VALUES (p_user_id, p_activity_type, p_score);
  
  -- Update or insert user rank data
  INSERT INTO public.user_rank_data (user_id, total_score)
  VALUES (p_user_id, p_score)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    total_score = user_rank_data.total_score + p_score,
    last_updated = timezone('utc'::text, now());
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_activity_score(UUID, TEXT, INTEGER) TO authenticated;
