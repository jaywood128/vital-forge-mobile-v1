# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Rails API (run from ../vital-forge-v1)
# -b 0.0.0.0 required — makes the server reachable from a physical phone on the same Wi-Fi
bin/rails server -b 0.0.0.0 -p 3000

# Expo (run from this directory)
npx expo start          # Scan QR code with Expo Go on phone
npx expo start --ios    # Run on iOS simulator
npx expo start --android # Run on Android emulator

# Linting
npm run lint            # Run ESLint (Expo flat config)

# Tests
npx jest --no-coverage  # Run all tests

# Reset
npm run reset-project   # Reset to boilerplate (destructive)
```

Physical device setup: phone and Mac must be on the same Wi-Fi. `EXPO_PUBLIC_API_URL` in `.env` must match the Mac's local IP (`ipconfig getifaddr en0`). Current value: `http://192.168.1.159:3000`.

There are no test commands configured in package.json. Expo's built-in tooling handles builds (EAS Build for production).

## Environment

Copy `.env` and set `EXPO_PUBLIC_API_URL` to your Rails API server:
- Local dev: `http://<your-local-ip>:3000`
- Staging: `https://api-staging.forge-fitness-journal.app`

## Architecture

**Stack:** Expo SDK 54 + Expo Router (file-based routing) + Redux Toolkit + RTK Query + custom theme system. No external UI component library — all UI is hand-rolled with React Native `StyleSheet`.

### Routing (Expo Router)

`app/` is file-based routing:
- `app/_layout.tsx` — Root layout: wraps the app in Redux `Provider` and React Navigation `ThemeProvider`, defines the `Stack` with all screen routes
- `app/index.tsx` → `/` — Welcome/splash
- `app/login.tsx` → `/login`
- `app/signup.tsx` → `/signup`
- `app/home.tsx` → `/home` — Protected dashboard
- `app/(tabs)/` — Empty tab group, scaffolded for future tab navigation

### State Management & API (RTK Query)

All API state lives in three RTK Query slices under `src/features/`:
- `auth/authApi.ts` — login, signup, getCurrentUser, logout
- `workouts/workoutsApi.ts` — startWorkout, logSet, completeWorkout, getWorkouts
- `templates/templatesApi.ts` — getTemplates, getTemplate

Combined in `src/store/store.ts`. Import hooks directly from feature files (e.g., `useLoginMutation` from `src/features/auth/authApi`).

### Base Query & Auth (`src/lib/api/baseQuery.ts`)

Every API request:
1. Reads JWT from `AsyncStorage` (key: `authToken`) before each call
2. Injects `Authorization: Bearer <token>` header
3. Sets `Accept: application/json` and `Content-Type: application/json`

Mobile endpoints are at `/api/v1/mobile/...` and skip CSRF. Token is stored on login and removed on logout — no Redux-Persist, managed manually.

### UI Components (`src/components/ui/`)

Four primitives exported from `src/components/ui/index.ts`:
- `Screen` — padding wrapper, optional background color
- `Card` — white card with border, radius, shadow
- `Button` — 3 variants: `primary` (orange), `secondary` (blue outline), `destructive` (red outline)
- `TextField` — TextInput with focus border highlight

### Design System (`src/theme/`)

All token files re-exported from `src/theme/index.ts`:
- `colors.ts` — electric blue (`#4A90D9`), energetic orange (`#F5A623`), deep navy, fresh green, neutrals
- `spacing.ts` — 8-point scale: `xs`=4, `sm`=8, `md`=16, `lg`=24, `xl`=32, `xxl`=40, `touchMin`=44
- `typography.ts` — `title`, `subtitle`, `body`, `caption`, `link`, `button`, `label`, `error` styles
- `radius.ts` — `sm`=8, `md`=10, `lg`=12, `card`=16
- `shadows.ts` — platform-specific (iOS `shadowColor`/`shadowOpacity`, Android `elevation`)

### Conventions

- `StyleSheet.create()` + theme tokens for all styling; use style arrays `[styles.base, dynamicStyle, propStyle]`
- `Alert.alert()` for user-facing errors; access error data as `error?.data?.error`
- RTK Query `invalidatesTags` for cache invalidation — tags: `Auth`, `User`, `Workouts`, `ActiveWorkout`, `Templates`
- Path alias `@/*` maps to project root (configured in `tsconfig.json`)

## Active Technologies
- TypeScript 5.9 strict, React Native 0.81 + Expo SDK 54, Expo Router 6, Redux Toolkit + RTK Query, expo-secure-store, expo-linear-gradient, `src/components/ui/` primitives (Card, Button, TextField), `src/theme/` tokens (001-user-registration)
- JWT in expo-secure-store (authToken key); user data persisted on Rails API backend (001-user-registration)
- Ruby 3.x / Rails 7.x (backend) · TypeScript 5.9 strict / React Native 0.81 (mobile) + RTK Query, Expo Router 6, expo-secure-store, StyleSheet + src/theme tokens (004-start-workout)
- PostgreSQL (backend) · No local storage changes (mobile) (004-start-workout)
- TypeScript 5.9 stric + RTK Query (existing), expo-linear-gradient (existing), expo-router 6 (existing) (007-workout-history)
- N/A — read-only; no local storage changes (007-workout-history)
- TypeScript 5.9 strict (mobile) / Ruby 3.x + Rails 7.x (backend) + Expo Router 6, RTK Query, expo-secure-store (existing); Action Mailer (Rails, needs SMTP config) (010-password-reset)
- No new storage. Token lives in `users` table (existing columns). Token is not stored on device. (010-password-reset)

## Recent Changes
- 001-user-registration: Added TypeScript 5.9 strict, React Native 0.81 + Expo SDK 54, Expo Router 6, Redux Toolkit + RTK Query, expo-secure-store, expo-linear-gradient, `src/components/ui/` primitives (Card, Button, TextField), `src/theme/` tokens
