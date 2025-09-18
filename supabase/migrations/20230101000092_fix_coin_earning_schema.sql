-- First, let's check what tables and columns actually exist
DO $$
DECLARE
    coin_links_exists BOOLEAN;
    coin_link_uses_exists BOOLEAN;
    coin_earning_opportunities_exists BOOLEAN;
    coin_earning_opportunities_has_coins BOOLEAN;
    coin_earning_opportunities_has_original_link_id BOOLEAN;
BEGIN
    -- Check if tables exist
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'coin_links'
    ) INTO coin_links_exists;
    
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'coin_link_uses'
    ) INTO coin_link_uses_exists;
    
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'coin_earning_opportunities'
    ) INTO coin_earning_opportunities_exists;
    
    -- Check if specific columns exist
    IF coin_earning_opportunities_exists THEN
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'coin_earning_opportunities' 
            AND column_name = 'coins'
        ) INTO coin_earning_opportunities_has_coins;
        
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'coin_earning_opportunities' 
            AND column_name = 'original_link_id'
        ) INTO coin_earning_opportunities_has_original_link_id;
    END IF;
    
    -- Drop tables if they exist
    IF coin_link_uses_exists THEN
        DROP TABLE coin_link_uses;
        RAISE NOTICE 'Dropped coin_link_uses table';
    END IF;
    
    IF coin_links_exists THEN
        DROP TABLE coin_links;
        RAISE NOTICE 'Dropped coin_links table';
    END IF;
    
    -- Create or modify coin_earning_opportunities table
    IF NOT coin_earning_opportunities_exists THEN
        -- Create the table if it doesn't exist
        CREATE TABLE coin_earning_opportunities (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title TEXT NOT NULL,
            description TEXT,
            coins INTEGER NOT NULL DEFAULT 10,
            short_url TEXT NOT NULL,
            active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created coin_earning_opportunities table';
    ELSE
        -- Modify the existing table
        IF NOT coin_earning_opportunities_has_coins THEN
            ALTER TABLE coin_earning_opportunities ADD COLUMN coins INTEGER NOT NULL DEFAULT 10;
            RAISE NOTICE 'Added coins column to coin_earning_opportunities';
        END IF;
        
        IF coin_earning_opportunities_has_original_link_id THEN
            ALTER TABLE coin_earning_opportunities DROP COLUMN original_link_id;
            RAISE NOTICE 'Dropped original_link_id column from coin_earning_opportunities';
        END IF;
        
        -- Make sure active has a default value
        ALTER TABLE coin_earning_opportunities 
        ALTER COLUMN active SET DEFAULT TRUE;
        RAISE NOTICE 'Set default value for active column in coin_earning_opportunities';
    END IF;
    
    -- Create RLS policies
    ALTER TABLE coin_earning_opportunities ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Allow public read access to active opportunities" ON coin_earning_opportunities;
    DROP POLICY IF EXISTS "Allow admins to manage opportunities" ON coin_earning_opportunities;
    
    -- Create new policies
    CREATE POLICY "Allow public read access to active opportunities" 
    ON coin_earning_opportunities FOR SELECT 
    USING (active = TRUE);
    
    CREATE POLICY "Allow admins to manage opportunities" 
    ON coin_earning_opportunities FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM owners WHERE owners.id = auth.uid()
        )
    );
    
    RAISE NOTICE 'Created RLS policies for coin_earning_opportunities';
END $$;
