-- Add verified column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- Add verified_at timestamp to track when user was verified
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Add verified_by to track who verified the user (admin user id)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles(verified) WHERE verified = TRUE;

-- Create function to verify user (only callable by admins)
CREATE OR REPLACE FUNCTION verify_user(
  target_user_id UUID,
  admin_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Check if the admin_user_id is actually an admin
  SELECT EXISTS(
    SELECT 1 FROM admin_users WHERE user_id = admin_user_id
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only admins can verify users';
  END IF;
  
  -- Update the user's verification status
  UPDATE profiles 
  SET 
    verified = TRUE,
    verified_at = NOW(),
    verified_by = admin_user_id
  WHERE id = target_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to unverify user
CREATE OR REPLACE FUNCTION unverify_user(
  target_user_id UUID,
  admin_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Check if the admin_user_id is actually an admin
  SELECT EXISTS(
    SELECT 1 FROM admin_users WHERE user_id = admin_user_id
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only admins can unverify users';
  END IF;
  
  -- Update the user's verification status
  UPDATE profiles 
  SET 
    verified = FALSE,
    verified_at = NULL,
    verified_by = NULL
  WHERE id = target_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policy to allow reading verified status
CREATE POLICY "Anyone can view verified status" ON profiles
  FOR SELECT USING (true);

-- Create a view for verified users (for easy querying)
CREATE OR REPLACE VIEW verified_users AS
SELECT 
  p.id,
  p.username,
  p.name,
  p.email,
  p.avatar_url,
  p.verified,
  p.verified_at,
  p.verified_by,
  admin_p.name as verified_by_name
FROM profiles p
LEFT JOIN profiles admin_p ON p.verified_by = admin_p.id
WHERE p.verified = TRUE;

-- Grant access to the view
GRANT SELECT ON verified_users TO authenticated;
GRANT SELECT ON verified_users TO anon;

COMMENT ON TABLE profiles IS 'User profiles with verification status';
COMMENT ON COLUMN profiles.verified IS 'Whether the user is verified (blue checkmark)';
COMMENT ON COLUMN profiles.verified_at IS 'When the user was verified';
COMMENT ON COLUMN profiles.verified_by IS 'Which admin verified this user';
