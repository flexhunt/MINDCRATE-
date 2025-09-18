-- Create notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
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
CREATE TABLE IF NOT EXISTS scheduled_notifications (
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
CREATE TABLE IF NOT EXISTS notification_logs (
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

-- Create policies (admin only)
CREATE POLICY "Admin can manage templates" ON notification_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.email = current_setting('app.admin_email', true)
        )
    );

CREATE POLICY "Admin can manage scheduled notifications" ON scheduled_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.email = current_setting('app.admin_email', true)
        )
    );

CREATE POLICY "Admin can view logs" ON notification_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.email = current_setting('app.admin_email', true)
        )
    );

-- Insert some default templates
INSERT INTO notification_templates (name, title, body, category, url) VALUES
('Welcome', '🎉 Welcome to DarkHunt!', 'Thanks for joining our community! Start exploring now.', 'Welcome', '/dashboard'),
('Daily Reward', '🎁 Daily Reward Ready!', 'Your daily coins are waiting! Don''t miss out.', 'Rewards', '/earn-coins'),
('New Course', '📚 New Course Available!', 'Check out our latest course and level up your skills.', 'Education', '/courses'),
('Challenge Alert', '🏆 Challenge Ending Soon!', 'Only 24 hours left to complete your challenge.', 'Challenges', '/challenges'),
('Quiz Time', '🧠 New Quiz Available!', 'Test your knowledge with our latest quiz.', 'Education', '/quiz'),
('Shop Update', '🛍️ New Items in Shop!', 'Check out the latest additions to our shop.', 'Shopping', '/shop')
ON CONFLICT DO NOTHING;
