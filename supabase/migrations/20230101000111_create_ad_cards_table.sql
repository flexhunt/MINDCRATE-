-- Create ad_cards table for the new earn coins system
CREATE TABLE IF NOT EXISTS public.ad_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    waiting_time INTEGER NOT NULL DEFAULT 10,
    direct_link TEXT NOT NULL,
    coins_reward INTEGER NOT NULL DEFAULT 10,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.ad_cards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active ad cards" ON public.ad_cards
    FOR SELECT USING (active = true);

CREATE POLICY "Only admins can manage ad cards" ON public.ad_cards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.owners 
            WHERE user_id = auth.uid()
        )
    );

-- Create indexes
CREATE INDEX idx_ad_cards_active ON public.ad_cards(active);
CREATE INDEX idx_ad_cards_created_at ON public.ad_cards(created_at);

-- Insert some sample ad cards
INSERT INTO public.ad_cards (name, description, waiting_time, direct_link, coins_reward) VALUES
('Watch Video Ad', 'Watch a short video advertisement', 15, 'https://example.com/video-ad', 25),
('Banner Click', 'Click on banner advertisement', 10, 'https://example.com/banner-ad', 15),
('Survey Complete', 'Complete a quick survey', 30, 'https://example.com/survey', 50);
