-- TripBlend Database Schema
-- Quick vacation compatibility tool - no auth required

-- Blends (trip planning sessions)
CREATE TABLE IF NOT EXISTS blends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participants in a blend
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blend_id UUID NOT NULL REFERENCES blends(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  traveler_type TEXT,
  quiz_answers JSONB DEFAULT '{}',
  passport_country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Available months per participant (e.g., "2026-03")
CREATE TABLE IF NOT EXISTS availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL,
  UNIQUE(participant_id, year_month)
);

-- Destination picks per participant
CREATE TABLE IF NOT EXISTS destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  destination_key TEXT NOT NULL,
  interest_level INTEGER DEFAULT 3 CHECK (interest_level >= 1 AND interest_level <= 5),
  UNIQUE(participant_id, destination_key)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_participants_blend_id ON participants(blend_id);
CREATE INDEX IF NOT EXISTS idx_availability_participant_id ON availability(participant_id);
CREATE INDEX IF NOT EXISTS idx_destinations_participant_id ON destinations(participant_id);
CREATE INDEX IF NOT EXISTS idx_blends_invite_code ON blends(invite_code);

-- Enable RLS but allow public access (no auth required for this tool)
ALTER TABLE blends ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;

-- Public access policies (anyone can read/write since no auth)
CREATE POLICY "Public read blends" ON blends FOR SELECT USING (true);
CREATE POLICY "Public insert blends" ON blends FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update blends" ON blends FOR UPDATE USING (true);

CREATE POLICY "Public read participants" ON participants FOR SELECT USING (true);
CREATE POLICY "Public insert participants" ON participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update participants" ON participants FOR UPDATE USING (true);
CREATE POLICY "Public delete participants" ON participants FOR DELETE USING (true);

CREATE POLICY "Public read availability" ON availability FOR SELECT USING (true);
CREATE POLICY "Public insert availability" ON availability FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete availability" ON availability FOR DELETE USING (true);

CREATE POLICY "Public read destinations" ON destinations FOR SELECT USING (true);
CREATE POLICY "Public insert destinations" ON destinations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update destinations" ON destinations FOR UPDATE USING (true);
CREATE POLICY "Public delete destinations" ON destinations FOR DELETE USING (true);
