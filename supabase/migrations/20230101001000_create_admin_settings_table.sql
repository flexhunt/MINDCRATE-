-- Create admin_settings table for storing configuration
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only
CREATE POLICY "Admin can manage settings" ON admin_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM owners 
            WHERE user_id = auth.uid()
        )
    );

-- Insert default Lyra response mode
INSERT INTO admin_settings (key, value, description) 
VALUES (
    'lyra_response_mode', 
    'mentions', 
    'Controls when Lyra AI responds in chat: mentions (only when mentioned) or all (responds to most messages)'
) ON CONFLICT (key) DO NOTHING;

-- Create function to check admin status
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM owners 
        WHERE owners.user_id = is_admin.user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
