-- Add alias column to blends table for custom trip URLs
ALTER TABLE blends ADD COLUMN IF NOT EXISTS alias TEXT UNIQUE;

-- Create index for faster alias lookups
CREATE INDEX IF NOT EXISTS idx_blends_alias ON blends(alias);

-- Add comment
COMMENT ON COLUMN blends.alias IS 'Custom URL-friendly alias for the trip (e.g., summer-vacation instead of A5RKJD)';
