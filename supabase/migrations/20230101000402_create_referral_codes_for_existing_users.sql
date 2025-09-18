-- Create referral codes for existing users who don't have them
INSERT INTO referral_codes (user_id, code)
SELECT 
    au.id,
    upper(substring(md5(random()::text || au.id::text) from 1 for 8))
FROM auth.users au
LEFT JOIN referral_codes rc ON rc.user_id = au.id
WHERE rc.id IS NULL
ON CONFLICT (user_id) DO NOTHING;
