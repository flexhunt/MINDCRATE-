-- Create login_streaks table to track user logins
CREATE TABLE public.login_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 1,
  longest_streak INTEGER DEFAULT 1,
  last_login_date DATE DEFAULT CURRENT_DATE,
  total_logins INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create user_badges table to store earned badges
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_color TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, badge_type)
);

-- Create available_badges table to define all possible badges
CREATE TABLE public.available_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_type TEXT NOT NULL UNIQUE,
  badge_name TEXT NOT NULL,
  badge_description TEXT NOT NULL,
  badge_color TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  badge_tier TEXT NOT NULL
);

-- Insert default badges
INSERT INTO public.available_badges 
  (badge_type, badge_name, badge_description, badge_color, requirement_type, requirement_value, badge_tier)
VALUES
  ('login_streak_7', 'Weekly Warrior', 'Login for 7 consecutive days', '#4CAF50', 'login_streak', 7, 'common'),
  ('login_streak_15', 'Dedicated User', 'Login for 15 consecutive days', '#2196F3', 'login_streak', 15, 'uncommon'),
  ('login_streak_30', 'Monthly Master', 'Login for 30 consecutive days', '#9C27B0', 'login_streak', 30, 'rare'),
  ('login_streak_60', 'Persistent Pro', 'Login for 60 consecutive days', '#FF9800', 'login_streak', 60, 'epic'),
  ('login_streak_100', 'Centurion', 'Login for 100 consecutive days', '#F44336', 'login_streak', 100, 'legendary'),
  ('login_streak_365', 'Year-Long Legend', 'Login for 365 consecutive days', '#E91E63', 'login_streak', 365, 'mythic'),
  ('total_logins_50', 'Frequent Visitor', 'Login 50 times total', '#8BC34A', 'total_logins', 50, 'common'),
  ('total_logins_100', 'Regular Member', 'Login 100 times total', '#03A9F4', 'total_logins', 100, 'uncommon'),
  ('total_logins_250', 'Devoted Fan', 'Login 250 times total', '#673AB7', 'total_logins', 250, 'rare'),
  ('total_logins_500', 'Loyal Enthusiast', 'Login 500 times total', '#FF5722', 'total_logins', 500, 'epic'),
  ('total_logins_1000', 'Ultimate Supporter', 'Login 1000 times total', '#E53935', 'total_logins', 1000, 'legendary');

-- Enable row level security
ALTER TABLE public.login_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.available_badges ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all badges" 
  ON public.available_badges 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can view all user badges" 
  ON public.user_badges 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can view all login streaks" 
  ON public.login_streaks 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can update their own login streak" 
  ON public.login_streaks 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own login streak" 
  ON public.login_streaks 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create function to update login streak
CREATE OR REPLACE FUNCTION update_login_streak() 
RETURNS TRIGGER AS $$
DECLARE
  yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  badge_record RECORD;
BEGIN
  -- If this is a new day (not the same as last_login_date)
  IF NEW.last_login_date <> OLD.last_login_date THEN
    -- If the last login was yesterday, increment the streak
    IF OLD.last_login_date = yesterday THEN
      NEW.current_streak := OLD.current_streak + 1;
      
      -- Update longest streak if current streak is longer
      IF NEW.current_streak > OLD.longest_streak THEN
        NEW.longest_streak := NEW.current_streak;
      END IF;
    -- If the last login was not yesterday, reset the streak to 1
    ELSIF OLD.last_login_date <> yesterday THEN
      NEW.current_streak := 1;
    END IF;
    
    -- Increment total logins
    NEW.total_logins := OLD.total_logins + 1;
  END IF;
  
  -- Check for streak badges
  FOR badge_record IN 
    SELECT * FROM public.available_badges 
    WHERE requirement_type = 'login_streak' 
    AND requirement_value <= NEW.current_streak
  LOOP
    -- Insert badge if not already earned
    INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_color)
    VALUES (NEW.user_id, badge_record.badge_type, badge_record.badge_name, badge_record.badge_color)
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END LOOP;
  
  -- Check for total login badges
  FOR badge_record IN 
    SELECT * FROM public.available_badges 
    WHERE requirement_type = 'total_logins' 
    AND requirement_value <= NEW.total_logins
  LOOP
    -- Insert badge if not already earned
    INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_color)
    VALUES (NEW.user_id, badge_record.badge_type, badge_record.badge_name, badge_record.badge_color)
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update login streak
CREATE TRIGGER trigger_update_login_streak
BEFORE UPDATE ON public.login_streaks
FOR EACH ROW
EXECUTE FUNCTION update_login_streak();

-- Create function to record login
CREATE OR REPLACE FUNCTION record_user_login(p_user_id UUID) 
RETURNS VOID AS $$
BEGIN
  -- Insert or update login streak
  INSERT INTO public.login_streaks (user_id, last_login_date)
  VALUES (p_user_id, CURRENT_DATE)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    last_login_date = CURRENT_DATE,
    updated_at = timezone('utc'::text, now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION record_user_login(UUID) TO authenticated;
