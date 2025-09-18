-- Create articles table
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  cover_image_url TEXT,
  content TEXT NOT NULL,
  tags TEXT[],
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);

-- Enable RLS
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Anyone can view published articles
CREATE POLICY "Anyone can view published articles" 
ON public.articles
FOR SELECT
USING (is_published = true);

-- Only admins can view all articles including unpublished ones
CREATE POLICY "Admins can view all articles" 
ON public.articles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Only admins can insert articles
CREATE POLICY "Only admins can insert articles" 
ON public.articles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Only admins can update articles
CREATE POLICY "Only admins can update articles" 
ON public.articles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Only admins can delete articles
CREATE POLICY "Only admins can delete articles" 
ON public.articles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug_from_title(title TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  -- Convert to lowercase and replace spaces with hyphens
  base_slug := LOWER(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
  
  -- Initial slug attempt
  final_slug := base_slug;
  
  -- Keep trying with incremented counters until we find a unique slug
  WHILE EXISTS (SELECT 1 FROM public.articles WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically generate slug if not provided
CREATE OR REPLACE FUNCTION set_article_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- If slug is not provided, generate one from title
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug_from_title(NEW.title);
  END IF;
  
  -- Always set updated_at on changes
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to articles table
DROP TRIGGER IF EXISTS set_article_slug_trigger ON public.articles;
CREATE TRIGGER set_article_slug_trigger
BEFORE INSERT OR UPDATE ON public.articles
FOR EACH ROW
EXECUTE FUNCTION set_article_slug();
