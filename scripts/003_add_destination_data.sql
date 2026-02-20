-- Add destination_data column to store full city information
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS destination_data jsonb;
