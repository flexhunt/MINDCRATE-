-- First, let's check if user_ranks is a view and get its definition
DO $$
DECLARE
  view_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM pg_catalog.pg_views
    WHERE schemaname = 'public'
    AND viewname = 'user_ranks'
  ) INTO view_exists;

  IF view_exists THEN
    RAISE NOTICE 'user_ranks is a view, not modifying it directly';
  END IF;
END $$;

-- Create user_activity_scores table to track different activities
CREATE TABLE IF NOT EXISTS public.user_activity_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create user_rank_data table to store the actual rank data
CREATE TABLE IF NOT EXISTS public.user_rank_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  current_rank TEXT NOT NULL DEFAULT 'bronze',
  total_score INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_rank_data_user_id ON public.user_rank_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_scores_user_id ON public.user_activity_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_scores_type ON public.user_activity_scores(activity_type);

-- Enable row level security
ALTER TABLE public.user_activity_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rank_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow users to view all rank data" 
  ON public.user_rank_data 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow users to view all activity scores" 
  ON public.user_activity_scores 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- ADD THESE POLICIES
CREATE POLICY "Allow users to insert their own rank data" 
ON public.user_rank_data 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own rank data" 
ON public.user_rank_data 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to calculate rank based on score
CREATE OR REPLACE FUNCTION calculate_rank(score INTEGER) 
RETURNS TEXT AS $$
BEGIN
  IF score >= 2200 THEN
    RETURN 'grandmaster';
  ELSIF score >= 1500 THEN
    RETURN 'conqueror';
  ELSIF score >= 1000 THEN
    RETURN 'ace';
  ELSIF score >= 600 THEN
    RETURN 'diamond';
  ELSIF score >= 300 THEN
    RETURN 'platinum';
  ELSIF score >= 150 THEN
    RETURN 'gold';
  ELSIF score >= 50 THEN
    RETURN 'silver';
  ELSE
    RETURN 'bronze';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to update user rank based on total score
CREATE OR REPLACE FUNCTION update_user_rank() 
RETURNS TRIGGER AS $$
BEGIN
  -- Update the user's rank based on their new total score
  UPDATE public.user_rank_data
  SET current_rank = calculate_rank(NEW.total_score),
      last_updated = timezone('utc'::text, now())
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update rank when total score changes
CREATE TRIGGER trigger_update_user_rank
AFTER UPDATE OF total_score ON public.user_rank_data
FOR EACH ROW
EXECUTE FUNCTION update_user_rank();

-- Replace the add_activity_score function with this updated version that uses SECURITY DEFINER

-- Create function to add activity score and update total score
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

-- Create function for monthly rank decay (to be called by a scheduled job)
CREATE OR REPLACE FUNCTION apply_monthly_rank_decay() 
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_rank_data
  SET total_score = ROUND(total_score * 0.8),
      last_updated = timezone('utc'::text, now());
END;
$$ LANGUAGE plpgsql;
