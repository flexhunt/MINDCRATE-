-- Create user activities table for tracking user actions and admin messages
CREATE TABLE IF NOT EXISTS public.user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    content TEXT NOT NULL,
    priority BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add RLS policies
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read activities
CREATE POLICY "Authenticated users can read all activities" 
ON public.user_activities
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Allow admins to insert activities
CREATE POLICY "Admins can insert activities" 
ON public.user_activities
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE admin_users.id = auth.uid()
    )
);

-- Create function to record user activity
CREATE OR REPLACE FUNCTION public.record_user_activity(
    p_user_id UUID,
    p_activity_type TEXT,
    p_content TEXT,
    p_priority BOOLEAN DEFAULT false,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_activity_id UUID;
BEGIN
    INSERT INTO public.user_activities (
        user_id,
        activity_type,
        content,
        priority,
        metadata
    ) VALUES (
        p_user_id,
        p_activity_type,
        p_content,
        p_priority,
        p_metadata
    )
    RETURNING id INTO v_activity_id;
    
    RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to record level completion
CREATE OR REPLACE FUNCTION public.record_level_completion()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.record_user_activity(
        NEW.user_id,
        'level_completed',
        NEW.level_id::text,
        false,
        jsonb_build_object('level_id', NEW.level_id, 'score', NEW.score)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to user_progress table
DROP TRIGGER IF EXISTS on_level_completion ON public.user_progress;
CREATE TRIGGER on_level_completion
AFTER INSERT ON public.user_progress
FOR EACH ROW
WHEN (NEW.completed = true)
EXECUTE FUNCTION public.record_level_completion();

-- Create trigger to record article publication
CREATE OR REPLACE FUNCTION public.record_article_publication()
RETURNS TRIGGER AS $$
BEGIN
    -- Only record when article is published
    IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status <> 'published') THEN
        PERFORM public.record_user_activity(
            NEW.author_id,
            'article_published',
            NEW.title,
            true,
            jsonb_build_object('article_id', NEW.id, 'slug', NEW.slug)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to articles table
DROP TRIGGER IF EXISTS on_article_publication ON public.articles;
CREATE TRIGGER on_article_publication
AFTER INSERT OR UPDATE ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.record_article_publication();

-- Create trigger to record new user registration
CREATE OR REPLACE FUNCTION public.record_user_registration()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.record_user_activity(
        NEW.id,
        'user_joined',
        COALESCE(NEW.username, NEW.email, 'New user'),
        false,
        jsonb_build_object('email', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to profiles table
DROP TRIGGER IF EXISTS on_user_registration ON public.profiles;
CREATE TRIGGER on_user_registration
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.record_user_registration();

-- Create trigger to record item purchases
CREATE OR REPLACE FUNCTION public.record_item_purchase()
RETURNS TRIGGER AS $$
BEGIN
    -- Get item name
    DECLARE
        item_name TEXT;
    BEGIN
        SELECT name INTO item_name FROM public.shop_items WHERE id = NEW.item_id;
        
        PERFORM public.record_user_activity(
            NEW.user_id,
            'item_purchased',
            item_name,
            false,
            jsonb_build_object('item_id', NEW.item_id, 'quantity', NEW.quantity)
        );
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to user_purchases table
DROP TRIGGER IF EXISTS on_item_purchase ON public.user_purchases;
CREATE TRIGGER on_item_purchase
AFTER INSERT ON public.user_purchases
FOR EACH ROW
EXECUTE FUNCTION public.record_item_purchase();
