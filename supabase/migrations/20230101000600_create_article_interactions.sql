-- Create article interactions table for likes, saves, etc.
CREATE TABLE IF NOT EXISTS article_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id UUID NOT NULL,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'save', 'share')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, article_id, interaction_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_article_interactions_user_id ON article_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_article_interactions_article_id ON article_interactions(article_id);
CREATE INDEX IF NOT EXISTS idx_article_interactions_type ON article_interactions(interaction_type);

-- Enable RLS
ALTER TABLE article_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all interactions" ON article_interactions
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own interactions" ON article_interactions
    FOR ALL USING (auth.uid() = user_id);

-- Function to get article stats
CREATE OR REPLACE FUNCTION get_article_stats(article_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'likes', COALESCE((SELECT COUNT(*) FROM article_interactions WHERE article_id = article_uuid AND interaction_type = 'like'), 0),
        'saves', COALESCE((SELECT COUNT(*) FROM article_interactions WHERE article_id = article_uuid AND interaction_type = 'save'), 0),
        'shares', COALESCE((SELECT COUNT(*) FROM article_interactions WHERE article_id = article_uuid AND interaction_type = 'share'), 0)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user interaction with article
CREATE OR REPLACE FUNCTION get_user_article_interactions(article_uuid UUID, user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'liked', EXISTS(SELECT 1 FROM article_interactions WHERE article_id = article_uuid AND user_id = user_uuid AND interaction_type = 'like'),
        'saved', EXISTS(SELECT 1 FROM article_interactions WHERE article_id = article_uuid AND user_id = user_uuid AND interaction_type = 'save')
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle interaction
CREATE OR REPLACE FUNCTION toggle_article_interaction(article_uuid UUID, user_uuid UUID, interaction_type_param TEXT)
RETURNS JSON AS $$
DECLARE
    interaction_exists BOOLEAN;
    result JSON;
BEGIN
    -- Check if interaction exists
    SELECT EXISTS(
        SELECT 1 FROM article_interactions 
        WHERE article_id = article_uuid 
        AND user_id = user_uuid 
        AND interaction_type = interaction_type_param
    ) INTO interaction_exists;
    
    IF interaction_exists THEN
        -- Remove interaction
        DELETE FROM article_interactions 
        WHERE article_id = article_uuid 
        AND user_id = user_uuid 
        AND interaction_type = interaction_type_param;
        
        SELECT json_build_object('action', 'removed', 'type', interaction_type_param) INTO result;
    ELSE
        -- Add interaction
        INSERT INTO article_interactions (article_id, user_id, interaction_type)
        VALUES (article_uuid, user_uuid, interaction_type_param)
        ON CONFLICT (user_id, article_id, interaction_type) DO NOTHING;
        
        SELECT json_build_object('action', 'added', 'type', interaction_type_param) INTO result;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
