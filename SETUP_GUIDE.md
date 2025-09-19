
# SafeHer - Setup Instructions

## 🚨 IMPORTANT: Database Setup Required

Your Supabase project is configured but needs the database schema. Please follow these steps:

### 1. Create Database Tables

Go to your Supabase project dashboard → SQL Editor and run this SQL:

```sql
-- Create sos_events table for SafeHer app
CREATE TABLE sos_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT NOW(),
  user_id TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  audio_url TEXT,
  is_live_tracking BOOLEAN DEFAULT FALSE
);

-- Create indexes for performance
CREATE INDEX idx_sos_events_user_id ON sos_events(user_id);
CREATE INDEX idx_sos_events_created_at ON sos_events(created_at);

-- Enable Row Level Security
ALTER TABLE sos_events ENABLE ROW LEVEL SECURITY;

-- Create policy for testing (allow all operations)
CREATE POLICY "Allow all operations on sos_events" ON sos_events
FOR ALL USING (true);
```

### 2. Create Storage Bucket

Go to Storage → Create Bucket:
- **Name**: `sos-evidence`
- **Public**: ✅ Yes
- **File size limit**: 50MB
- **Allowed MIME types**: `audio/*`

### 3. Update API URL

In `App.tsx`, update the API_BASE_URL to your computer's IP address:

```typescript
// Find your IP address:
// Windows: ipconfig
// Mac/Linux: ifconfig

const API_BASE_URL = 'http://YOUR_IP_ADDRESS:3000';
```

### 4. Start the Backend

```bash
cd backend
node server.js
```

You should see:
```
Server running on port 3000
```

### 5. Start the Frontend

```bash
npx expo start
```

Scan QR code with Expo Go app.

## ✅ Testing the App

1. **SOS Button**: Tap → Should send location to backend
2. **Live Tracking**: Toggle → Should send location every 15s
3. **Check-In Timer**: Set minutes → Should auto-SOS if not cancelled
4. **Audio Recording**: Should work on iOS/Android
5. **Event History**: Should show past SOS events

## 🔧 Troubleshooting

### Network Error
- Check if backend is running on port 3000
- Verify IP address in App.tsx
- Ensure phone and computer are on same WiFi

### Audio Recording Error
- Grant microphone permissions
- Audio setup is now configured in the app

### Database Error
- Ensure Supabase tables are created
- Check Supabase credentials in config.js

## 📱 Current Status

✅ Backend server running with Supabase config  
✅ Frontend with all features implemented  
✅ Audio recording fixed for iOS  
✅ Demo mode fallback if database not ready  
⏳ Database schema needs to be created  
⏳ Storage bucket needs to be created  

Once you complete the database setup, the app will be fully functional!
