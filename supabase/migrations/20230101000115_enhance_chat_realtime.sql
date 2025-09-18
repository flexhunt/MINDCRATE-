-- Create table for typing indicators
CREATE TABLE IF NOT EXISTS chat_typing (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create table for message seen status
CREATE TABLE IF NOT EXISTS chat_message_seen (
  message_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);

-- Add mentions column to global_chat_messages if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'global_chat_messages' AND column_name = 'mentions'
  ) THEN
    ALTER TABLE global_chat_messages ADD COLUMN mentions TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Create function to clean up expired typing indicators
CREATE OR REPLACE FUNCTION cleanup_expired_typing()
RETURNS void AS $$
BEGIN
  DELETE FROM chat_typing WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
ALTER TABLE chat_typing ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_seen ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read typing indicators
CREATE POLICY chat_typing_select_policy ON chat_typing
  FOR SELECT USING (true);

-- Allow users to insert their own typing status
CREATE POLICY chat_typing_insert_policy ON chat_typing
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own typing status
CREATE POLICY chat_typing_update_policy ON chat_typing
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own typing status
CREATE POLICY chat_typing_delete_policy ON chat_typing
  FOR DELETE USING (auth.uid() = user_id);

-- Allow anyone to read message seen status
CREATE POLICY chat_message_seen_select_policy ON chat_message_seen
  FOR SELECT USING (true);

-- Allow users to insert their own seen status
CREATE POLICY chat_message_seen_insert_policy ON chat_message_seen
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_typing_expires_at ON chat_typing(expires_at);
CREATE INDEX IF NOT EXISTS idx_chat_message_seen_message_id ON chat_message_seen(message_id);
