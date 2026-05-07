s# Contract: Mobile Signup API

**Phase**: 1 | **Plan**: [plan.md](../plan.md) | **Date**: 2026-02-06

## Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| URL | `/api/v1/mobile/signup` |
| Content-Type | `application/json` |
| Authentication | None required (public endpoint) |
| Controller | `Api::V1::Mobile::UsersController#create` |

## Request

### Headers

```
Content-Type: application/json
```

### Body

```json
{
  "user": {
    "email": "jane.doe@example.com",
    "password": "SecurePassword123",
    "password_confirmation": "SecurePassword123",
    "first_name": "Jane",
    "last_name": "Doe",
    "phone_number": "555-123-4567"
  }
}
```

### Field Constraints (server-side)

| Field | Required | Constraints |
|---|---|---|
| `user.email` | Yes | Unique; valid email format |
| `user.password` | Yes | Minimum 6 characters (Rails default Devise) |
| `user.password_confirmation` | Yes | Must match `password` |
| `user.first_name` | Yes | Non-empty string |
| `user.last_name` | Yes | Non-empty string |
| `user.phone_number` | Yes | Permitted by strong parameters |

## Response

### Success — 201 Created

```json
{
  "data": {
    "user": {
      "id": 42,
      "email": "jane.doe@example.com",
      "first_name": "Jane",
      "last_name": "Doe",
      "full_name": "Jane Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo0Mn0.abc123",
    "expires_at": "2026-03-08T00:00:00.000Z",
    "message": "Account created successfully"
  }
}
```

### Error — 422 Unprocessable Entity

```json
{
  "error": "Email has already been taken"
}
```

### Error — 422 (password mismatch, should not occur with client-side guard)

```json
{
  "error": "Password confirmation doesn't match Password"
}
```

## Client Handling

The RTK Query mutation in `src/features/auth/authApi.ts`:

```typescript
signup: builder.mutation<
  MobileAuthResponse['data'],
  {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    password_confirmation?: string;
  }
>({
  query: (userData) => ({
    url: '/api/v1/mobile/signup',
    method: 'POST',
    body: { user: userData },
  }),
  transformResponse: (response: MobileAuthResponse) => response.data,
})
```

On success:
1. Store `result.token` in SecureStore under key `'authToken'`
2. Call `router.replace('/home')`

On error:
- `Alert.alert('Signup Failed', error?.data?.error || 'Could not create account')`

## Environment

The base URL is read from `EXPO_PUBLIC_API_URL` in `.env`. The `baseQuery` in `src/lib/api/baseQuery.ts` prepends this to all request URLs.
