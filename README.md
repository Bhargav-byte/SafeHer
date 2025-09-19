# SafeHer - Women Safety App

A React Native (Expo) app with Node.js backend for women's safety featuring SOS functionality, live tracking, and emergency features.

## Tech Stack

- **Frontend**: React Native (Expo Go)
- **Backend**: Node.js + Express
- **Database**: Supabase (Postgres + Storage)
- **Auth**: Test user ID (no OTP required)

## Features

- 🚨 **SOS Button**: Send emergency location + 10s audio recording
- 📍 **Live Tracking**: Share location every 15 seconds
- ⏰ **Check-In Timer**: Auto-SOS if not checked in within specified time
- 📱 **Audio Recording**: Evidence collection during emergencies
- 📊 **Event History**: View past SOS events

## Setup Instructions

### 1. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `backend/supabase-schema.sql`
3. Create a storage bucket named `sos-evidence` (public)
4. Get your project URL and anon key from Settings > API

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=3000
```

Start the backend server:
```bash
npm start
```

The server will run on `http://localhost:3000`

### 3. Frontend Setup

```bash
# Install dependencies (already done)
npm install

# Start Expo development server
npx expo start
```

Scan the QR code with Expo Go app on your phone.

### 4. Configuration

Update the `API_BASE_URL` in `App.tsx` to match your backend URL:
```typescript
const API_BASE_URL = 'http://your-backend-url:3000';
```

For testing on physical device, use your computer's IP address:
```typescript
const API_BASE_URL = 'http://192.168.1.100:3000';
```

## API Endpoints

- `POST /sos` - Send SOS event with location
- `POST /sos/audio` - Upload audio file for SOS event
- `GET /sos/:user_id` - Get SOS events for user
- `POST /live-tracking` - Save live tracking location
- `GET /contacts` - Get emergency contacts
- `GET /health` - Health check

## Usage

1. **SOS Emergency**: Tap the red SOS button to send your location and record 10 seconds of audio
2. **Live Tracking**: Toggle to share your location every 15 seconds
3. **Check-In Timer**: Set a timer (e.g., 10 minutes) - if you don't check in, SOS will be sent automatically
4. **View History**: See your recent SOS events with locations and audio recordings

## Permissions Required

- Location (foreground)
- Microphone (for audio recording)
- Storage (for saving recordings)

## Testing

The app uses a test user ID (`test_user_123`) so no authentication is required. Emergency contacts are hardcoded in the backend for testing purposes.

## Production Considerations

- Implement proper authentication (OTP/SMS)
- Add real emergency contact management
- Implement push notifications
- Add background location tracking
- Enhance security and privacy features
- Add incident reporting and evidence management

## File Structure

```
SafeHer/
├── App.tsx                 # Main Expo app
├── backend/
│   ├── server.js          # Node.js Express server
│   ├── supabase-schema.sql # Database schema
│   └── package.json       # Backend dependencies
└── package.json           # Frontend dependencies
```
