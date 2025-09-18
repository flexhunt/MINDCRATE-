-- This script recreates the badge system, focusing on manual badge assignment and basic functionality.

-- Drop existing objects if they exist (for development/re-deployment purposes)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.badges;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.badges;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.badges;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.badges;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_badges;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_badges;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.user_badges;

DROP FUNCTION IF EXISTS public.get_user_badges(uuid);
DROP FUNCTION IF EXISTS public.get_badge_details(bigint);

DROP TABLE IF EXISTS public.user_badges;
DROP TABLE IF EXISTS public.badges;

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

CREATE POLICY "Enable insert for authenticated users only" ON public.badges
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for users based on user_id" ON public.badges
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (auth.uid() = '00000000-0000-0000-0000-000000000000'::uuid) -- Only admin can update
WITH CHECK (auth.uid() = '00000000-0000-0000-0000-000000000000'::uuid); -- Only admin can update

CREATE POLICY "Enable delete for users based on user_id" ON public.badges
AS PERMISSIVE FOR DELETE
TO authenticated
USING (auth.uid() = '00000000-0000-0000-0000-000000000000'::uuid); -- Only admin can delete

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

CREATE POLICY "Enable insert for authenticated users only" ON public.user_badges
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable delete for users based on user_id" ON public.user_badges
AS PERMISSIVE FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Function to get user badges
CREATE OR REPLACE FUNCTION public.get_user_badges(user_uuid uuid)
RETURNS TABLE (
    id bigint,
    name text,
    description text,
    image_url text,
    rarity text,
    awarded_at timestamp with time zone
)
AS $$
BEGIN
    RETURN QUERY
    SELECT b.id, b.name, b.description, b.image_url, b.rarity, ub.awarded_at
    FROM public.badges b
    JOIN public.user_badges ub ON b.id = ub.badge_id
    WHERE ub.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get badge details
CREATE OR REPLACE FUNCTION public.get_badge_details(badge_id_arg bigint)
RETURNS TABLE (
    id bigint,
    name text,
    description text,
    image_url text,
    rarity text
)
AS $$
BEGIN
    RETURN QUERY
    SELECT b.id, b.name, b.description, b.image_url, b.rarity
    FROM public.badges b
    WHERE b.id = badge_id_arg;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
