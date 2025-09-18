-- Check if push_subscriptions table exists and fix its structure
DO $$
BEGIN
    -- Drop the table if it exists to recreate with proper structure
    DROP TABLE IF EXISTS push_subscriptions;
    
    -- Create push_subscriptions table with correct structure
    CREATE TABLE push_subscriptions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, endpoint)
    );

    -- Enable RLS
    ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies
    CREATE POLICY "Users can view their own subscriptions" ON push_subscriptions
        FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own subscriptions" ON push_subscriptions
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own subscriptions" ON push_subscriptions
        FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own subscriptions" ON push_subscriptions
        FOR DELETE USING (auth.uid() = user_id);

    -- Create index for better performance
    CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
    CREATE INDEX idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

END $$;
