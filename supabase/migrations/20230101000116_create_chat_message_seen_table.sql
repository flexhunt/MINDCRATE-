-- Create chat_message_seen table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.chat_message_seen (
    message_id UUID NOT NULL REFERENCES public.global_chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seen_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    PRIMARY KEY (message_id, user_id)
);

-- Add RLS policies
ALTER TABLE public.chat_message_seen ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view seen status
CREATE POLICY "Allow authenticated users to view seen status" 
ON public.chat_message_seen 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow users to mark messages as seen
CREATE POLICY "Allow users to mark messages as seen" 
ON public.chat_message_seen 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own seen status
CREATE POLICY "Allow users to update their own seen status" 
ON public.chat_message_seen 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- Create chat_typing table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.chat_typing (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Add RLS policies
ALTER TABLE public.chat_typing ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view typing status
CREATE POLICY "Allow authenticated users to view typing status" 
ON public.chat_typing 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow users to update their own typing status
CREATE POLICY "Allow users to update their own typing status" 
ON public.chat_typing 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own typing status
CREATE POLICY "Allow users to delete their own typing status" 
ON public.chat_typing 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Create function to cleanup expired typing indicators
CREATE OR REPLACE FUNCTION public.cleanup_expired_typing()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.chat_typing
  WHERE expires_at < now();
END;
$$;
