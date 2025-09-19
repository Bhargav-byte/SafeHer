-- Database Schema for SafeHer App
-- Run this SQL in your Supabase SQL Editor

-- Create user_profiles table for onboarding data
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 13 AND age <= 100),
  height INTEGER NOT NULL CHECK (height >= 100 AND height <= 250),
  health_goal TEXT NOT NULL CHECK (health_goal IN ('Maintain Weight', 'Weight Loss', 'Weight Gain', 'General Wellness')),
  diet_type TEXT NOT NULL CHECK (diet_type IN ('Vegetarian', 'Non-Vegetarian', 'Vegan', 'Other')),
  emergency_contacts JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Create sos_events table (if not exists)
CREATE TABLE IF NOT EXISTS sos_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT NOW(),
  user_id TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  audio_url TEXT,
  is_live_tracking BOOLEAN DEFAULT FALSE
);

-- Create indexes for sos_events
CREATE INDEX IF NOT EXISTS idx_sos_events_user_id ON sos_events(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_events_created_at ON sos_events(created_at);

-- Enable RLS for sos_events
ALTER TABLE sos_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sos_events
CREATE POLICY IF NOT EXISTS "Users can view own sos events" ON sos_events
  FOR SELECT USING (true); -- For now, allow all users to view all events

CREATE POLICY IF NOT EXISTS "Users can insert sos events" ON sos_events
  FOR INSERT WITH CHECK (true); -- For now, allow all users to insert events

-- Create storage bucket for audio files (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('sos-evidence', 'sos-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for audio uploads
CREATE POLICY IF NOT EXISTS "Allow audio uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'sos-evidence');

CREATE POLICY IF NOT EXISTS "Allow audio downloads" ON storage.objects
FOR SELECT USING (bucket_id = 'sos-evidence');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
