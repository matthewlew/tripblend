-- Add avoided destinations table
CREATE TABLE IF NOT EXISTS avoided_destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  destination_key TEXT NOT NULL,
  destination_data JSONB,
  UNIQUE(participant_id, destination_key)
);

CREATE INDEX IF NOT EXISTS idx_avoided_destinations_participant_id ON avoided_destinations(participant_id);

ALTER TABLE avoided_destinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read avoided_destinations" ON avoided_destinations FOR SELECT USING (true);
CREATE POLICY "Public insert avoided_destinations" ON avoided_destinations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete avoided_destinations" ON avoided_destinations FOR DELETE USING (true);
