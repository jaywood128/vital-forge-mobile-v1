# Getting Started & Local Development (Mac)

This guide gets you running the Vital Forge mobile app on your Mac—in the iOS Simulator, Android Emulator, on a physical device, or in the browser.

---

## 1. Software You Need

### Required

| Software | Purpose | Install |
|----------|---------|--------|
| **Node.js** (LTS, e.g. 20.x) | JavaScript runtime, npm | [nodejs.org](https://nodejs.org/) or [nvm](https://github.com/nvm-sh/nvm) |
| **npm** | Package manager (included with Node) | Comes with Node.js |
| **Git** | Clone the repo | [git-scm.com](https://git-scm.com/) or `xcode-select --install` |

### For iOS Simulator

| Software | Purpose | Install |
|----------|---------|--------|
| **Xcode** | iOS Simulator, build tools | [Mac App Store](https://apps.apple.com/app/xcode/id497799835) |
| **Xcode Command Line Tools** | Required for iOS toolchain | After Xcode: **Xcode → Settings → Locations** and select Command Line Tools, or run: `xcode-select --install` |

- **Docs**: [Expo – Run on iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)

### For Android Emulator

| Software | Purpose | Install |
|----------|---------|--------|
| **Android Studio** | Android SDK + Emulator | [developer.android.com/studio](https://developer.android.com/studio) |

After installing Android Studio:

1. Open **Android Studio → More Actions → Virtual Device Manager** (or **Tools → Device Manager**).
2. Create a virtual device (e.g. Pixel 6, API 34).
3. Ensure **Android SDK** is installed (Studio will prompt). You need at least one **Android SDK Platform** and **Android Virtual Device**.

- **Docs**: [Expo – Run on Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)

### For Physical Device (optional)

| Software | Purpose | Install |
|----------|---------|--------|
| **Expo Go** | Run the app on your phone without a full native build | [iOS App Store](https://apps.apple.com/app/expo-go/id982107779) · [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent) |

Your Mac and phone should be on the same Wi‑Fi network so the device can reach the Metro bundler.

---

## 2. Clone & Install

```bash
# From the repo root (or wherever you cloned)
cd vital-forge-mobile-v1

# Install dependencies
npm install
```

---

## 3. Environment (API URL)

The app talks to a backend API. Point it at your backend URL via environment variables.

1. **Copy the example env file** (if you have one):
   ```bash
   cp .env.example .env
   ```
   If there is no `.env.example`, create a `.env` file in the project root.

2. **Set the API URL** in `.env`:
   ```bash
   EXPO_PUBLIC_API_URL=https://api-staging.forge-fitness-journal.app
   ```
   For a local Rails server, use your machine’s IP or `http://localhost:3000` (and ensure your phone/emulator can reach it; `localhost` on the device is the device itself, not your Mac).

- **Docs**: [Expo – Environment variables](https://docs.expo.dev/guides/environment-variables/)

---

## 4. Run the App

Start the Expo dev server:

```bash
npm start
```

Or use the scripts from `package.json`:

```bash
npm run ios      # Start and open iOS Simulator
npm run android  # Start and open Android Emulator
npm run web      # Start and open in browser
```

### After `npm start`

A QR code and menu appear in the terminal. You can:

| Option | How |
|--------|-----|
| **iOS Simulator** | Press **`i`** in the terminal (requires Xcode + simulator installed). |
| **Android Emulator** | Press **`a`** (requires Android Studio + emulator created and running, or start an AVD first). |
| **Physical device** | Install **Expo Go**, then scan the QR code with your camera (iOS) or with Expo Go (Android). Same Wi‑Fi as your Mac required. |
| **Web** | Press **`w`** or run `npm run web`. |

First run may take a minute while the bundle and (for simulators) the app install.

---

## 5. Simulator & Device Quick Reference

### iOS Simulator

- **Open Simulator without starting the app**: **Xcode → Open Developer Tool → Simulator**, or run `open -a Simulator`.
- **Then** in the project run `npm start` and press **`i`**, or run `npm run ios`.
- **Docs**: [Expo – iOS Simulator](https://docs.expo.dev/workflow/ios-simulator/)

### Android Emulator

- Start an AVD from **Android Studio → Device Manager** (or start it from the command line).
- In the project run `npm start` and press **`a`**, or run `npm run android`.
- If no device is detected, confirm the emulator is running and that `adb devices` lists it.
- **Docs**: [Expo – Android Studio emulator](https://docs.expo.dev/workflow/android-studio-emulator/)

### Physical device (Expo Go)

1. Install **Expo Go** on your phone.
2. Ensure phone and Mac are on the same Wi‑Fi.
3. Run `npm start` and scan the QR code (iOS: Camera app; Android: Expo Go app).
4. If it can’t connect, try **tunnel** mode: `npx expo start --tunnel` (requires installing `@expo/ngrok` if prompted).

---

## 6. Useful Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server (then press `i` / `a` / `w`) |
| `npm run ios` | Start and open in iOS Simulator |
| `npm run android` | Start and open in Android Emulator |
| `npm run web` | Run in browser |
| `npx expo start --clear` | Start with cache cleared (use if things are stuck) |
| `npx expo start --tunnel` | Start with tunnel URL (for devices that can’t reach your Mac on LAN) |

---

## 7. Troubleshooting

- **“Command not found: npx” or “npm”**  
  Install Node.js (LTS) and ensure it’s on your `PATH` (or use nvm).

- **iOS Simulator doesn’t open or “No simulators found”**  
  Install Xcode from the App Store and open it once to accept the license. In Xcode, **Settings → Platforms** and install an iOS version. Then run `xcode-select -s /Applications/Xcode.app/Contents/Developer` if needed.

- **Android: “No Android devices found”**  
  Open Android Studio, create and start an AVD, then run `adb devices` to confirm it’s listed.

- **App can’t reach the API (login fails, network errors)**  
  - Check `EXPO_PUBLIC_API_URL` in `.env`.  
  - For a device/emulator, use your Mac’s LAN IP (e.g. `http://192.168.1.x:3000`) instead of `localhost` if the API runs on your Mac.  
  - Confirm the API is running and reachable (e.g. health endpoint in the browser).

- **Stale bundle or weird UI**  
  Run `npx expo start --clear` and reopen the app.

---

## 8. Documentation & References

- **Expo (SDK 54)**  
  - [Expo docs](https://docs.expo.dev/)  
  - [Expo Router](https://docs.expo.dev/router/introduction/)  
  - [Development builds / EAS](https://docs.expo.dev/develop/development-builds/introduction/) (when you need custom native code)
- **React Native**  
  - [React Native docs](https://reactnative.dev/docs/getting-started)
- **Project**  
  - `README.md` – overview and structure  
  - `SETUP.md` – quick setup checklist and next steps  

---

## Summary

1. Install **Node.js**, **Xcode** (for iOS), and optionally **Android Studio** (for Android) and **Expo Go** (for device).
2. **Clone** the repo, `cd vital-forge-mobile-v1`, run **`npm install`**.
3. Configure **`.env`** with **`EXPO_PUBLIC_API_URL`**.
4. Run **`npm start`**, then press **`i`** (iOS), **`a`** (Android), or **`w`** (web), or scan the QR code with Expo Go on your phone.
