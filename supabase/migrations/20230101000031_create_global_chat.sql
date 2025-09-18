-- Create global_chat_messages table
CREATE TABLE public.global_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indexes for better performance
CREATE INDEX idx_global_chat_messages_created_at ON public.global_chat_messages(created_at);
CREATE INDEX idx_global_chat_messages_user_id ON public.global_chat_messages(user_id);

-- Enable row level security
ALTER TABLE public.global_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow authenticated users to insert their own messages
CREATE POLICY "Users can insert their own messages"
  ON public.global_chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to select all messages
CREATE POLICY "Users can view all messages"
  ON public.global_chat_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_chat_messages;
