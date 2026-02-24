# Quickstart: Testing User Registration

**Feature**: User Registration | **Branch**: `001-user-registration`

## Prerequisites

1. Rails API running locally: `cd vital-forge-v1 && bin/rails server` (default: `http://localhost:3000`)
2. `.env` in `vital-forge-mobile-v1/` with `EXPO_PUBLIC_API_URL=http://localhost:3000`
3. Expo dev server running: `npx expo start --clear`

## Running the App

```bash
cd vital-forge-mobile-v1
npx expo start --clear
```

- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app for physical device

## Manual Test Scenarios

### US1 — Successful Registration (P1)

1. Launch app → should open the login screen
2. Tap "Don't have an account? Sign Up" (or navigate to `/signup`)
3. Fill in all 6 fields with valid data:
   - First Name: `Jane`
   - Last Name: `Doe`
   - Email: `jane+test1@example.com` (unique address)
   - Phone: `555-123-4567`
   - Password: `TestPassword123`
   - Confirm Password: `TestPassword123`
4. Tap **Sign Up**
5. **Expected**: App navigates to Home screen; user is authenticated; login screen does not appear

### US2a — Password Mismatch (P2)

1. Navigate to `/signup`
2. Fill all fields, but enter `Password1` and `Password2` in the password fields
3. Tap **Sign Up**
4. **Expected**: Inline error below Confirm Password field reading "Passwords do not match"; no network call

### US2b — Short Phone Number (P2)

1. Navigate to `/signup`
2. Fill all fields; enter `555` in the phone field
3. Tap **Sign Up**
4. **Expected**: Inline error below phone field reading "Enter at least 10 digits (e.g. 555-123-4567)"; form does not submit

### US2c — Empty Field (P2)

1. Navigate to `/signup`
2. Leave Last Name empty; fill all other fields
3. Tap **Sign Up**
4. **Expected**: Alert "Please fill all fields"; form does not submit

### US2d — Phone Strips Invalid Characters (P2)

1. Navigate to `/signup`
2. Type `abc555def123ghijk` in the phone field
3. **Expected**: Field displays `555123` (non-numeric non-separator chars stripped in real time)

### US3 — Navigate to Login (P3)

1. Navigate to `/signup`
2. Tap "Already have an account? Log in"
3. **Expected**: Navigates to login screen (not dependent on back-stack history)

### AC-009 — Keyboard Accessibility (SC-004)

1. On a small device/simulator (e.g. iPhone SE)
2. Navigate to `/signup`
3. Tap the Confirm Password field (last field)
4. **Expected**: Keyboard appears and the Confirm Password field scrolls into view; Sign Up button is reachable by scrolling

### Edge Case — Duplicate Email

1. Register successfully with `jane@example.com`
2. Log out
3. Navigate to `/signup`; attempt to register again with the same email
4. **Expected**: Alert "Signup Failed" with message "Email has already been taken"

## Checking SecureStore Token

To verify the JWT is stored correctly (debug builds only):

```typescript
// Temporary debug log in app — remove before PR
import * as SecureStore from 'expo-secure-store';
const token = await SecureStore.getItemAsync('authToken');
console.log('authToken:', token ? 'present' : 'missing');
```

## API Verification

Test the endpoint directly with curl:

```bash
curl -X POST http://localhost:3000/api/v1/mobile/signup \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "email": "jane@example.com",
      "password": "TestPassword123",
      "password_confirmation": "TestPassword123",
      "first_name": "Jane",
      "last_name": "Doe",
      "phone_number": "555-123-4567"
    }
  }'
```

Expected response: `201` with `data.token` in body.
