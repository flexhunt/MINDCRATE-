-- Create article views tracking
CREATE TABLE IF NOT EXISTS article_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add views_count column to articles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'views_count') THEN
        ALTER TABLE articles ADD COLUMN views_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create function to increment article views
CREATE OR REPLACE FUNCTION increment_article_views(article_uuid UUID, user_uuid UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    view_exists BOOLEAN := FALSE;
BEGIN
    -- Check if this user/IP already viewed this article today
    IF user_uuid IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM article_views 
            WHERE article_id = article_uuid 
            AND user_id = user_uuid 
            AND created_at > NOW() - INTERVAL '24 hours'
        ) INTO view_exists;
    END IF;
    
    -- Only count if not viewed recently
    IF NOT view_exists THEN
        -- Insert view record
        INSERT INTO article_views (article_id, user_id, created_at)
        VALUES (article_uuid, user_uuid, NOW());
        
        -- Update article views count
        UPDATE articles 
        SET views_count = COALESCE(views_count, 0) + 1,
            updated_at = NOW()
        WHERE id = article_uuid;
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE article_views ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can insert article views" ON article_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own article views" ON article_views
    FOR SELECT USING (auth.uid() = user_id);

-- Grant permissions
GRANT EXECUTE ON FUNCTION increment_article_views(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_article_views(UUID, UUID) TO anon;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_article_views_article_id ON article_views(article_id);
CREATE INDEX IF NOT EXISTS idx_article_views_user_id ON article_views(user_id);
CREATE INDEX IF NOT EXISTS idx_article_views_created_at ON article_views(created_at);

SELECT 'Article views system created successfully! 📊' as result;
