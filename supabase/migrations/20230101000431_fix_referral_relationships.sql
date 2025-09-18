-- Fix referral system relationships and ensure proper foreign keys

-- First ensure referrals table exists with proper structure
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    referral_code TEXT NOT NULL,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed')),
    referrer_coins INTEGER DEFAULT 50,
    referred_coins INTEGER DEFAULT 25,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicates and self-referrals
    UNIQUE(referrer_id, referred_id),
    CHECK (referrer_id != referred_id)
);

-- Enable RLS on referrals table
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for referrals
DROP POLICY IF EXISTS "Users can view their referrals" ON public.referrals;
CREATE POLICY "Users can view their referrals" ON public.referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

DROP POLICY IF EXISTS "Anyone can insert referrals" ON public.referrals;
CREATE POLICY "Anyone can insert referrals" ON public.referrals
    FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);

-- Update the get_user_referral_stats function to use separate queries
CREATE OR REPLACE FUNCTION get_user_referral_stats(user_uuid UUID)
RETURNS TABLE(
    referral_code TEXT,
    referral_link TEXT,
    total_referrals BIGINT,
    successful_referrals BIGINT,
    total_coins_earned BIGINT,
    referral_level INTEGER,
    recent_referrals JSON,
    has_used_referral_code BOOLEAN,
    used_referral_code TEXT
) AS $$
DECLARE
    user_code TEXT;
    base_url TEXT := 'https://mindcrate.vercel.app';
    user_referral_record RECORD;
BEGIN
    -- Get user's referral code
    SELECT code INTO user_code FROM public.referral_codes WHERE user_id = user_uuid;
    
    -- If no code exists, create one
    IF user_code IS NULL THEN
        user_code := generate_unique_referral_code();
        INSERT INTO public.referral_codes (user_id, code) VALUES (user_uuid, user_code);
    END IF;
    
    -- Check if user has used a referral code
    SELECT referral_code INTO user_referral_record FROM public.referrals WHERE referred_id = user_uuid LIMIT 1;
    
    -- Return stats
    RETURN QUERY
    SELECT 
        user_code as referral_code,
        (base_url || '/signup?ref=' || user_code) as referral_link,
        COALESCE((SELECT COUNT(*) FROM public.referrals WHERE referrer_id = user_uuid), 0) as total_referrals,
        COALESCE((SELECT COUNT(*) FROM public.referrals WHERE referrer_id = user_uuid AND status = 'completed'), 0) as successful_referrals,
        COALESCE((SELECT COUNT(*) FROM public.referrals WHERE referrer_id = user_uuid AND status = 'completed'), 0) * 50 as total_coins_earned,
        CASE 
            WHEN COALESCE((SELECT COUNT(*) FROM public.referrals WHERE referrer_id = user_uuid AND status = 'completed'), 0) >= 100 THEN 5
            WHEN COALESCE((SELECT COUNT(*) FROM public.referrals WHERE referrer_id = user_uuid AND status = 'completed'), 0) >= 50 THEN 4
            WHEN COALESCE((SELECT COUNT(*) FROM public.referrals WHERE referrer_id = user_uuid AND status = 'completed'), 0) >= 25 THEN 3
            WHEN COALESCE((SELECT COUNT(*) FROM public.referrals WHERE referrer_id = user_uuid AND status = 'completed'), 0) >= 10 THEN 2
            ELSE 1
        END as referral_level,
        COALESCE((
            SELECT json_agg(
                json_build_object(
                    'id', r.id,
                    'referred_user', COALESCE(p.username, p.name, 'Anonymous'),
                    'status', r.status,
                    'coins_earned', r.referrer_coins,
                    'created_at', r.created_at
                ) ORDER BY r.created_at DESC
            )
            FROM (
                SELECT r.* FROM public.referrals r
                WHERE r.referrer_id = user_uuid 
                ORDER BY r.created_at DESC 
                LIMIT 10
            ) r
            LEFT JOIN public.profiles p ON r.referred_id = p.id
        ), '[]'::json) as recent_referrals,
        (user_referral_record IS NOT NULL) as has_used_referral_code,
        COALESCE(user_referral_record, '') as used_referral_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_referral_stats(UUID) TO authenticated;
