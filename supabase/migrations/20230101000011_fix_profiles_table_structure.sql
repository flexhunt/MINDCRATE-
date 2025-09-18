-- This migration fixes the profiles table structure if it's not correct

-- First, check if the profiles table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'profiles'
  ) THEN
    -- Create the profiles table if it doesn't exist
    CREATE TABLE public.profiles (
      id UUID PRIMARY KEY,
      username TEXT UNIQUE,
      name TEXT,
      email TEXT,
      bio TEXT,
      website TEXT,
      avatar_url TEXT,
      referral_code TEXT UNIQUE,
      wallet_address TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  ELSE
    -- Table exists, check if it has the id column
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'id'
    ) THEN
      -- If the table has a user_id column but no id column, we need to rename it
      IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'user_id'
      ) THEN
        -- Rename user_id to id
        ALTER TABLE public.profiles RENAME COLUMN user_id TO id;
      ELSE
        -- Add id column if neither exists
        ALTER TABLE public.profiles ADD COLUMN id UUID PRIMARY KEY;
      END IF;
    END IF;
    
    -- Make sure all required columns exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'username'
    ) THEN
      ALTER TABLE public.profiles ADD COLUMN username TEXT UNIQUE;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'name'
    ) THEN
      ALTER TABLE public.profiles ADD COLUMN name TEXT;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'email'
    ) THEN
      ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'referral_code'
    ) THEN
      ALTER TABLE public.profiles ADD COLUMN referral_code TEXT UNIQUE;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'updated_at'
    ) THEN
      ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
  END IF;
END $$;

-- Create a function to fix profiles table structure that can be called from API
CREATE OR REPLACE FUNCTION fix_profiles_table()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Check if the profiles table exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'profiles'
  ) THEN
    -- Create the profiles table if it doesn't exist
    CREATE TABLE public.profiles (
      id UUID PRIMARY KEY,
      username TEXT UNIQUE,
      name TEXT,
      email TEXT,
      bio TEXT,
      website TEXT,
      avatar_url TEXT,
      referral_code TEXT UNIQUE,
      wallet_address TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    result := jsonb_build_object('action', 'created', 'table', 'profiles');
  ELSE
    -- Table exists, check if it has the id column
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'id'
    ) THEN
      -- If the table has a user_id column but no id column, we need to rename it
      IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'user_id'
      ) THEN
        -- Rename user_id to id
        ALTER TABLE public.profiles RENAME COLUMN user_id TO id;
        result := jsonb_build_object('action', 'renamed', 'column', 'user_id', 'to', 'id');
      ELSE
        -- Add id column if neither exists
        ALTER TABLE public.profiles ADD COLUMN id UUID PRIMARY KEY;
        result := jsonb_build_object('action', 'added', 'column', 'id');
      END IF;
    ELSE
      result := jsonb_build_object('action', 'verified', 'column', 'id');
    END IF;
    
    -- Make sure all required columns exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'username'
    ) THEN
      ALTER TABLE public.profiles ADD COLUMN username TEXT UNIQUE;
      result := jsonb_build_object('action', 'added', 'column', 'username');
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'referral_code'
    ) THEN
      ALTER TABLE public.profiles ADD COLUMN referral_code TEXT UNIQUE;
      result := jsonb_build_object('action', 'added', 'column', 'referral_code');
    END IF;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
