-- Drop existing table if it exists
DROP TABLE IF EXISTS admin_settings;

-- Create admin_settings table with proper structure
CREATE TABLE admin_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default Lyra mode setting
INSERT INTO admin_settings (key, value, description) 
VALUES ('lyra_response_mode', 'mentions', 'Controls when Lyra responds: mentions or all')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = NOW();

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin can view settings" ON admin_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admin can update settings" ON admin_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Create function to update admin settings
CREATE OR REPLACE FUNCTION update_admin_setting(setting_key TEXT, setting_value TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO admin_settings (key, value, updated_at)
    VALUES (setting_key, setting_value, NOW())
    ON CONFLICT (key) 
    DO UPDATE SET 
        value = EXCLUDED.value,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
