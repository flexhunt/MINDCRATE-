-- Check if questionnaire tables exist and their structure
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name IN ('questionnaire_topics', 'questionnaire_questions', 'questionnaire_sessions', 'questionnaire_responses')
ORDER BY table_name, ordinal_position;

-- Check if there are any questionnaire sessions
SELECT COUNT(*) as session_count FROM questionnaire_sessions;

-- Fixed column names to match actual schema - removed status, added correct columns
-- Check the first few sessions to see the structure
SELECT id, user_id, topic_id, started_at, completed_at, total_questions, answered_questions
FROM questionnaire_sessions 
LIMIT 5;

-- Check if the specific session exists
SELECT id, user_id, topic_id, started_at, completed_at, total_questions, answered_questions
FROM questionnaire_sessions 
WHERE id = '29f8381f-1d5f-42da-b8e7-ca75d723626a';
