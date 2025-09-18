-- Make original_link_id nullable
ALTER TABLE coin_earning_opportunities ALTER COLUMN original_link_id DROP NOT NULL;
