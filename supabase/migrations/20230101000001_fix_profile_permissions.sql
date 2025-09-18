-- Update RLS policies to ensure users can update their own profiles
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can update their own profile" 
ON profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Add a policy for inserting profiles if not exists
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

CREATE POLICY "Users can insert their own profile" 
ON profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Add a policy for users to read any profile (Instagram-like)
DROP POLICY IF EXISTS "Users can view any profile" ON profiles;

CREATE POLICY "Users can view any profile" 
ON profiles 
FOR SELECT 
USING (true);

-- Add username column for Instagram-like profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create a function to generate a unique username from email
CREATE OR REPLACE FUNCTION generate_username_from_email()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INT := 0;
BEGIN
  -- Extract the part before @ in email
  base_username := LOWER(SPLIT_PART(NEW.email, '@', 1));
  
  -- Replace special characters with underscores
  base_username := REGEXP_REPLACE(base_username, '[^a-zA-Z0-9]', '_', 'g');
  
  -- Initial username attempt
  final_username := base_username;
  
  -- Keep trying with incremented counters until we find a unique username
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter;
  END LOOP;
  
  -- Return the unique username
  RETURN final_username;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to set username for new profiles if it's not provided
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  username_val TEXT;
BEGIN
  -- If username is null, generate one from email
  IF NEW.raw_user_meta_data->>'username' IS NULL THEN
    username_val := generate_username_from_email();
  ELSE
    username_val := NEW.raw_user_meta_data->>'username';
  END IF;
  
  -- Insert a row into public.profiles
  INSERT INTO public.profiles (id, name, avatar_url, username, email)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'name', 
    NEW.raw_user_meta_data->>'avatar_url',
    username_val,
    NEW.email
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
