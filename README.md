# Vital Forge Mobile

React Native mobile app for Vital Forge fitness tracking.

## Getting started (Mac)

For a full local development guide—required software (Node, Xcode, Android Studio), links, and how to run on iOS Simulator, Android Emulator, device, or web—see **[GETTING_STARTED.md](./GETTING_STARTED.md)**.

## Quick setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure API URL** (in `.env`):
   - Set `EXPO_PUBLIC_API_URL` (e.g. to staging or your local Rails server)

3. **Run the app**:
   ```bash
   npm start
   ```
   Then press **`i`** (iOS Simulator), **`a`** (Android Emulator), or **`w`** (web), or scan the QR code with Expo Go on your phone.

4. **Optional**: If you see a missing module for AsyncStorage, run:
   ```bash
   npm install @react-native-async-storage/async-storage
   ```

## Project Structure

```
src/
├── store/              # Redux store configuration
├── features/           # Feature-based modules (auth, workouts, templates)
│   ├── auth/
│   ├── workouts/
│   └── templates/
├── lib/
│   └── api/           # API base query (JWT + CSRF handling)
├── navigation/        # (Future) Navigation config
├── components/        # Shared UI components
└── types/            # TypeScript types

app/                   # Expo Router screens
├── index.tsx         # Welcome/splash screen
├── login.tsx         # Login screen
└── home.tsx          # Home screen
```

## Current Features

- ✅ Login screen with API connectivity
- ✅ JWT token storage (AsyncStorage)
- ✅ Redux Toolkit + RTK Query setup
- ✅ Auth API integration
- 🚧 Workout templates (API ready)
- 🚧 Workout logger
- 🚧 History view

## Next Steps

1. Test login flow with staging API
2. Build workout template selection screen
3. Build workout logger with set tracking
4. Add workout completion summary

## API

Uses same Rails API as web app:
- Staging: https://api-staging.forge-fitness-journal.app
- Endpoints: /api/v1/mobile/*

## Testing

Login with your existing account or create one on the web app first.
