# Feature Specification: Seamless Post-Registration Flow

**Feature Branch**: `002-post-reg-flow`
**Created**: 2026-02-06
**Status**: Draft
**Input**: User description: "REQ-REG-003: Seamless Post-Registration Flow — After successful registration, user automatically logged in, redirected to goal selection or workout template list, can access all core features without completing profile, session persists across app restarts."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Immediate Access After Registration (Priority: P1)

A new user who just completed registration is instantly authenticated and taken directly to their first useful screen. There is no intermediate "success" page, no "check your email" wall, and no additional login step required.

**Why this priority**: This is the direct continuation of the registration flow. Any friction here abandons users at the highest-intent moment — right after they decided to sign up. A broken or blocked post-registration transition directly reduces conversion to active users.

**Independent Test**: A new user completes registration and reaches a screen with actionable content (goal selection or template list) without any additional steps. This alone delivers a working end-to-end onboarding path.

**Acceptance Scenarios**:

1. **Given** a user has just completed registration with valid data, **When** the account is created successfully, **Then** the user is immediately authenticated and taken to the next onboarding screen without seeing a login form.
2. **Given** a user has just registered, **When** they arrive on the first post-registration screen, **Then** no "check your email" message or email verification prompt blocks their progress.
3. **Given** a user has just registered, **When** they arrive on the first post-registration screen, **Then** they can access core features (browse templates, start a workout) without completing any additional profile information.

---

### User Story 2 - Session Persists Across App Restarts (Priority: P2)

A user who registered yesterday closes the app and opens it again today. They are still logged in and land directly on a usable screen — not the login screen.

**Why this priority**: Forcing re-login on every app open is a significant UX failure for a fitness app, where users open it frequently (before each workout). Session persistence is expected behavior for any consumer mobile app.

**Independent Test**: A user registers, closes the app completely, reopens it, and arrives on a logged-in screen without entering credentials again.

**Acceptance Scenarios**:

1. **Given** a user is authenticated, **When** they close the app and reopen it within 30 days, **Then** they are still logged in and land on a functional screen.
2. **Given** a user is authenticated, **When** 30 days have not yet elapsed since their last login, **Then** they are not prompted to log in again.
3. **Given** a user is authenticated, **When** their session has expired (after 30+ days of inactivity), **Then** they are redirected to the login screen with a clear explanation.

---

### User Story 3 - Unverified Email Does Not Block Features (Priority: P3)

A user who has not yet verified their email address can still browse workout templates, start workouts, and use all core features of the app.

**Why this priority**: Requiring email verification before allowing any app use creates an unnecessary drop-off point, especially for users who check email infrequently. Core functionality must be immediately available.

**Independent Test**: A newly registered user with an unverified email can browse templates and start a workout without encountering a verification gate.

**Acceptance Scenarios**:

1. **Given** a user has registered but not verified their email, **When** they navigate to the template list, **Then** they can view and interact with templates without restriction.
2. **Given** a user has registered but not verified their email, **When** they attempt to start a workout, **Then** they are not blocked or warned about email verification status.
3. **Given** email verification is implemented, **When** a user registers, **Then** a verification email is sent in the background without any visible delay or screen disruption to the user.

---

### Edge Cases

- What happens if the session token is lost or corrupted when the app reopens — does the user see a clear message directing them to log in?
- What happens if the post-registration redirect fails — does the user end up on a blank or broken screen?
- What happens when a user's session expires mid-use (while the app is open) — are they gracefully redirected to the login screen?
- What happens if the next screen (goal selection or template list) fails to load — is the user stuck or shown an error with a recovery path?

## Assumptions

- A goal selection screen exists as the first post-registration destination (implemented as feature `003-goal-selection`).
- If the goal selection screen is skipped or unavailable, the user is taken to the workout template list.
- Email verification is treated as a future enhancement; the absence of a verification system does not affect this feature.
- The 30-day session duration is the minimum; the system may extend this based on continued activity.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: After successful registration, the user MUST be automatically authenticated; no separate login step is required.
- **FR-002**: The user MUST be redirected immediately to the goal selection screen (or template list if goal selection is unavailable) after registration.
- **FR-003**: No intermediate screen (such as a "Registration Successful" confirmation or "Check Your Email" prompt) MUST appear between registration completion and the first functional screen.
- **FR-004**: The user MUST be able to access all core features (browse workout templates, start a workout) without completing any additional profile information after registration.
- **FR-005**: The user's authenticated session MUST persist when the app is closed and reopened, for a minimum of 30 days from the point of registration or last login.
- **FR-006**: When the user's session has expired, they MUST be redirected to the login screen with a clear indication that they need to sign in again.
- **FR-007**: If email verification is implemented, the verification message MUST be sent in the background and MUST NOT display any blocking screen or prompt to the user.
- **FR-008**: An unverified email address MUST NOT restrict the user from accessing any core feature of the application.

### Key Entities

- **Authenticated Session**: Represents an active logged-in state for a user. Begins at the moment of successful registration. Persists across app restarts for a minimum of 30 days. Ends on explicit logout or session expiry.
- **User Profile**: Represents the registered user's account. Can exist in a partially complete state (goal not set, preferences not configured) without restricting access to core features.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user reaches a functional screen with actionable content within 3 seconds of completing registration, with no additional steps required.
- **SC-002**: 100% of successful registrations result in the user being authenticated and able to access core features immediately, without an additional login step.
- **SC-003**: 100% of users who reopen the app within 30 days of their last login are still authenticated and do not see the login screen.
- **SC-004**: 0% of users are blocked from core features due to email verification status.
- **SC-005**: A new user can browse workout templates within 1 minute of completing registration, without completing any additional profile steps.
