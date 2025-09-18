-- Fix RLS policies for push_subscriptions safely without touching existing functions

-- Drop existing policies on push_subscriptions only
DROP POLICY IF EXISTS "Anyone can insert subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Anyone can select subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Service role can access all subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Admins can access all subscriptions" ON public.push_subscriptions;

-- Create new policies for push_subscriptions
-- Allow authenticated users to insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions" ON public.push_subscriptions
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.push_subscriptions
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to update/delete their own subscriptions
CREATE POLICY "Users can update own subscriptions" ON public.push_subscriptions
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions" ON public.push_subscriptions
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Allow service role to access all subscriptions (for admin broadcasts)
CREATE POLICY "Service role can access all subscriptions" ON public.push_subscriptions
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow admin users to access all subscriptions using existing is_admin function
CREATE POLICY "Admins can access all subscriptions" ON public.push_subscriptions
  FOR ALL 
  USING (is_admin(auth.uid()));

-- Make sure RLS is enabled
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
