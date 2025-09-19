# 🗄️ Safe Database Setup SQL (Handles Existing Tables)

## ✅ **Modified SQL Code for Existing Database:**

Since `sos_events` already exists, use this **safe SQL** that only creates what's missing:

```sql
-- Create user_profiles table for onboarding data (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS user_profiles (
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

-- Create indexes for user_profiles (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);

-- Enable Row Level Security for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at (if not exists)
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

## 🔧 **What This Safe SQL Does:**

### **✅ Safe Operations:**
- Uses `CREATE TABLE IF NOT EXISTS` to avoid conflicts
- Uses `CREATE INDEX IF NOT EXISTS` for indexes
- Uses `DROP POLICY IF EXISTS` before creating policies
- Uses `DROP TRIGGER IF EXISTS` before creating triggers
- Uses `CREATE OR REPLACE FUNCTION` for functions

### **🎯 Only Creates Missing Tables:**
- ✅ Creates `user_profiles` table (the missing one causing the error)
- ✅ Skips `sos_events` (already exists)
- ✅ Sets up proper RLS policies
- ✅ Creates necessary indexes and triggers

## 🚀 **Steps to Fix:**

1. **Go to Supabase Dashboard** → SQL Editor
2. **Copy the safe SQL above**
3. **Paste and run it**
4. **Check if storage bucket exists**:
   - Go to **Storage** → Check if `sos-evidence` bucket exists
   - If not, create it: Name `sos-evidence`, Public ✅ Yes
5. **Test your app** - the loading issue should be resolved!

## 🎯 **Expected Result:**

After running this safe SQL:
- ✅ `user_profiles` table created (the missing one!)
- ✅ `sos_events` table left untouched (already exists)
- ✅ Proper RLS policies set up
- ✅ App stops infinite loading loop
- ✅ Login redirect works properly

**This safe SQL will only create what's missing and won't conflict with existing tables! 🎉**
