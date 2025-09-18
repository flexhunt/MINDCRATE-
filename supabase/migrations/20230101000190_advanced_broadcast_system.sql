-- Create notification templates table
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    icon TEXT DEFAULT '/logo.png',
    badge TEXT DEFAULT '/logo.png',
    url TEXT,
    image TEXT,
    category TEXT DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create scheduled notifications table
CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    icon TEXT DEFAULT '/logo.png',
    badge TEXT DEFAULT '/logo.png',
    url TEXT,
    image TEXT,
    scheduled_for TIMESTAMPTZ NOT NULL,
    sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notification logs table
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 0,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin only)
CREATE POLICY "Admin can manage templates" ON public.notification_templates FOR ALL USING (
    EXISTS (SELECT 1 FROM public.owners WHERE user_id = auth.uid())
);

CREATE POLICY "Admin can manage scheduled" ON public.scheduled_notifications FOR ALL USING (
    EXISTS (SELECT 1 FROM public.owners WHERE user_id = auth.uid())
);

CREATE POLICY "Admin can view logs" ON public.notification_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.owners WHERE user_id = auth.uid())
);

-- Insert default templates
INSERT INTO public.notification_templates (name, title, body, category, url) VALUES
('welcome', '🎉 Welcome to DarkHunt!', 'Thanks for joining our community! Start exploring now.', 'user', '/dashboard'),
('new_course', '📚 New Course Available!', 'Check out our latest course and start learning today.', 'course', '/courses'),
('daily_reward', '🎁 Daily Reward Ready!', 'Your daily coins are waiting! Claim them now.', 'reward', '/earn-coins'),
('challenge_invite', '🏆 Challenge Invitation', 'You''ve been invited to join an exciting challenge!', 'challenge', '/challenges'),
('system_update', '🔧 System Update', 'We''ve made some improvements to enhance your experience.', 'system', '/'),
('achievement', '🏅 Achievement Unlocked!', 'Congratulations! You''ve earned a new achievement.', 'achievement', '/profile'),
('reminder', '⏰ Don''t Forget!', 'You have pending activities waiting for you.', 'reminder', '/dashboard');

-- Function to process scheduled notifications
CREATE OR REPLACE FUNCTION process_scheduled_notifications()
RETURNS void AS $$
BEGIN
    -- This will be called by a cron job or API endpoint
    UPDATE public.scheduled_notifications 
    SET sent = true 
    WHERE scheduled_for <= NOW() AND sent = false;
END;
$$ LANGUAGE plpgsql;
