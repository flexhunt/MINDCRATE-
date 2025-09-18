-- Fix RLS policies for push_subscriptions to allow admin access

-- First drop existing is_admin function if it exists
DROP FUNCTION IF EXISTS public.is_admin(UUID);
DROP FUNCTION IF EXISTS public.is_admin();

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can insert subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Anyone can select subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Service role can access all subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Admins can access all subscriptions" ON public.push_subscriptions;

-- Create new policies that allow:
-- 1. Users to manage their own subscriptions
-- 2. Service role to access all subscriptions (for broadcasts)
-- 3. Admins to access all subscriptions

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

-- Allow admin users to access all subscriptions
CREATE POLICY "Admins can access all subscriptions" ON public.push_subscriptions
  FOR ALL 
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.owners
      UNION
      SELECT user_id FROM public.admin_users
      UNION
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

-- Create the is_admin function with proper parameter name
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.owners WHERE owners.user_id = check_user_id
    UNION
    SELECT 1 FROM public.admin_users WHERE admin_users.user_id = check_user_id
    UNION  
    SELECT 1 FROM public.profiles WHERE profiles.id = check_user_id AND profiles.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO service_role;
