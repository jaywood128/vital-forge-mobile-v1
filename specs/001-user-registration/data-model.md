# Data Model: User Registration

**Phase**: 1 | **Plan**: [plan.md](./plan.md) | **Date**: 2026-02-06

## Entities

### UserAccount

Represents a registered person in the system. Created at the point of successful registration.

| Field | Type | Constraints | Source |
|---|---|---|---|
| `id` | integer | Auto-assigned by backend | Server |
| `email` | string | Required; unique; must contain `@` | Client + Server |
| `first_name` | string | Required; non-empty | Client |
| `last_name` | string | Required; non-empty | Client |
| `phone_number` | string | Required; 10–15 digits; chars: `0-9 \s - ( ) +` | Client + Server |
| `password` | string | Required; must match `password_confirmation` | Client (match) + Server (storage) |
| `password_confirmation` | string | Required; must equal `password` | Client only |
| `token` | string | JWT; issued by server on success; stored in SecureStore | Server → SecureStore |
| `expires_at` | string (ISO8601) | Optional; returned by API; not currently used by client | Server |

### Validation Rules

| Field | Rule | Enforcement | Error Message |
|---|---|---|---|
| first_name | Non-empty | Client (Alert) | "Please fill all fields" |
| last_name | Non-empty | Client (Alert) | "Please fill all fields" |
| email | Non-empty | Client (Alert) | "Please fill all fields" |
| email | Valid format | Server only | surfaced via `error.data.error` in catch Alert |
| email | Unique | Server only | surfaced via `error.data.error` in catch Alert |
| phone_number | Non-empty | Client (Alert) | "Phone number is required" |
| phone_number | 10–15 digits | Client (inline) | "Enter at least 10 digits (e.g. 555-123-4567)" |
| phone_number | Allowed chars only | Client (strip-on-type) | Characters silently removed as user types |
| password | Non-empty | Client (Alert) | "Please fill all fields" |
| password_confirmation | Non-empty | Client (Alert) | "Please fill all fields" |
| password_confirmation | Equals password | Client (inline) | "Passwords do not match" |

### State Transitions

```
[Unauthenticated] 
  → user fills form → [Form filling]
  → user taps Sign Up → [Validating locally]
    → validation fails → [Form filling] (inline errors shown)
    → validation passes → [Submitting to API]
      → API error → [Form filling] (Alert shown)
      → API success → [Authenticated]
        → JWT stored in SecureStore
        → router.replace('/home')
        → [Home screen]
```

## Client-Side State (React useState)

| State variable | Type | Purpose |
|---|---|---|
| `firstName` | `string` | Controlled input value |
| `lastName` | `string` | Controlled input value |
| `email` | `string` | Controlled input value |
| `phoneNumber` | `string` | Controlled input value (after char-stripping) |
| `phoneError` | `string \| null` | Inline error message below phone field |
| `password` | `string` | Controlled input value |
| `passwordConfirmation` | `string` | Controlled input value |
| `confirmError` | `string \| null` | Inline error message below confirm field |
| `isLoading` | `boolean` | From RTK Query mutation; disables Sign Up button during API call |

## API Payload

POST `/api/v1/mobile/signup` body:

```json
{
  "user": {
    "email": "string",
    "password": "string",
    "password_confirmation": "string",
    "first_name": "string",
    "last_name": "string",
    "phone_number": "string"
  }
}
```

Response (success 201):

```json
{
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "Jane",
      "last_name": "Doe",
      "full_name": "Jane Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "expires_at": "2026-03-08T00:00:00Z",
    "message": "Account created successfully"
  }
}
```

Response (error 422 / 4xx):

```json
{
  "error": "Email has already been taken"
}
```
