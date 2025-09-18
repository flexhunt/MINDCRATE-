-- Drop old tables if they exist
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;

-- Create the badges table
CREATE TABLE public.badges (
    id bigserial PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text,
    image_url text,
    rarity text CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')) DEFAULT 'common',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.badges
AS PERMISSIVE FOR SELECT
TO public
USING (true);

-- Create the user_badges table
CREATE TABLE public.user_badges (
    user_id uuid NOT NULL,
    badge_id bigint NOT NULL,
    awarded_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, badge_id),
    FOREIGN KEY (badge_id) REFERENCES public.badges (id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.user_badges
AS PERMISSIVE FOR SELECT
TO public
USING (true);

-- Insert some default badges
INSERT INTO public.badges (name, description, image_url, rarity) VALUES
('Early Adopter', 'One of the first users on the platform', '/badges/early-adopter.png', 'rare'),
('Contributor', 'Contributed to the platform', '/badges/contributor.png', 'uncommon'),
('Explorer', 'Explored all areas of the platform', '/badges/explorer.png', 'common');
