-- Create a function to set up AI chat tables
CREATE OR REPLACE FUNCTION public.create_ai_chat_tables()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create AI conversations table if it doesn't exist
  CREATE TABLE IF NOT EXISTS public.ai_conversations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT 'New conversation',
      last_message TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  );

  -- Create AI messages table if it doesn't exist
  CREATE TABLE IF NOT EXISTS public.ai_messages (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  );

  -- Add indexes if they don't exist
  CREATE INDEX IF NOT EXISTS ai_conversations_user_id_idx ON public.ai_conversations(user_id);
  CREATE INDEX IF NOT EXISTS ai_messages_conversation_id_idx ON public.ai_messages(conversation_id);

  -- Enable RLS
  ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own conversations" ON public.ai_conversations;
  DROP POLICY IF EXISTS "Users can insert their own conversations" ON public.ai_conversations;
  DROP POLICY IF EXISTS "Users can update their own conversations" ON public.ai_conversations;
  DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.ai_conversations;
  DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.ai_messages;
  DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.ai_messages;

  -- Create policies
  CREATE POLICY "Users can view their own conversations"
      ON public.ai_conversations
      FOR SELECT
      USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own conversations"
      ON public.ai_conversations
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own conversations"
      ON public.ai_conversations
      FOR UPDATE
      USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own conversations"
      ON public.ai_conversations
      FOR DELETE
      USING (auth.uid() = user_id);

  CREATE POLICY "Users can view messages in their conversations"
      ON public.ai_messages
      FOR SELECT
      USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert messages in their conversations"
      ON public.ai_messages
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);

  -- Grant access to authenticated users
  GRANT ALL ON public.ai_conversations TO authenticated;
  GRANT ALL ON public.ai_messages TO authenticated;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_ai_chat_tables() TO authenticated;
