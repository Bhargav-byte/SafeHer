-- Create sos_events table
CREATE TABLE sos_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT NOW(),
  user_id TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  audio_url TEXT,
  is_live_tracking BOOLEAN DEFAULT FALSE
);

-- Create an index on user_id for faster queries
CREATE INDEX idx_sos_events_user_id ON sos_events(user_id);

-- Create an index on created_at for faster sorting
CREATE INDEX idx_sos_events_created_at ON sos_events(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE sos_events ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (for testing purposes)
-- In production, you would want more restrictive policies
CREATE POLICY "Allow all operations on sos_events" ON sos_events
FOR ALL USING (true);

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('sos-evidence', 'sos-evidence', true);

-- Create storage policy for audio uploads
CREATE POLICY "Allow audio uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'sos-evidence');

CREATE POLICY "Allow audio downloads" ON storage.objects
FOR SELECT USING (bucket_id = 'sos-evidence');
