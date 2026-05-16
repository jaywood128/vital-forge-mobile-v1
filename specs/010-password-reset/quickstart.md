# Quickstart / Test Scenarios: 010 — Password Reset

End-to-end scenarios for manual QA and as the basis for integration tests.

---

## Dev Tools

**Fire a deep link on the iOS simulator** (paste token from MailCatcher URL):
```bash
xcrun simctl openurl booted "vitalforgemobilev1://reset-password?token=PASTE_TOKEN_HERE"
```

**Fire a deep link on Android emulator:**
```bash
adb shell am start -a android.intent.action.VIEW -d "vitalforgemobilev1://reset-password?token=PASTE_TOKEN_HERE"
```

**Test the no-token guard (Scenario 6):**
```bash
xcrun simctl openurl booted "vitalforgemobilev1://reset-password"
```

**View emails in MailCatcher** (dev only — must be running):
```bash
open http://localhost:1080
```

**Expire a token manually in Rails console:**
```ruby
user = User.find_by(email: 'test@example.com')
user.update_columns(password_reset_sent_at: 3.hours.ago)
```

---

## Scenario 1 — Happy path (full reset)

1. Open app → Login screen → tap "Forgot your password?"
2. Enter a valid registered email → tap "Send Reset Link"
3. UI shows: "If that address is registered, a reset link is on its way."
4. Open email client → receive email with reset link
5. Tap link → app opens at Reset Password screen (token pre-filled via URL param)
6. Enter new password + confirmation → tap "Reset Password"
7. UI navigates to Login screen with banner: "Password updated — please log in"
8. Log in with new password → success

**Key assertions:**
- Button disabled during submit
- Same success message regardless of email existence
- Token cleared after reset (second use of same link fails)

---

## Scenario 2 — Unknown email (security: no enumeration)

1. Forgot password screen → enter email that does not exist
2. Tap "Send Reset Link"
3. **Expected:** Same success message as Scenario 1 — no indication whether email exists
4. No email received

---

## Scenario 3 — Expired token

1. Request a reset link
2. Wait 2+ hours (or manually expire via `user.update_columns(password_reset_sent_at: 3.hours.ago)` in Rails console)
3. Tap the link
4. **Expected:** Reset Password screen shows: "This reset link has expired or is invalid. Please request a new one."
5. Tapping "Request new link" navigates back to Forgot Password screen

---

## Scenario 4 — Password validation failure

1. Complete Scenario 1 up to step 6
2. Enter password "abc" (too short) → tap "Reset Password"
3. **Expected:** Inline error: "Password is too short (minimum is 8 characters)"
4. Enter password "newpass1" + confirmation "newpass2" (mismatch)
5. **Expected:** Inline error: "Password confirmation doesn't match"

---

## Scenario 5 — Token reuse (already used link)

1. Complete a full reset (Scenario 1)
2. Go back to email, tap the same link again
3. **Expected:** "This reset link has expired or is invalid." error — token was cleared on first use

---

## Scenario 6 — Navigate to reset-password with no token

1. Manually navigate to `vitalforgemobilev1://reset-password` (no token param)
2. **Expected:** Immediate redirect to `/forgot-password` — no broken screen shown

---

## Scenario 7 — Network error on forgot-password submit

1. Disable device network
2. Enter email → tap "Send Reset Link"
3. **Expected:** Button re-enables, inline error: "Something went wrong. Please check your connection and try again."

---

## Scenario 8 — Network error on reset-password submit

1. Get a valid link, open Reset Password screen
2. Disable network → enter passwords → tap "Reset Password"
3. **Expected:** Button re-enables, inline error shown, fields retain entered values
