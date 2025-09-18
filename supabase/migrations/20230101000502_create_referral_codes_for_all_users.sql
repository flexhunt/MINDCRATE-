-- Create referral codes for all existing users
INSERT INTO referral_codes (user_id, code)
SELECT 
    au.id,
    upper(substring(md5(random()::text || au.id::text) from 1 for 6))
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM referral_codes rc WHERE rc.user_id = au.id)
ON CONFLICT (user_id) DO NOTHING;
