-- Create a function to get the quiz leaderboard using the existing quiz tables
CREATE OR REPLACE FUNCTION get_quiz_leaderboard(limit_count integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  username text,
  name text,
  avatar_url text,
  score bigint,
  rank bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_scores AS (
    SELECT 
      p.id,
      p.username,
      p.name,
      p.avatar_url,
      COALESCE(SUM(up.score), 0) as total_score
    FROM 
      profiles p
    LEFT JOIN 
      user_progress up ON p.id = up.user_id
    GROUP BY 
      p.id, p.username, p.name, p.avatar_url
    ORDER BY 
      total_score DESC
    LIMIT 
      limit_count
  )
  SELECT 
    us.id,
    us.username,
    us.name,
    us.avatar_url,
    us.total_score as score,
    ROW_NUMBER() OVER (ORDER BY us.total_score DESC) as rank
  FROM 
    user_scores us
  ORDER BY 
    rank ASC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_quiz_leaderboard TO authenticated;
