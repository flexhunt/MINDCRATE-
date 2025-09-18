-- Drop existing policies
DROP POLICY IF EXISTS "Admin can manage templates" ON notification_templates;
DROP POLICY IF EXISTS "Admin can manage scheduled notifications" ON scheduled_notifications;
DROP POLICY IF EXISTS "Admin can view logs" ON notification_logs;

-- Create more permissive policies for now
CREATE POLICY "Allow all for templates" ON notification_templates
    FOR ALL USING (true);

CREATE POLICY "Allow all for scheduled notifications" ON scheduled_notifications
    FOR ALL USING (true);

CREATE POLICY "Allow all for logs" ON notification_logs
    FOR ALL USING (true);

-- Alternative: Create function to check admin status
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user exists in profiles and has admin email
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (
            profiles.email = current_setting('app.admin_email', true)
            OR profiles.email IN (
                SELECT email FROM profiles WHERE email LIKE '%admin%'
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default templates if they don't exist
INSERT INTO notification_templates (name, title, body, category, url) VALUES
('Welcome', '🎉 Welcome to DarkHunt!', 'Thanks for joining our community! Start exploring now.', 'Welcome', '/dashboard'),
('Daily Reward', '🎁 Daily Reward Ready!', 'Your daily coins are waiting! Don''t miss out.', 'Rewards', '/earn-coins'),
('New Course', '📚 New Course Available!', 'Check out our latest course and level up your skills.', 'Education', '/courses'),
('Challenge Alert', '🏆 Challenge Ending Soon!', 'Only 24 hours left to complete your challenge.', 'Challenges', '/challenges'),
('Quiz Time', '🧠 New Quiz Available!', 'Test your knowledge with our latest quiz.', 'Education', '/quiz'),
('Shop Update', '🛍️ New Items in Shop!', 'Check out the latest additions to our shop.', 'Shopping', '/shop'),
('Course Complete', '🎓 Course Completed!', 'Congratulations on completing your course!', 'Education', '/courses'),
('New Message', '💬 New Message!', 'You have a new message in chat.', 'Social', '/chat')
ON CONFLICT (name) DO NOTHING;
