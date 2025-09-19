-- Unusual Activities Detection Schema for Supabase
-- This schema supports comprehensive unusual activity detection and tracking

-- Unusual Activities Table
CREATE TABLE IF NOT EXISTS unusual_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('late_night_exit', 'route_deviation', 'missed_checkin', 'repeated_sos', 'health_anomaly')),
  details TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'investigating')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  location JSONB, -- Store latitude/longitude as JSON
  metadata JSONB, -- Store additional event-specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Settings Table for Detection Configuration
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  track_late_night_exit BOOLEAN DEFAULT true,
  track_route_deviation BOOLEAN DEFAULT true,
  track_missed_checkin BOOLEAN DEFAULT true,
  track_repeated_sos BOOLEAN DEFAULT true,
  track_health_anomaly BOOLEAN DEFAULT true,
  safe_zone_radius INTEGER DEFAULT 1000, -- in meters
  late_night_start TIME DEFAULT '22:00',
  late_night_end TIME DEFAULT '05:00',
  sos_threshold INTEGER DEFAULT 2, -- max SOS per day
  health_anomaly_threshold INTEGER DEFAULT 3, -- max anomalies per hour
  auto_sos_enabled BOOLEAN DEFAULT true,
  notification_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Location History Table for Route Analysis
CREATE TABLE IF NOT EXISTS location_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_normal_route BOOLEAN DEFAULT false, -- Mark normal routes for comparison
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health Data Table for Anomaly Detection
CREATE TABLE IF NOT EXISTS health_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  heart_rate INTEGER,
  steps INTEGER,
  sleep_hours DOUBLE PRECISION,
  sleep_quality TEXT CHECK (sleep_quality IN ('poor', 'fair', 'good', 'excellent')),
  water_intake INTEGER, -- glasses per day
  weight DOUBLE PRECISION,
  basal_body_temp DOUBLE PRECISION,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check-in History Table
CREATE TABLE IF NOT EXISTS checkin_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expected_checkin TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_checkin TIMESTAMP WITH TIME ZONE,
  timer_minutes INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SOS Events Table (if not already exists)
CREATE TABLE IF NOT EXISTS sos_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  audio_url TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'false_alarm')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_unusual_activities_user_id ON unusual_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_unusual_activities_timestamp ON unusual_activities(timestamp);
CREATE INDEX IF NOT EXISTS idx_unusual_activities_status ON unusual_activities(status);
CREATE INDEX IF NOT EXISTS idx_unusual_activities_event_type ON unusual_activities(event_type);

CREATE INDEX IF NOT EXISTS idx_location_history_user_id ON location_history(user_id);
CREATE INDEX IF NOT EXISTS idx_location_history_timestamp ON location_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_location_history_normal_route ON location_history(is_normal_route);

CREATE INDEX IF NOT EXISTS idx_health_data_user_id ON health_data(user_id);
CREATE INDEX IF NOT EXISTS idx_health_data_timestamp ON health_data(timestamp);

CREATE INDEX IF NOT EXISTS idx_checkin_history_user_id ON checkin_history(user_id);
CREATE INDEX IF NOT EXISTS idx_checkin_history_expected ON checkin_history(expected_checkin);

