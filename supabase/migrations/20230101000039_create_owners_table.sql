-- Create owners table
CREATE TABLE public.owners (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable row level security
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow authenticated users to view owners
CREATE POLICY "Users can view owners"
  ON public.owners
  FOR SELECT
  TO authenticated
  USING (true);

-- Only allow admins to insert/update/delete owners
CREATE POLICY "Only admins can manage owners"
  ON public.owners
  USING (auth.uid() IN (SELECT id FROM public.admins));

-- Create index for better performance
CREATE INDEX idx_owners_id ON public.owners(id);

-- Add a function to check if a user is an owner
CREATE OR REPLACE FUNCTION public.is_owner(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.owners WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
