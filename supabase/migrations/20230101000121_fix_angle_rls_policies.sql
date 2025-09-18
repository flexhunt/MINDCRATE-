-- Allow Angle to insert messages into global_chat_messages
CREATE POLICY "Allow Angle AI to insert messages" ON global_chat_messages
FOR INSERT 
TO authenticated
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Allow Angle to select her own messages
CREATE POLICY "Allow Angle AI to select messages" ON global_chat_messages
FOR SELECT 
TO authenticated
USING (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Create a function to insert Angle messages with elevated privileges
CREATE OR REPLACE FUNCTION insert_angle_message(message_text TEXT)
RETURNS UUID AS $$
DECLARE
  message_id UUID;
BEGIN
  INSERT INTO global_chat_messages (user_id, message)
  VALUES ('00000000-0000-0000-0000-000000000001'::uuid, message_text)
  RETURNING id INTO message_id;
  
  RETURN message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION insert_angle_message(TEXT) TO authenticated;

-- Create a function to check if a message mentions Angle
CREATE OR REPLACE FUNCTION should_angle_respond(message_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Convert to lowercase for case-insensitive matching
  message_text := LOWER(TRIM(message_text));
  
  -- Check for various mention patterns
  RETURN (
    message_text LIKE '%angle%' OR
    message_text LIKE '%@angle%' OR
    message_text LIKE '%angle bolo%' OR
    message_text LIKE '%hey angle%' OR
    message_text LIKE '%hi angle%' OR
    message_text LIKE '%angle come%' OR
    message_text LIKE '%angle kaha hai%' OR
    message_text LIKE '%angle please%' OR
    message_text LIKE '%angle help%'
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION should_angle_respond(TEXT) TO authenticated;