CREATE INDEX IF NOT EXISTS idx_sos_events_user_id ON sos_events(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_events_timestamp ON sos_events(timestamp);

-- Row Level Security (RLS) Policies
ALTER TABLE unusual_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for unusual_activities
CREATE POLICY "Users can view their own unusual activities" ON unusual_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own unusual activities" ON unusual_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own unusual activities" ON unusual_activities
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_settings
CREATE POLICY "Users can view their own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for location_history
CREATE POLICY "Users can view their own location history" ON location_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own location history" ON location_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for health_data
CREATE POLICY "Users can view their own health data" ON health_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health data" ON health_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for checkin_history
CREATE POLICY "Users can view their own checkin history" ON checkin_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checkin history" ON checkin_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checkin history" ON checkin_history
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for sos_events
CREATE POLICY "Users can view their own sos events" ON sos_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sos events" ON sos_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sos events" ON sos_events
  FOR UPDATE USING (auth.uid() = user_id);

-- Functions for Unusual Activity Detection

-- Function to detect late night exits
CREATE OR REPLACE FUNCTION detect_late_night_exit(
  p_user_id UUID,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_timestamp TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN AS $$
DECLARE
  user_settings_record RECORD;
  home_latitude DOUBLE PRECISION := 40.7128; -- Default NYC, should be user's home
  home_longitude DOUBLE PRECISION := -74.0060;
  distance_meters DOUBLE PRECISION;
  current_hour INTEGER;
BEGIN
  -- Get user settings
  SELECT * INTO user_settings_record FROM user_settings WHERE user_id = p_user_id;
  
  -- If settings don't exist or tracking is disabled, return false
  IF user_settings_record IS NULL OR NOT user_settings_record.track_late_night_exit THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate distance from home (simplified calculation)
  distance_meters := 6371000 * acos(
    cos(radians(home_latitude)) * cos(radians(p_latitude)) * 
    cos(radians(p_longitude) - radians(home_longitude)) + 
    sin(radians(home_latitude)) * sin(radians(p_latitude))
  );
  
  -- Get current hour
  current_hour := EXTRACT(HOUR FROM p_timestamp);
  
  -- Check if it's late night and outside safe zone
  RETURN (
    (current_hour >= EXTRACT(HOUR FROM user_settings_record.late_night_start) OR 
     current_hour < EXTRACT(HOUR FROM user_settings_record.late_night_end)) AND
    distance_meters > user_settings_record.safe_zone_radius
  );
END;
$$ LANGUAGE plpgsql;

-- Function to detect repeated SOS events
CREATE OR REPLACE FUNCTION detect_repeated_sos(
  p_user_id UUID,
  p_timestamp TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN AS $$
DECLARE
  user_settings_record RECORD;
  sos_count_today INTEGER;
BEGIN
  -- Get user settings
  SELECT * INTO user_settings_record FROM user_settings WHERE user_id = p_user_id;
  
  -- If settings don't exist or tracking is disabled, return false
  IF user_settings_record IS NULL OR NOT user_settings_record.track_repeated_sos THEN
    RETURN FALSE;
  END IF;
  
  -- Count SOS events today
  SELECT COUNT(*) INTO sos_count_today 
  FROM sos_events 
  WHERE user_id = p_user_id 
    AND DATE(timestamp) = DATE(p_timestamp);
  
  -- Return true if SOS count exceeds threshold
  RETURN sos_count_today >= user_settings_record.sos_threshold;
END;
$$ LANGUAGE plpgsql;

-- Function to detect health anomalies
CREATE OR REPLACE FUNCTION detect_health_anomaly(
  p_user_id UUID,
  p_heart_rate INTEGER,
  p_steps INTEGER,
  p_sleep_hours DOUBLE PRECISION,
  p_timestamp TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN AS $$
DECLARE
  user_settings_record RECORD;
  anomaly_count INTEGER;
BEGIN
  -- Get user settings
  SELECT * INTO user_settings_record FROM user_settings WHERE user_id = p_user_id;
  
  -- If settings don't exist or tracking is disabled, return false
  IF user_settings_record IS NULL OR NOT user_settings_record.track_health_anomaly THEN
    RETURN FALSE;
  END IF;
  
  -- Count health anomalies in the last hour
  SELECT COUNT(*) INTO anomaly_count
  FROM health_data
  WHERE user_id = p_user_id
    AND timestamp >= p_timestamp - INTERVAL '1 hour'
    AND (
      (heart_rate IS NOT NULL AND heart_rate > 100) OR
      (steps IS NOT NULL AND steps < 1000) OR
      (sleep_hours IS NOT NULL AND sleep_hours < 4)
    );
  
  -- Return true if anomaly count exceeds threshold
  RETURN anomaly_count >= user_settings_record.health_anomaly_threshold;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically detect unusual activities
CREATE OR REPLACE FUNCTION trigger_unusual_activity_detection()
RETURNS TRIGGER AS $$
DECLARE
  is_unusual BOOLEAN := FALSE;
  activity_details TEXT;
BEGIN
  -- Check for late night exit (for location data)
  IF TG_TABLE_NAME = 'location_history' THEN
    is_unusual := detect_late_night_exit(NEW.user_id, NEW.latitude, NEW.longitude, NEW.timestamp);
    IF is_unusual THEN
      activity_details := 'User detected outside safe zone during late night hours';
      INSERT INTO unusual_activities (user_id, event_type, details, severity, location, timestamp)
      VALUES (NEW.user_id, 'late_night_exit', activity_details, 'high', 
              json_build_object('latitude', NEW.latitude, 'longitude', NEW.longitude), NEW.timestamp);
    END IF;
  END IF;
  
  -- Check for repeated SOS (for SOS events)
  IF TG_TABLE_NAME = 'sos_events' THEN
    is_unusual := detect_repeated_sos(NEW.user_id, NEW.timestamp);
    IF is_unusual THEN
      activity_details := 'Multiple SOS triggers detected today';
      INSERT INTO unusual_activities (user_id, event_type, details, severity, location, timestamp)
      VALUES (NEW.user_id, 'repeated_sos', activity_details, 'high',
              json_build_object('latitude', NEW.latitude, 'longitude', NEW.longitude), NEW.timestamp);
    END IF;
  END IF;
  
  -- Check for health anomalies (for health data)
  IF TG_TABLE_NAME = 'health_data' THEN
    is_unusual := detect_health_anomaly(NEW.user_id, NEW.heart_rate, NEW.steps, NEW.sleep_hours, NEW.timestamp);
    IF is_unusual THEN
      activity_details := 'Multiple health anomalies detected within short time';
      INSERT INTO unusual_activities (user_id, event_type, details, severity, timestamp)
      VALUES (NEW.user_id, 'health_anomaly', activity_details, 'medium', NEW.timestamp);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER location_unusual_activity_trigger
  AFTER INSERT ON location_history
  FOR EACH ROW EXECUTE FUNCTION trigger_unusual_activity_detection();

CREATE TRIGGER sos_unusual_activity_trigger
  AFTER INSERT ON sos_events
  FOR EACH ROW EXECUTE FUNCTION trigger_unusual_activity_detection();

CREATE TRIGGER health_unusual_activity_trigger
  AFTER INSERT ON health_data
  FOR EACH ROW EXECUTE FUNCTION trigger_unusual_activity_detection();

-- Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_unusual_activities_updated_at
  BEFORE UPDATE ON unusual_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
