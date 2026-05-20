# Feature Spec: 010 — Password Reset

**Branch**: `010-password-reset` | **Date**: 2026-05-16  
**Priority**: MVP Blocker  

## Overview

Users who forget their password have no recovery path today. This feature adds a standard forgot-password / reset-password flow: user enters their email, receives a reset link, taps it to open the app, sets a new password.

The Rails backend already has the token infrastructure (`password_reset_token`, `password_reset_sent_at`, `generate_password_reset_token!`, `password_reset_expired?`) and Action Mailer configured for dev (MailCatcher on localhost:1025). The Expo app already has a deep-link scheme registered (`vitalforgemobilev1`). This feature wires them together.

**Production SMTP decision required before launch.** See "Open Questions" below.

---

## User Stories

### US1 — Request a password reset email (P1)

**As a** user who has forgotten my password,  
**I want to** tap "Forgot your password?" on the login screen and enter my email,  
**So that** I receive an email with a link to reset my password.

**Acceptance criteria:**
- Login screen has a "Forgot your password?" pressable link below the login button
- Tapping it navigates to `app/forgot-password.tsx`
- Screen has a single email input and a "Send Reset Link" button
- On submit, `POST /api/v1/mobile/auth/forgot_password` is called with `{ email }`
- Whether the email exists or not, the UI shows the same success message: "If that address is registered, a reset link is on its way." (prevents user enumeration)
- Button is disabled and shows a loading indicator while the request is in-flight
- On network error, inline error shown and button re-enables
- "Back to login" link visible at bottom

### US2 — Set a new password via deep link (P1)

**As a** user who has tapped the reset link in my email,  
**I want to** land on a "Reset Password" screen inside the app,  
**So that** I can set a new password and regain access.

**Acceptance criteria:**
- Email link format: `vitalforgemobilev1://reset-password?token=<token>`
- Tapping the link opens `app/reset-password.tsx` with `token` available via `useLocalSearchParams()`
- Screen has two fields: "New password" and "Confirm password" — both with `secureTextEntry` and a show/hide toggle icon
- **Client-side validation (runs before any API call):**
  - Password must be at least 8 characters — inline error shown under the field
  - Passwords must match — inline error shown under the confirmation field
  - Submit button remains disabled until both fields are non-empty
- On valid submit, calls `POST /api/v1/mobile/auth/reset_password` with `{ token, password, password_confirmation }`
- On success: navigate to `/login` with params `{ resetSuccess: '1' }`; login screen shows a one-time banner: "Password updated — please log in."
- On expired/invalid token: inline error "This reset link has expired or is invalid." with a "Request a new link" button that navigates to `/forgot-password`
- On server validation error: inline error beneath the relevant field
- On network error: inline error, button re-enables, field values preserved
- Button disabled and spinner while in-flight

### US3 — Guard against missing or malformed token (P1)

**As a** user who navigates to `/reset-password` without a valid token param,  
**I want to** be redirected safely,  
**So that** the app never shows a broken or stuck screen.

**Acceptance criteria:**
- If `token` param is absent or empty on mount, immediately redirect to `/forgot-password`
- No broken UI flashes before the redirect

---

## Security Requirements

- Forgot-password response is always identical regardless of whether email exists
- Token cleared from DB immediately after successful reset (prevents link reuse)
- Token also cleared when found but expired (prevents repeated probing)
- Client-side password validation (min 8 chars, match) runs before API call — server validation is the authoritative fallback, not the first line of defence
- Token travels only in the deep-link URL and the API request body — never stored on device

---

## Open Questions

**Production SMTP provider**: `config/environments/production.rb` has no SMTP configured. Must choose before staging/production launch:
- **SendGrid**: free tier 100 emails/day, simple API key setup in Rails credentials
- **Mailgun**: free tier 5,000 emails/month, good deliverability
- **AWS SES**: cheapest at scale ($0.10/1,000), requires more setup (domain verification, IAM)

For MVP, SendGrid or Mailgun are the fastest path. Recommendation: SendGrid (simplest Rails integration, widely documented).

---

## Out of Scope

- SMS / OTP code flow
- Social/OAuth password reset  
- Force-logout of other sessions on password change
- Rate limiting on the API endpoint (add Rack::Attack post-MVP)
- Universal links (HTTPS scheme) — custom scheme is sufficient for MVP
