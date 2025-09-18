-- Drop AI chat tables
DROP TABLE IF EXISTS ai_chat_messages;
DROP TABLE IF EXISTS ai_chat_conversations;

-- Remove AI chat related columns from profiles table
ALTER TABLE profiles DROP COLUMN IF EXISTS daily_ai_chat_messages;
ALTER TABLE profiles DROP COLUMN IF EXISTS last_ai_chat_reset;

-- Drop AI chat related functions
DROP FUNCTION IF EXISTS check_ai_chat_message_limit(UUID);
DROP FUNCTION IF EXISTS update_conversation_timestamp();
