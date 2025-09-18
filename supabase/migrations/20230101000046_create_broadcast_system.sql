-- Create broadcasts table
CREATE TABLE IF NOT EXISTS public.broadcasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    priority BOOLEAN DEFAULT false
);

-- Create broadcast_reads table to track which users have read which broadcasts
CREATE TABLE IF NOT EXISTS public.broadcast_reads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broadcast_id UUID NOT NULL REFERENCES public.broadcasts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(broadcast_id, user_id)
);

-- Add RLS policies
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_reads ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage broadcasts
CREATE POLICY "Admins can manage broadcasts" 
ON public.broadcasts
USING (
    EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE admin_users.user_id = auth.uid()
    )
);

-- Allow all authenticated users to read broadcasts
CREATE POLICY "All users can read broadcasts" 
ON public.broadcasts
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Allow users to mark broadcasts as read
CREATE POLICY "Users can mark broadcasts as read" 
ON public.broadcast_reads
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to see their own read status
CREATE POLICY "Users can see their own read status" 
ON public.broadcast_reads
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow admins to see all read statuses
CREATE POLICY "Admins can see all read statuses" 
ON public.broadcast_reads
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE admin_users.user_id = auth.uid()
    )
);
