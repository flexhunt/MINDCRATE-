-- Create broadcasts table
CREATE TABLE IF NOT EXISTS public.broadcasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    importance TEXT DEFAULT 'medium' NOT NULL,
    admin_id UUID REFERENCES auth.users(id) NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    read_by UUID[] DEFAULT '{}'::UUID[] NOT NULL
);

-- Add RLS policies
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

-- Everyone can read broadcasts
CREATE POLICY "Anyone can read broadcasts" 
ON public.broadcasts FOR SELECT 
USING (true);

-- Only admins can insert broadcasts
CREATE POLICY "Only admins can insert broadcasts" 
ON public.broadcasts FOR INSERT 
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM admin_users 
        WHERE user_id = auth.uid()
    )
);

-- Only admins can update broadcasts
CREATE POLICY "Only admins can update broadcasts" 
ON public.broadcasts FOR UPDATE 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admin_users 
        WHERE user_id = auth.uid()
    )
);

-- Only admins can delete broadcasts
CREATE POLICY "Only admins can delete broadcasts" 
ON public.broadcasts FOR DELETE 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admin_users 
        WHERE user_id = auth.uid()
    )
);

-- Create function to mark broadcast as read
CREATE OR REPLACE FUNCTION public.mark_broadcast_read(broadcast_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.broadcasts
    SET read_by = array_append(read_by, auth.uid())
    WHERE id = broadcast_id
    AND NOT (auth.uid() = ANY(read_by));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
