# Feature Specification: Post-Registration Flow

**Feature Branch**: `002-post-reg-flow`
**Created**: 2026-02-06
**Last Updated**: 2026-02-24
**Status**: Draft

## Overview

When a user taps "Create Account" and registration succeeds, three things happen automatically — the user sees none of them:

1. The JWT returned by the API is stored securely on the device (`authToken` in SecureStore)
2. The goal type, training days, and difficulty level the user selected during browsing are POSTed to `user_preference` — saving their onboarding choices to their new account
3. The app navigates to the dashboard

That's it. The user goes from tapping "Create Account" to being on the dashboard, logged in, with their program ready — no confirmation screens, no extra steps.

**What gets saved automatically:**
- `primary_goal` — "physique" or "strength" (chosen on the Goal Type screen)
- `training_days_per_week` — 3, 4, 5, or 6 (chosen on the Training Days screen)
- `experience_level` — Beginner, Intermediate, or Advanced (chosen on the optional difficulty filter)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Seamless Transition to Dashboard (Priority: P1)

A user who just submitted their registration form is automatically authenticated and arrives on their personalized dashboard — with their selected workout program already active — without any additional steps, prompts, or login screens.

**Why this priority**: The user has already invested time selecting their goal, training days, and program. Any friction between "Create Account" and the dashboard abandons them at the highest-intent moment.

**Independent Test**: A user submits the registration form and lands on the dashboard with their program active, without touching any other screen.

**Acceptance Scenarios**:

1. **Given** a user submits valid registration data, **When** the account is created successfully, **Then** the user is automatically authenticated and navigated to the dashboard without seeing a login form.
2. **Given** registration succeeds, **When** the user arrives on the dashboard, **Then** the workout program they selected during onboarding is visible and ready to start.
3. **Given** registration succeeds, **When** the transition to dashboard occurs, **Then** no intermediate screens ("Registration Complete", "Check Your Email", loading splash) are shown.

---

### User Story 2 - Preferences Saved Without User Action (Priority: P1)

The goal type, training days per week, and difficulty level the user selected during onboarding are automatically saved to their account immediately after registration — without requiring any additional form submission or confirmation step.

**Why this priority**: The user has already provided this information during browsing. Asking again wastes their time and creates drop-off. The save must be invisible to the user.

**Independent Test**: After registration, the user's account has `primary_goal`, `training_days_per_week`, and `experience_level` populated — verified by checking their profile — without the user taking any additional action.

**Acceptance Scenarios**:

1. **Given** registration succeeds and the user selected "Physique" + "4 days" during onboarding, **When** the dashboard loads, **Then** their saved preferences reflect `primary_goal: physique` and `training_days_per_week: 4`.
2. **Given** the preference save fails in the background, **When** the user reaches the dashboard, **Then** the app continues to function normally and retries saving preferences silently (preferences are not required to access core features).
3. **Given** registration succeeds, **When** preferences are saved, **Then** `onboarding_completed` is set to `true` on the user's record.

---

### User Story 3 - Session Persists Across App Restarts (Priority: P2)

A user who registered yesterday closes the app and reopens it. They land directly on the dashboard — not the login screen.

**Why this priority**: Forcing re-login on every open is a critical UX failure for a fitness app opened frequently (before each workout).

**Independent Test**: A user registers, force-quits the app, reopens it, and arrives on the dashboard without entering credentials.

**Acceptance Scenarios**:

1. **Given** a user is authenticated, **When** they close and reopen the app within 30 days, **Then** they land on the dashboard without re-authenticating.
2. **Given** a user is authenticated, **When** they open the app with no network connection, **Then** they see the last-viewed screen with a non-blocking offline notice rather than the login screen.
3. **Given** a user's session has expired (30+ days inactive), **When** they reopen the app, **Then** they are redirected to the login screen and a non-blocking toast explains their session expired.

---

### Edge Cases

- If the JWT is lost or corrupted in SecureStore on app reopen, the user sees a clear message directing them to log in.
- If the post-registration navigation to the dashboard fails, the user sees an error with a recovery path (not a blank screen).
- If a session token expires while the app is open, a silent background token refresh is attempted first; the user is only redirected to login if the refresh fails.
- If the preference save API call fails, the dashboard still loads and the app retries in the background — the user is never blocked.

## Clarifications

### Session 2026-02-24

- Q: When a user's session expires while actively using the app, what should happen? → A: Attempt a silent background token refresh; only redirect to login if refresh fails.
- Q: When a user opens the app offline with a valid session, what should they see? → A: Show the last-viewed screen with a non-blocking offline notice; sync when connection restores.
- Q: What form does the session expiry message take when redirecting to login? → A: A non-blocking toast or banner on the login screen informing the user their session expired.

### Flow Correction 2026-02-24

- Goal/preference selection happens BEFORE registration (in `003-goal-selection`), not after. Post-reg flow only handles auto-saving of already-collected preferences. Goal selection is not a destination — the dashboard is.

## Assumptions

- The user's goal type, training days per week, and experience level are collected before registration and are available in app state when registration completes.
- If no preferences were collected (e.g., user navigated directly to the signup screen), the preference save is skipped and the user can set preferences later from their profile.
- The 30-day session window may be extended by continued activity (rolling expiry).
- Email verification is a future enhancement; its absence does not affect this feature.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: After successful registration, the user MUST be automatically authenticated; no separate login step is required.
- **FR-002**: The user MUST be navigated directly to the dashboard after registration. No intermediate screens MUST appear.
- **FR-003**: After successful registration, any pre-registration preferences (primary_goal, training_days_per_week, experience_level) MUST be automatically POSTed to the user preferences API without requiring user action.
- **FR-004**: If the preference save fails, the app MUST continue to function normally. The failure MUST NOT block navigation to the dashboard.
- **FR-005**: The user's authenticated session MUST persist when the app is closed and reopened, for a minimum of 30 days from registration or last login.
- **FR-006**: When the user's session has expired, they MUST be redirected to the login screen. A non-blocking toast or banner MUST be displayed informing them their session expired.
- **FR-007**: When a session token expires while the user is actively using the app, a silent background token refresh MUST be attempted first. The user MUST only be redirected to login if the refresh fails.
- **FR-008**: When the user opens the app offline with a valid session, they MUST see the last-viewed screen with a non-blocking offline notice. Access MUST NOT be blocked.

### Key Entities

- **Authenticated Session**: Begins at the moment of successful registration. Stored as a JWT in SecureStore (`authToken` key). Persists for a minimum of 30 days. Ends on explicit logout or expiry.
- **User Preferences**: `primary_goal` (physique/strength), `training_days_per_week` (3–6), `experience_level` (Beginner/Intermediate/Advanced). Collected during pre-registration onboarding, saved automatically post-registration. `onboarding_completed` is set to `true` once both `primary_goal` and `training_days_per_week` are saved.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of successful registrations result in the user reaching the dashboard without an additional login step.
- **SC-002**: 100% of successful registrations where onboarding preferences were collected result in those preferences being saved to the user's account.
- **SC-003**: A user reaches the dashboard within 3 seconds of registration completing, with no additional steps.
- **SC-004**: 100% of users who reopen the app within 30 days of their last login are still authenticated and do not see the login screen.
- **SC-005**: 0% of users are blocked from the dashboard due to a preference save failure.
