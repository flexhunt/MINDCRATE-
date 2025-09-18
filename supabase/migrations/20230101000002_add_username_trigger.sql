-- Create a trigger to set username for new users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  username_val TEXT;
BEGIN
  -- Get username from metadata if available
  username_val := NEW.raw_user_meta_data->>'username';
  
  -- If username is not provided, generate one from email
  IF username_val IS NULL THEN
    username_val := LOWER(SPLIT_PART(NEW.email, '@', 1));
    -- Replace special characters with underscores
    username_val := REGEXP_REPLACE(username_val, '[^a-zA-Z0-9]', '_', 'g');
    
    -- Ensure username is unique by adding a random suffix if needed
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = username_val) LOOP
      username_val := username_val || floor(random() * 1000)::text;
    END LOOP;
  END IF;
  
  -- Insert a row into public.profiles
  INSERT INTO public.profiles (
    id, 
    name, 
    username,
    avatar_url,
    updated_at
  )
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'name',
    username_val,
    NEW.raw_user_meta_data->>'avatar_url',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    name = EXCLUDED.name,
    username = EXCLUDED.username,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;
