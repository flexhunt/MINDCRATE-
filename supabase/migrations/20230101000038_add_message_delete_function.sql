-- Function to safely delete a message
CREATE OR REPLACE FUNCTION delete_chat_message(message_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM global_chat_messages
  WHERE id = message_id AND user_id = user_id
  RETURNING 1 INTO deleted_count;
  
  RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_chat_message TO authenticated;
