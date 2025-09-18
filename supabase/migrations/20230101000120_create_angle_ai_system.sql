-- Drop existing Angle system if it exists
DROP FUNCTION IF EXISTS detect_angle_mention(TEXT);
DROP FUNCTION IF EXISTS should_angle_respond(TEXT);
DROP FUNCTION IF EXISTS insert_angle_message(TEXT);

-- Remove old Angle profile
DELETE FROM profiles WHERE id = '00000000-0000-0000-0000-000000000001';

-- Add is_lyra field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_lyra BOOLEAN DEFAULT FALSE;

-- Create Lyra's profile with a new UUID
INSERT INTO profiles (
  id,
  username,
  name,
  bio,
  avatar_url,
  is_lyra,
  created_at,
  updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'lyra',
  'Lyra',
  'Your AI friend who loves to chat! 💫✨',
  'https://images.unsplash.com/photo-1494790108755-2616c9c9b8d4?w=400&h=400&fit=crop&crop=face',
  TRUE,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  name = EXCLUDED.name,
  bio = EXCLUDED.bio,
  avatar_url = EXCLUDED.avatar_url,
  is_lyra = EXCLUDED.is_lyra;

-- Create function to detect Lyra mentions with better patterns
CREATE OR REPLACE FUNCTION detect_lyra_mention(message_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Convert to lowercase and clean the message
  message_text := LOWER(TRIM(message_text));
  
  -- Check for various mention patterns
  RETURN (
    message_text ~ '\mlyra\M' OR
    message_text ~ '\m@lyra\M' OR
    message_text ~ '\mlyra\s+(bolo|come|help|please|kaha|hai)\M' OR
    message_text ~ '\m(hey|hi|hello)\s+lyra\M' OR
    message_text ~ '\mlyra\s+(kya|what|how|tell)\M' OR
    message_text ~ '\m(call|ping)\s+lyra\M' OR
    message_text LIKE '%lyra%' AND (
      message_text LIKE '%?%' OR 
      message_text LIKE '%help%' OR 
      message_text LIKE '%bolo%' OR
      message_text LIKE '%come%' OR
      message_text LIKE '%please%'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to check if Lyra should respond
CREATE OR REPLACE FUNCTION should_lyra_respond(message_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN detect_lyra_mention(message_text);
END;
$$ LANGUAGE plpgsql;

-- Create function to insert Lyra messages with elevated privileges
CREATE OR REPLACE FUNCTION insert_lyra_message(message_text TEXT)
RETURNS UUID AS $$
DECLARE
  message_id UUID;
BEGIN
  INSERT INTO global_chat_messages (user_id, message)
  VALUES ('11111111-1111-1111-1111-111111111111'::uuid, message_text)
  RETURNING id INTO message_id;
  
  RETURN message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get recent chat context for Lyra
CREATE OR REPLACE FUNCTION get_lyra_chat_context(limit_count INTEGER DEFAULT 15)
RETURNS TABLE(
  username TEXT,
  message TEXT,
  created_at TIMESTAMPTZ,
  user_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.username,
    gcm.message,
    gcm.created_at,
    gcm.user_id
  FROM global_chat_messages gcm
  JOIN profiles p ON gcm.user_id = p.id
  WHERE gcm.user_id != '11111111-1111-1111-1111-111111111111'::uuid  -- Exclude Lyra's messages
  ORDER BY gcm.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION detect_lyra_mention(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION should_lyra_respond(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_lyra_message(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_lyra_chat_context(INTEGER) TO authenticated;

-- Create RLS policies for Lyra
DROP POLICY IF EXISTS "Allow Lyra AI to insert messages" ON global_chat_messages;
DROP POLICY IF EXISTS "Allow Lyra AI to select messages" ON global_chat_messages;

CREATE POLICY "Allow Lyra AI to insert messages" ON global_chat_messages
FOR INSERT 
TO authenticated
WITH CHECK (user_id = '11111111-1111-1111-1111-111111111111'::uuid);

CREATE POLICY "Allow Lyra AI to select messages" ON global_chat_messages
FOR SELECT 
TO authenticated
USING (user_id = '11111111-1111-1111-1111-111111111111'::uuid);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_global_chat_messages_created_at_desc ON global_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_is_lyra ON profiles(is_lyra) WHERE is_lyra = TRUE;
CREATE INDEX IF NOT EXISTS idx_global_chat_messages_user_id ON global_chat_messages(user_id);

-- Create function to check if message is reply to Lyra
CREATE OR REPLACE FUNCTION is_reply_to_lyra(reply_to_message_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  lyra_message BOOLEAN := FALSE;
BEGIN
  IF reply_to_message_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  SELECT (user_id = '11111111-1111-1111-1111-111111111111'::uuid) INTO lyra_message
  FROM global_chat_messages 
  WHERE id = reply_to_message_id;
  
  RETURN COALESCE(lyra_message, FALSE);
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION is_reply_to_lyra(UUID) TO authenticated;
