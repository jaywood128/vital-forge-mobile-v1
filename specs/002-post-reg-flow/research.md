# Research: Post-Registration Flow

**Branch**: `002-post-reg-flow` | **Date**: 2026-02-24

## Decision: Fire-and-Forget Preference Save

**Decision**: Call `createUserPreference` without awaiting or blocking navigation on failure.

**Rationale**: FR-004 explicitly states preference save failure MUST NOT block the dashboard. The user has already waited for registration; adding another async wait degrades the "instant transition" success criterion (SC-003: within 3 seconds). Preferences can be re-attempted later from a profile settings screen.

**Alternatives considered**: Awaiting the save and showing a spinner — rejected because it introduces visible latency and a new failure mode that blocks dashboard access.

## Decision: Onboarding State in Redux (not route params)

**Decision**: Hold `goal_type`, `training_days_per_week`, `experience_level`, and `selected_template_id` in a dedicated Redux slice (`onboardingSlice`), not passed as route params to signup.

**Rationale**: Route params in Expo Router are URL-based strings; passing structured objects is awkward and breaks type safety. Redux state survives navigation within the same session, persists across backgrounding, and is trivially accessible from the signup screen via `useSelector`.

**Alternatives considered**: Expo Router `params` — rejected due to serialization limits. React Context — rejected because Redux is already the state management layer per Principle IV.

## Decision: Jest + jest-expo for Testing

**Decision**: Use `jest-expo` preset with `@testing-library/react-native` for all tests.

**Rationale**: `jest-expo` is the official Expo-maintained Jest preset. It handles all React Native module mocks (including `expo-secure-store`, `expo-router`) and is compatible with SDK 54. `@testing-library/react-native` provides `render`, `fireEvent`, `waitFor` — the standard testing utilities for React Native component tests.

**Alternatives considered**: Detox (E2E) — deferred, too heavy for unit/integration tests at this stage.

## API Endpoint Compatibility

All required endpoints exist in the Rails backend and accept JWT for mobile:

| Endpoint | Auth | Used for |
|----------|------|----------|
| `POST /api/v1/mobile/signup` | None | Registration |
| `POST /api/v1/user_preference` | JWT Bearer | Save onboarding preferences |
| `GET /api/v1/user_preference` | JWT Bearer | Read preferences (future) |
| `PATCH /api/v1/user_preference` | JWT Bearer | Update preferences (future) |

No new backend endpoints required for this feature.
