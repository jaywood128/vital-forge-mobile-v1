# Data Model: 010 — Password Reset

## No new entities or migrations required

The Rails backend already has all necessary columns on the `users` table and all necessary model methods on `User`. This feature requires no schema changes.

---

## Existing fields used (users table)

| Column | Type | Notes |
|--------|------|-------|
| `password_reset_token` | string | `SecureRandom.urlsafe_base64`, unique-indexed, nullable. Set by `generate_password_reset_token!`, cleared on successful reset. |
| `password_reset_sent_at` | datetime | Timestamp of when token was generated. Used by `password_reset_expired?` to enforce 2-hour expiry. |

## Existing model methods used (User)

| Method | Behaviour |
|--------|-----------|
| `generate_password_reset_token!` | Generates a new `SecureRandom.urlsafe_base64` token, sets `password_reset_sent_at = Time.current`, saves. |
| `password_reset_expired?` | Returns `true` if `password_reset_sent_at` is older than 2 hours. |

## Token lifecycle

```
[User requests reset]
  → generate_password_reset_token! → token saved, email sent

[User taps link]
  → find_by(password_reset_token: token)
  → password_reset_expired? check
  → user.update(password:, password_confirmation:)
  → clear token columns (update_columns)

[Token states]
  nil          → no active reset request
  present      → reset pending (may or may not be expired)
  nil (cleared) → reset completed
```

---

## Mobile state (no persistence)

The token travels only as a URL param — from the deep link into `useLocalSearchParams()` on `app/reset-password.tsx`. It is never stored locally on the device.

RTK Query mutations added to `src/features/auth/authApi.ts`:
- `forgotPassword(email: string)` → `POST /api/v1/mobile/auth/forgot_password`
- `resetPassword({ token, password, password_confirmation })` → `POST /api/v1/mobile/auth/reset_password`
