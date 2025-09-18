-- Fix the referral stats function to handle GROUP BY properly
CREATE OR REPLACE FUNCTION get_referral_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    user_referral_code TEXT;
    user_referral_link TEXT;
BEGIN
    -- Get user's referral code and create link
    SELECT code INTO user_referral_code 
    FROM referral_codes 
    WHERE user_id = p_user_id;
    
    -- Create referral link
    user_referral_link := COALESCE(current_setting('app.base_url', true), 'https://yourapp.com') || '/signup?ref=' || COALESCE(user_referral_code, '');
    
    -- Build the result JSON
    WITH referral_stats AS (
        SELECT 
            COUNT(*) as total_referrals,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_referrals,
            COALESCE(SUM(CASE WHEN status = 'completed' THEN 50 ELSE 0 END), 0) as total_coins_earned,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_referrals
        FROM referrals r
        WHERE r.referrer_id = p_user_id
    ),
    recent_referrals AS (
        SELECT json_agg(
            json_build_object(
                'id', r.id,
                'referred_user', COALESCE(p.username, p.name, 'Anonymous User'),
                'status', r.status,
                'coins_earned', CASE WHEN r.status = 'completed' THEN 50 ELSE 0 END,
                'created_at', r.created_at
            ) ORDER BY r.created_at DESC
        ) as recent_list
        FROM referrals r
        LEFT JOIN profiles p ON r.referred_id = p.id
        WHERE r.referrer_id = p_user_id
        ORDER BY r.created_at DESC
        LIMIT 10
    )
    SELECT json_build_object(
        'total_referrals', COALESCE(rs.total_referrals, 0),
        'successful_referrals', COALESCE(rs.successful_referrals, 0),
        'total_coins_earned', COALESCE(rs.total_coins_earned, 0),
        'pending_referrals', COALESCE(rs.pending_referrals, 0),
        'referral_level', CASE 
            WHEN COALESCE(rs.successful_referrals, 0) >= 100 THEN 5
            WHEN COALESCE(rs.successful_referrals, 0) >= 50 THEN 4
            WHEN COALESCE(rs.successful_referrals, 0) >= 25 THEN 3
            WHEN COALESCE(rs.successful_referrals, 0) >= 10 THEN 2
            ELSE 1
        END,
        'referral_code', user_referral_code,
        'referral_link', user_referral_link,
        'recent_referrals', COALESCE(rr.recent_list, '[]'::json)
    ) INTO result
    FROM referral_stats rs
    CROSS JOIN recent_referrals rr;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_referral_stats(UUID) TO authenticated;
