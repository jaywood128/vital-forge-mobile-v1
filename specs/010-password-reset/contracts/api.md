# API Contracts: 010 — Password Reset

Base path: `/api/v1/mobile/auth`  
Auth: none required (unauthenticated endpoints)  
Content-Type: `application/json`

---

## POST /api/v1/mobile/auth/forgot_password

Initiates the password reset flow. Always returns 200 regardless of whether the email exists (prevents user enumeration).

### Request

```json
{
  "email": "user@example.com"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| email | string | yes | format check server-side; not required to exist |

### Response — 200 OK (always)

```json
{
  "message": "If that address is registered, a reset link is on its way."
}
```

### Response — 422 Unprocessable Entity (malformed request only)

```json
{
  "error": "Email is required."
}
```

### Side effects

- If email matches a user: calls `generate_password_reset_token!`, enqueues `UserMailer.password_reset(user).deliver_later`
- If email does not match: no side effect, same response

---

## POST /api/v1/mobile/auth/reset_password

Validates the token and updates the user's password.

### Request

```json
{
  "token": "abc123urlsafebase64token",
  "password": "newSecurePassword1",
  "password_confirmation": "newSecurePassword1"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| token | string | yes | must match an unexpired `password_reset_token` |
| password | string | yes | min 8 characters (Devise validatable default) |
| password_confirmation | string | yes | must match password |

### Response — 200 OK

```json
{
  "message": "Password updated successfully."
}
```

### Response — 422 Unprocessable Entity (invalid/expired token)

```json
{
  "error": "Reset link is invalid or has expired."
}
```

### Response — 422 Unprocessable Entity (validation failure)

```json
{
  "errors": ["Password is too short (minimum is 8 characters)", "Password confirmation doesn't match Password"]
}
```

### Side effects

On success:
- User password is updated
- `password_reset_token` and `password_reset_sent_at` cleared to `nil`
- No JWT is issued — user must log in after reset

---

## Deep Link Contract

Email contains a link in the format:

```
vitalforgemobilev1://reset-password?token=<password_reset_token>
```

Expo Router 6 routes this to `app/reset-password.tsx`. The token is available via:

```typescript
const { token } = useLocalSearchParams<{ token: string }>();
```

The token is passed directly in the `reset_password` API call body. It is never stored on device.
