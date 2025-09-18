-- Create a test questionnaire session for development
-- This script creates a sample session with responses for testing

-- First, ensure we have a test user (this would normally be created through auth)
-- For testing purposes, we'll create a session that can be accessed

DO $$
DECLARE
    test_topic_id UUID;
    test_session_id UUID;
    personality_question_1 UUID;
    personality_question_2 UUID;
    personality_question_3 UUID;
BEGIN
    -- Get the personality assessment topic
    SELECT id INTO test_topic_id 
    FROM questionnaire_topics 
    WHERE title = 'Personality Assessment' 
    LIMIT 1;
    
    -- If no topic exists, create one
    IF test_topic_id IS NULL THEN
        INSERT INTO questionnaire_topics (title, description, category, icon, color, difficulty_level, estimated_time)
        VALUES ('Personality Assessment', 'Discover your core personality traits and behavioral patterns', 'personality', 'User', '#8B5CF6', 2, 15)
        RETURNING id INTO test_topic_id;
    END IF;
    
    -- Create a test session with a specific ID for easy testing
    INSERT INTO questionnaire_sessions (
        id,
        user_id,
        topic_id,
        started_at,
        completed_at,
        total_questions,
        answered_questions,
        session_data
    ) VALUES (
        '29f8381f-1d5f-42da-b8e7-ca75d723626a'::UUID,
        '00000000-0000-0000-0000-000000000000'::UUID, -- Placeholder user ID
        test_topic_id,
        NOW() - INTERVAL '30 minutes',
        NOW() - INTERVAL '5 minutes',
        3,
        3,
        '{"completed": true, "test_session": true}'::JSONB
    ) ON CONFLICT (id) DO UPDATE SET
        topic_id = EXCLUDED.topic_id,
        completed_at = EXCLUDED.completed_at;
    
    -- Get question IDs
    SELECT id INTO personality_question_1 
    FROM questionnaire_questions 
    WHERE topic_id = test_topic_id 
    AND question_text LIKE '%recharge%' 
    LIMIT 1;
    
    SELECT id INTO personality_question_2 
    FROM questionnaire_questions 
    WHERE topic_id = test_topic_id 
    AND question_text LIKE '%decisions%' 
    LIMIT 1;
    
    SELECT id INTO personality_question_3 
    FROM questionnaire_questions 
    WHERE topic_id = test_topic_id 
    AND question_text LIKE '%public speaking%' 
    LIMIT 1;
    
    -- Create test responses
    INSERT INTO questionnaire_responses (
        user_id,
        topic_id,
        question_id,
        response_value,
        completed_at
    ) VALUES 
    ('00000000-0000-0000-0000-000000000000'::UUID, test_topic_id, personality_question_1, 'Spending time alone', NOW() - INTERVAL '25 minutes'),
    ('00000000-0000-0000-0000-000000000000'::UUID, test_topic_id, personality_question_2, 'Rely on logic and facts', NOW() - INTERVAL '20 minutes'),
    ('00000000-0000-0000-0000-000000000000'::UUID, test_topic_id, personality_question_3, '7', NOW() - INTERVAL '15 minutes')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Test session created with ID: 29f8381f-1d5f-42da-b8e7-ca75d723626a';
    RAISE NOTICE 'You can access it at: /questionnaire/results/29f8381f-1d5f-42da-b8e7-ca75d723626a';
END $$;
