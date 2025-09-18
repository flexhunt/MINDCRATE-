-- Fix duplicate referral codes and ensure uniqueness

-- First, let's see if there are any duplicates and remove them
WITH duplicates AS (
    SELECT code, MIN(created_at) as first_created
    FROM public.referral_codes 
    GROUP BY code 
    HAVING COUNT(*) > 1
),
to_delete AS (
    SELECT rc.id
    FROM public.referral_codes rc
    JOIN duplicates d ON rc.code = d.code
    WHERE rc.created_at > d.first_created
)
DELETE FROM public.referral_codes 
WHERE id IN (SELECT id FROM to_delete);

-- Ensure the unique constraint exists
ALTER TABLE public.referral_codes 
DROP CONSTRAINT IF EXISTS referral_codes_code_unique;

ALTER TABLE public.referral_codes 
ADD CONSTRAINT referral_codes_code_unique UNIQUE (code);

-- Also ensure user_id is unique (one code per user)
ALTER TABLE public.referral_codes 
DROP CONSTRAINT IF EXISTS referral_codes_user_id_unique;

ALTER TABLE public.referral_codes 
ADD CONSTRAINT referral_codes_user_id_unique UNIQUE (user_id);

-- Create referral codes for users who don't have them
INSERT INTO public.referral_codes (user_id, code)
SELECT 
    p.id,
    generate_unique_referral_code()
FROM public.profiles p
LEFT JOIN public.referral_codes rc ON p.id = rc.user_id
WHERE rc.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Update the generate_unique_referral_code function to be more robust
CREATE OR REPLACE FUNCTION generate_unique_referral_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
    attempt_count INTEGER := 0;
    max_attempts INTEGER := 100;
BEGIN
    LOOP
        -- Generate a random 8-character code
        new_code := upper(
            substr(md5(random()::text || clock_timestamp()::text), 1, 8)
        );
        
        -- Check if code already exists
        SELECT EXISTS(
            SELECT 1 FROM public.referral_codes WHERE code = new_code
        ) INTO code_exists;
        
        -- If code doesn't exist, we can use it
        IF NOT code_exists THEN
            RETURN new_code;
        END IF;
        
        -- Increment attempt counter
        attempt_count := attempt_count + 1;
        
        -- Prevent infinite loop
        IF attempt_count >= max_attempts THEN
            RAISE EXCEPTION 'Could not generate unique referral code after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
