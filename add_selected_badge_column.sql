-- Add selected_badge_id column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS selected_badge_id bigint REFERENCES public.badges(id);

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_selected_badge_id ON public.profiles(selected_badge_id);

-- Add some sample badges for testing
INSERT INTO public.badges (name, description, image_url, rarity) VALUES
('Early Adopter', 'One of the first users on the platform', '/badges/early-adopter.png', 'rare'),
('Contributor', 'Contributed to the platform', '/badges/contributor.png', 'uncommon'),
('Explorer', 'Explored all areas of the platform', '/badges/explorer.png', 'common'),
('Developer', 'Platform developer', '/badges/developer.png', 'legendary'),
('Supporter', 'Supports the platform', '/badges/supporter.png', 'epic')
ON CONFLICT (name) DO NOTHING;

-- Give yourself some badges for testing (replace 'your-user-id' with your actual user ID)
-- You can find your user ID by running: SELECT id FROM auth.users WHERE email = 'your-email@example.com';
-- INSERT INTO public.user_badges (user_id, badge_id) VALUES 
-- ('your-user-id', 1),
-- ('your-user-id', 2),
-- ('your-user-id', 4);
