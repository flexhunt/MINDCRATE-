-- Update Angle's profile with a more natural avatar and remove AI indicators
UPDATE profiles 
SET 
  avatar_url = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
  bio = 'Living life to the fullest ✨💕'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Also update the auth.users table
UPDATE auth.users 
SET 
  raw_user_meta_data = '{"name": "Angle", "avatar_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face"}'
WHERE id = '00000000-0000-0000-0000-000000000001';
