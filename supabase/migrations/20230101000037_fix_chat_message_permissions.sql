-- Enable RLS on the global_chat_messages table
ALTER TABLE global_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to delete only their own messages
CREATE POLICY "Users can delete their own messages" 
ON global_chat_messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policy to allow users to insert messages
CREATE POLICY "Users can insert messages" 
ON global_chat_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to select messages
CREATE POLICY "Users can select messages" 
ON global_chat_messages 
FOR SELECT 
USING (true);
