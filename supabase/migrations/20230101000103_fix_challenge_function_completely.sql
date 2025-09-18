-- Drop the problematic function
DROP FUNCTION IF EXISTS get_challenge_with_participants(UUID);

-- Create a simpler, working function that matches our needs
CREATE OR REPLACE FUNCTION get_challenge_details(challenge_id_param UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'id', c.id,
        'title', c.title,
        'description', c.description,
        'type', c.type,
        'duration_days', c.duration_days,
        'creator_id', c.creator_id,
        'rules', c.rules,
        'penalty_reward', c.penalty_reward,
        'is_public', c.is_public,
        'max_participants', c.max_participants,
        'status', c.status,
        'created_at', c.created_at,
        'starts_at', c.starts_at,
        'ends_at', c.ends_at,
        'participants', COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'id', cp.id,
                    'user_id', cp.user_id,
                    'challenge_id', cp.challenge_id,
                    'status', cp.status,
                    'current_streak', cp.current_streak,
                    'longest_streak', cp.longest_streak,
                    'total_checkins', cp.total_checkins,
                    'xp_earned', cp.xp_earned,
                    'coins_earned', cp.coins_earned,
                    'joined_at', cp.joined_at,
                    'profiles', json_build_object(
                        'id', p.id,
                        'username', p.username,
                        'name', p.name,
                        'avatar_url', p.avatar_url
                    )
                )
            )
            FROM challenge_participants cp
            LEFT JOIN profiles p ON cp.user_id = p.id
            WHERE cp.challenge_id = c.id),
            '[]'::json
        )
    ) INTO result
    FROM challenges c
    WHERE c.id = challenge_id_param
    AND (
        c.is_public = true 
        OR c.creator_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM challenge_participants cp2 
            WHERE cp2.challenge_id = c.id AND cp2.user_id = auth.uid()
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_challenge_details TO authenticated;

-- Also create a simple function to check if user is participant
CREATE OR REPLACE FUNCTION is_challenge_participant(challenge_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM challenge_participants 
        WHERE challenge_id = challenge_id_param AND user_id = user_id_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION is_challenge_participant TO authenticated;
