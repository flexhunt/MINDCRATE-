-- Add views column to articles table for better performance
ALTER TABLE articles ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS saves_count INTEGER DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;

-- Create article views table (lightweight for tracking)
CREATE TABLE IF NOT EXISTS article_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Only store essential data to minimize size
    UNIQUE(article_id, user_id, DATE(created_at)) -- One view per user per day
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_article_views_article_id ON article_views(article_id);
CREATE INDEX IF NOT EXISTS idx_article_views_created_at ON article_views(created_at);

-- Enable RLS
ALTER TABLE article_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for views
CREATE POLICY "Anyone can insert views" ON article_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view all article views" ON article_views
    FOR SELECT USING (true);

-- Function to increment article view (optimized)
CREATE OR REPLACE FUNCTION increment_article_view(
    article_uuid UUID,
    user_uuid UUID DEFAULT NULL,
    ip_addr INET DEFAULT NULL,
    user_agent_str TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    view_exists BOOLEAN := FALSE;
BEGIN
    -- Check if view already exists today (to prevent spam)
    IF user_uuid IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM article_views 
            WHERE article_id = article_uuid 
            AND user_id = user_uuid 
            AND DATE(created_at) = CURRENT_DATE
        ) INTO view_exists;
    ELSE
        SELECT EXISTS(
            SELECT 1 FROM article_views 
            WHERE article_id = article_uuid 
            AND ip_address = ip_addr 
            AND DATE(created_at) = CURRENT_DATE
        ) INTO view_exists;
    END IF;
    
    -- Only insert if view doesn't exist today
    IF NOT view_exists THEN
        INSERT INTO article_views (article_id, user_id, ip_address, user_agent)
        VALUES (article_uuid, user_uuid, ip_addr, LEFT(user_agent_str, 255))
        ON CONFLICT DO NOTHING;
        
        -- Update article views count
        UPDATE articles 
        SET views_count = views_count + 1 
        WHERE id = article_uuid;
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update article stats (called by triggers)
CREATE OR REPLACE FUNCTION update_article_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update counters when interaction is added
        UPDATE articles SET
            likes_count = CASE WHEN NEW.interaction_type = 'like' THEN likes_count + 1 ELSE likes_count END,
            saves_count = CASE WHEN NEW.interaction_type = 'save' THEN saves_count + 1 ELSE saves_count END,
            shares_count = CASE WHEN NEW.interaction_type = 'share' THEN shares_count + 1 ELSE shares_count END
        WHERE id = NEW.article_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update counters when interaction is removed
        UPDATE articles SET
            likes_count = CASE WHEN OLD.interaction_type = 'like' THEN GREATEST(likes_count - 1, 0) ELSE likes_count END,
            saves_count = CASE WHEN OLD.interaction_type = 'save' THEN GREATEST(saves_count - 1, 0) ELSE saves_count END,
            shares_count = CASE WHEN OLD.interaction_type = 'share' THEN GREATEST(shares_count - 1, 0) ELSE shares_count END
        WHERE id = OLD.article_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update stats
DROP TRIGGER IF EXISTS trigger_update_article_stats ON article_interactions;
CREATE TRIGGER trigger_update_article_stats
    AFTER INSERT OR DELETE ON article_interactions
    FOR EACH ROW EXECUTE FUNCTION update_article_stats();

-- Function to get user's saved articles
CREATE OR REPLACE FUNCTION get_user_saved_articles(user_uuid UUID)
RETURNS TABLE(
    id UUID,
    title TEXT,
    slug TEXT,
    cover_image_url TEXT,
    content TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    views_count INTEGER,
    likes_count INTEGER,
    saves_count INTEGER,
    saved_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.title,
        a.slug,
        a.cover_image_url,
        a.content,
        a.tags,
        a.created_at,
        a.views_count,
        a.likes_count,
        a.saves_count,
        ai.created_at as saved_at
    FROM articles a
    INNER JOIN article_interactions ai ON a.id = ai.article_id
    WHERE ai.user_id = user_uuid 
    AND ai.interaction_type = 'save'
    AND a.is_published = true
    ORDER BY ai.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
