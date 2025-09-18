-- Drop the existing function first
DROP FUNCTION IF EXISTS get_referral_stats(UUID);

-- Create a completely new, simpler function without GROUP BY issues
CREATE OR REPLACE FUNCTION get_referral_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    user_referral_code TEXT;
    user_referral_link TEXT;
    total_refs INTEGER := 0;
    successful_refs INTEGER := 0;
    total_coins INTEGER := 0;
    pending_refs INTEGER := 0;
    referral_level INTEGER := 1;
    recent_refs JSON;
BEGIN
    -- Get user's referral code
    SELECT code INTO user_referral_code 
    FROM referral_codes 
    WHERE user_id = p_user_id;
    
    -- If no referral code exists, create one
    IF user_referral_code IS NULL THEN
        user_referral_code := upper(substring(md5(random()::text || p_user_id::text) from 1 for 8));
        INSERT INTO referral_codes (user_id, code, is_active)
        VALUES (p_user_id, user_referral_code, true)
        ON CONFLICT (user_id) DO UPDATE SET code = EXCLUDED.code;
    END IF;
    
    -- Create referral link
    user_referral_link := COALESCE(current_setting('app.base_url', true), 'https://yourapp.com') || '/signup?ref=' || user_referral_code;
    
    -- Get total referrals count
    SELECT COUNT(*) INTO total_refs
    FROM referrals 
    WHERE referrer_id = p_user_id;
    
    -- Get successful referrals count
    SELECT COUNT(*) INTO successful_refs
    FROM referrals 
    WHERE referrer_id = p_user_id AND status = 'completed';
    
    -- Get pending referrals count
    SELECT COUNT(*) INTO pending_refs
    FROM referrals 
    WHERE referrer_id = p_user_id AND status = 'pending';
    
    -- Calculate total coins earned (50 per successful referral)
    total_coins := successful_refs * 50;
    
    -- Calculate referral level
    referral_level := CASE 
        WHEN successful_refs >= 100 THEN 5
        WHEN successful_refs >= 50 THEN 4
        WHEN successful_refs >= 25 THEN 3
        WHEN successful_refs >= 10 THEN 2
        ELSE 1
    END;
    
    -- Get recent referrals (last 10)
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', r.id,
            'referred_user', COALESCE(p.username, p.name, 'Anonymous User'),
            'status', r.status,
            'coins_earned', CASE WHEN r.status = 'completed' THEN 50 ELSE 0 END,
            'created_at', r.created_at
        )
    ), '[]'::json) INTO recent_refs
    FROM (
        SELECT r.id, r.referred_id, r.status, r.created_at
        FROM referrals r
        WHERE r.referrer_id = p_user_id
        ORDER BY r.created_at DESC
        LIMIT 10
    ) r
    LEFT JOIN profiles p ON r.referred_id = p.id;
    
    -- Build final result
    result := json_build_object(
        'total_referrals', total_refs,
        'successful_referrals', successful_refs,
        'total_coins_earned', total_coins,
        'pending_referrals', pending_refs,
        'referral_level', referral_level,
        'referral_code', user_referral_code,
        'referral_link', user_referral_link,
        'recent_referrals', recent_refs
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_referral_stats(UUID) TO authenticated;
