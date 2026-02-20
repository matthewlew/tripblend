-- Add home airport to participants
ALTER TABLE participants ADD COLUMN IF NOT EXISTS home_airport TEXT;
