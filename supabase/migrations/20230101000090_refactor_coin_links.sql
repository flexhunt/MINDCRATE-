-- Drop existing tables
DROP TABLE IF EXISTS coin_link_uses;
DROP TABLE IF EXISTS coin_links;

-- Update coin_earning_opportunities table
ALTER TABLE coin_earning_opportunities
DROP COLUMN IF EXISTS original_link_id;

ALTER TABLE coin_earning_opportunities
DROP COLUMN IF EXISTS callback_url;

ALTER TABLE coin_earning_opportunities 
ADD COLUMN coins INTEGER NOT NULL DEFAULT 10;

ALTER TABLE coin_earning_opportunities ALTER COLUMN active SET DEFAULT TRUE;
