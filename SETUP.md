# Quick Setup Instructions

## ✅ Completed
- Project structure created
- Boilerplate removed
- Redux store configured
- API layer set up (JWT + CSRF)
- Basic screens created (Welcome, Login, Home)

## 🎯 Next Steps

### 1. Install AsyncStorage (REQUIRED)
```bash
cd /Users/johnathonwood/dev/vital-forge-v1-combined-workspace/vital-forge-mobile-v1
npm install @react-native-async-storage/async-storage
```

### 2. Start the Development Server
```bash
npm start
```

### 3. Open on Your Device
- **iPhone**: Scan QR code with Camera app → Opens in Expo Go
- **Android**: Scan QR code with Expo Go app
- **Simulator**: Press `i` (iOS) or `a` (Android) in terminal

### 4. Test Login
- Use your existing account credentials
- Should connect to: `https://api-staging.forge-fitness-journal.app`

## 📱 What You'll See

1. **Welcome Screen** - "Vital Forge" with "Get Started" button
2. **Login Screen** - Email/password form
3. **Home Screen** - Shows logged-in user email

## 🔧 If Something Breaks

**"Module not found: @react-native-async-storage/async-storage"**
→ Run: `npm install @react-native-async-storage/async-storage`

**Login fails / API errors**
→ Check `.env` file has correct `EXPO_PUBLIC_API_URL`
→ Verify staging API is running: https://api-staging.forge-fitness-journal.app/api/v1/health

**App won't start**
→ Delete `node_modules` and run `npm install`
→ Clear Expo cache: `npx expo start --clear`
