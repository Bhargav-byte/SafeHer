# 🗄️ Fixed Supabase Database Setup SQL

## ✅ **Corrected SQL Code:**

Copy and paste this **corrected SQL** into your Supabase SQL Editor:

```sql
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

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

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

-- Create indexes for sos_events
CREATE INDEX idx_sos_events_user_id ON sos_events(user_id);
CREATE INDEX idx_sos_events_created_at ON sos_events(created_at);

-- Enable RLS for sos_events
ALTER TABLE sos_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sos_events (FIXED - removed IF NOT EXISTS)
CREATE POLICY "Users can view sos events" ON sos_events
  FOR SELECT USING (true);

CREATE POLICY "Users can insert sos events" ON sos_events
  FOR INSERT WITH CHECK (true);

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
```

## 🔧 **What Was Fixed:**

### **❌ Original Error:**
```sql
CREATE POLICY IF NOT EXISTS "Users can view own sos events" ON sos_events
```
- `IF NOT EXISTS` is **not supported** for `CREATE POLICY` statements

### **✅ Fixed Version:**
```sql
CREATE POLICY "Users can view sos events" ON sos_events
```
- Removed `IF NOT EXISTS` clause
- Simplified policy names to avoid conflicts

## 🚀 **Steps to Fix:**

1. **Go to Supabase Dashboard** → SQL Editor
2. **Copy the corrected SQL above**
3. **Paste and run it**
4. **Create storage bucket** (if not done already):
   - Go to **Storage** → **Create Bucket**
   - Name: `sos-evidence`
   - Public: ✅ Yes
5. **Test your app** - the loading issue should be resolved!

## 🎯 **Expected Result:**

After running this SQL, you should see:
- ✅ `user_profiles` table created
- ✅ `sos_events` table created  
- ✅ Proper RLS policies set up
- ✅ App stops infinite loading loop
- ✅ Login redirect works properly

**This corrected SQL will fix the syntax error and create all required tables! 🎉**
