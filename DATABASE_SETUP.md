# 🗄️ Supabase Database Setup Guide

## ✅ **Current Status:**

### **✅ What's Working:**
- Supabase project is connected ✅
- Authentication is configured ✅
- App code is ready ✅
- Backend server is running ✅

### **⚠️ What Needs Setup:**
- Database tables need to be created
- Storage bucket needs to be created
- RLS policies need to be set up

## 🔧 **Required Database Setup:**

### **1. Create Required Tables**

Go to your Supabase project → **SQL Editor** and run this SQL:

```sql
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

-- Create policy for sos_events
CREATE POLICY "Allow all operations on sos_events" ON sos_events
FOR ALL USING (true);

-- Create user_profiles table for onboarding
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

-- Create indexes for user_profiles
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);

-- Enable RLS for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

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

### **2. Create Storage Bucket**

Go to **Storage** → **Create Bucket**:
- **Name**: `sos-evidence`
- **Public**: ✅ Yes
- **File size limit**: 50MB
- **Allowed MIME types**: `audio/*`

### **3. Create Storage Policies**

In **SQL Editor**, run:

```sql
-- Create storage policies for audio uploads
CREATE POLICY "Allow audio uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'sos-evidence');

CREATE POLICY "Allow audio downloads" ON storage.objects
FOR SELECT USING (bucket_id = 'sos-evidence');
```

## 🧪 **Test Your Setup:**

### **1. Test Authentication**
1. Start your app: `npx expo start`
2. Try to sign up with a new email
3. Check if you receive verification email

### **2. Test Onboarding**
1. Complete the 3-step onboarding flow
2. Check if data is saved to `user_profiles` table

### **3. Test SOS Features**
1. Try the SOS button
2. Check if data is saved to `sos_events` table

## 🔍 **Verify Setup:**

After running the SQL, you should see these tables in your Supabase dashboard:

- ✅ `sos_events` - For SOS event tracking
- ✅ `user_profiles` - For user onboarding data
- ✅ `profiles` - Your existing table (can be kept)

## 🚀 **Next Steps:**

1. **Run the SQL** in Supabase SQL Editor
2. **Create storage bucket** manually
3. **Test the app** with authentication flow
4. **Verify data** is being saved correctly

## 📱 **Your App Will Then Have:**

- ✅ Complete authentication system
- ✅ 3-step onboarding flow
- ✅ SOS event tracking
- ✅ Audio file storage
- ✅ User profile management
- ✅ Emergency contact storage

**Once you complete this setup, your Women Safety app will be fully functional! 🎉**
