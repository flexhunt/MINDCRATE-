-- Create ad_card_usage table to track when users watch ads
CREATE TABLE IF NOT EXISTS public.ad_card_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ad_card_id UUID NOT NULL REFERENCES public.ad_cards(id) ON DELETE CASCADE,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.ad_card_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own ad usage" ON public.ad_card_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ad usage" ON public.ad_card_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all ad usage" ON public.ad_card_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.owners 
            WHERE user_id = auth.uid()
        )
    );

-- Create indexes for performance
CREATE INDEX idx_ad_card_usage_user_id ON public.ad_card_usage(user_id);
CREATE INDEX idx_ad_card_usage_ad_card_id ON public.ad_card_usage(ad_card_id);
CREATE INDEX idx_ad_card_usage_used_at ON public.ad_card_usage(used_at);
CREATE INDEX idx_ad_card_usage_user_card ON public.ad_card_usage(user_id, ad_card_id);

-- Create unique constraint to prevent duplicate usage within 24 hours
CREATE UNIQUE INDEX idx_ad_card_usage_unique_daily ON public.ad_card_usage(user_id, ad_card_id, DATE(used_at));
