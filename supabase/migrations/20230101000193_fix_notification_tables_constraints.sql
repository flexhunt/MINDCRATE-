-- Drop existing tables if they exist to start fresh
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS scheduled_notifications CASCADE;
DROP TABLE IF EXISTS notification_templates CASCADE;

-- Create notification templates table with proper constraints
CREATE TABLE notification_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- Add unique constraint for ON CONFLICT
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    icon TEXT DEFAULT '/logo.png',
    badge TEXT DEFAULT '/logo.png',
    url TEXT,
    image TEXT,
    category TEXT DEFAULT 'General',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scheduled notifications table
CREATE TABLE scheduled_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    url TEXT,
    image TEXT,
    icon TEXT DEFAULT '/logo.png',
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE
);

-- Create notification logs table
CREATE TABLE notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 0,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for now
CREATE POLICY "Allow all for notification_templates" ON notification_templates FOR ALL USING (true);
CREATE POLICY "Allow all for scheduled_notifications" ON scheduled_notifications FOR ALL USING (true);
CREATE POLICY "Allow all for notification_logs" ON notification_logs FOR ALL USING (true);

-- Insert default templates with proper conflict handling
INSERT INTO notification_templates (name, title, body, category, url) VALUES
('welcome', '🎉 Welcome to DarkHunt!', 'Thanks for joining our community! Start exploring now.', 'Welcome', '/dashboard'),
('daily_reward', '🎁 Daily Reward Ready!', 'Your daily coins are waiting! Don''t miss out.', 'Rewards', '/earn-coins'),
('new_course', '📚 New Course Available!', 'Check out our latest course and level up your skills.', 'Education', '/courses'),
('challenge_alert', '🏆 Challenge Ending Soon!', 'Only 24 hours left to complete your challenge.', 'Challenges', '/challenges'),
('quiz_time', '🧠 New Quiz Available!', 'Test your knowledge with our latest quiz.', 'Education', '/quiz'),
('shop_update', '🛍️ New Items in Shop!', 'Check out the latest additions to our shop.', 'Shopping', '/shop')
ON CONFLICT (name) DO UPDATE SET
    title = EXCLUDED.title,
    body = EXCLUDED.body,
    category = EXCLUDED.category,
    url = EXCLUDED.url,
    updated_at = NOW();
