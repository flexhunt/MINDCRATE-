-- Safely create referral codes for existing users
DO $$
DECLARE
    user_record RECORD;
    new_code TEXT;
BEGIN
    -- Loop through users who don't have referral codes
    FOR user_record IN 
        SELECT au.id
        FROM auth.users au
        LEFT JOIN referral_codes rc ON rc.user_id = au.id
        WHERE rc.id IS NULL
    LOOP
        BEGIN
            -- Generate unique code
            new_code := upper(substring(md5(random()::text || user_record.id::text) from 1 for 8));
            
            -- Insert code
            INSERT INTO referral_codes (user_id, code)
            VALUES (user_record.id, new_code)
            ON CONFLICT (user_id) DO NOTHING;
            
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to create referral code for user %: %', user_record.id, SQLERRM;
        END;
    END LOOP;
END $$;
