-- Improve Lyra's detection of direct questions
CREATE OR REPLACE FUNCTION detect_lyra_mention(message_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Convert to lowercase and clean the message
  message_text := LOWER(TRIM(message_text));
  
  -- Check for various mention patterns with improved question detection
  RETURN (
    -- Basic mentions
    message_text ~ '\mlyra\M' OR
    message_text ~ '\m@lyra\M' OR
    
    -- Commands and requests
    message_text ~ '\mlyra\s+(bolo|come|help|please|kaha|hai)\M' OR
    message_text ~ '\m(hey|hi|hello)\s+lyra\M' OR
    
    -- Questions
    message_text ~ '\mlyra\s+(kya|what|how|when|where|why|who|can|could|will|would|should|is|are|do|does|did|tell|say|hru|sup|wassup)\M' OR
    message_text ~ '\m(how|what|when|where|why|who|can|could|will|would|should)\s+.*lyra\M' OR
    
    -- Calls
    message_text ~ '\m(call|ping)\s+lyra\M' OR
    
    -- Question marks with Lyra
    message_text ~ 'lyra.*\?' OR
    
    -- Common patterns
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

-- Create function to check if message is a direct question to Lyra
CREATE OR REPLACE FUNCTION is_direct_question_to_lyra(message_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Convert to lowercase and clean the message
  message_text := LOWER(TRIM(message_text));
  
  -- Check for question patterns
  RETURN (
    -- Question mark with Lyra
    message_text ~ 'lyra.*\?' OR
    
    -- Direct address with question words
    message_text ~ '\mlyra\s+(how|what|when|where|why|who|can|could|will|would|should|is|are|do|does|did|tell|say|hru|sup|wassup)\M' OR
    
    -- Greeting patterns
    message_text ~ '\m(hi|hey|hello)\s+lyra\M' OR
    
    -- Direct address
    message_text ~ '\m@lyra\s+\w+' OR
    
    -- Common short forms
    message_text ~ '\mlyra\s+(hru|sup|wassup)\M'
  );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION is_direct_question_to_lyra(TEXT) TO authenticated;
