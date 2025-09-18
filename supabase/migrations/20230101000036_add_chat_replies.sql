-- Add reply_to_id column to global_chat_messages table
ALTER TABLE global_chat_messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES global_chat_messages(id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_global_chat_messages_reply_to_id ON global_chat_messages(reply_to_id);
