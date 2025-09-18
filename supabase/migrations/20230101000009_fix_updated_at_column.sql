-- Add updated_at column if it doesn't exist
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone default now();

-- Create or replace the function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS set_updated_at ON profiles;

-- Create the trigger
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
